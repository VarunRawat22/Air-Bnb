const Listing = require("../models/listing.js");
const axios = require("axios");
const { cloudinary } = require("../cloudConfig.js");

// ✅ Helper function for geocoding
async function getCoordinatesFromLocation(location) {
  if (!location || typeof location !== 'string' || location.trim() === '') {
    console.log("❌ Invalid location provided for geocoding:", location);
    return null;
  }

  try {
    console.log("🌍 Attempting to geocode location:", location);
    
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { 
        q: location.trim(), 
        format: "json", 
        limit: 1,
        addressdetails: 1,
        extratags: 1
      },
      headers: { "User-Agent": "AirBnB-Clone/1.0" },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
        console.log("❌ Invalid coordinates received for:", location, "lat:", lat, "lon:", lon);
        return null;
      }
      
      console.log("✅ Successfully geocoded:", location, "->", lat, lon);
      return {
        type: "Point",
        coordinates: [lon, lat] // Note: MongoDB expects [longitude, latitude]
      };
    } else {
      console.log("❌ No results found for location:", location);
    }
  } catch (error) {
    console.error("❌ Geocoding error for:", location, error.message);
    if (error.code === 'ECONNABORTED') {
      console.error("❌ Geocoding request timed out for:", location);
    }
  }

  return null;
}

// 🏠 Show all listings
module.exports.index = async (req, res) => {
  try {
    const allListings = await Listing.find({}).populate('owner').sort({ createdAt: -1 });
    res.render("listings/index.ejs", { allListings });
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    req.flash("error", "Failed to load listings. Please try again.");
    res.render("listings/index.ejs", { allListings: [] });
  }
};

// 🔍 Search listings
module.exports.search = async (req, res) => {
  try {
    const { location, checkin, checkout, guests, category } = req.query;
    let query = {};

    if (!location && !checkin && !checkout && !guests && !category) {
      return res.redirect("/listings");
    }

    if (location) {
      query.$or = [
        { title: { $regex: location, $options: "i" } },
        { description: { $regex: location, $options: "i" } },
        { location: { $regex: location, $options: "i" } },
        { country: { $regex: location, $options: "i" } }
      ];
    }

    const allListings = await Listing.find(query).populate('owner').sort({ createdAt: -1 });

    res.render("listings/index.ejs", {
      allListings,
      searchQuery: location,
      searchParams: { location, checkin, checkout, guests, category }
    });
  } catch (error) {
    console.error("❌ Error searching listings:", error);
    req.flash("error", "Search failed. Please try again.");
    res.redirect("/listings");
  }
};

// ➕ Render new listing form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// 📄 Show one listing
module.exports.showListings = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" }
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested for does not exist");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (error) {
    console.error("❌ Error fetching listing:", error);
    if (error.name === 'CastError') {
      req.flash("error", "Invalid listing ID format");
    } else {
      req.flash("error", "Failed to load listing. Please try again.");
    }
    res.redirect("/listings");
  }
};

// 🆕 Create a new listing
module.exports.createListing = async (req, res) => {
  try {
    let geometry = null;

    if (req.body.listing.location) {
      geometry = await getCoordinatesFromLocation(req.body.listing.location);
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Handle multiple image uploads
    if (req.files && req.files.length > 0) {
      newListing.images = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));
      // Set the first image as the main image for backward compatibility
      newListing.image = { url: req.files[0].path, filename: req.files[0].filename };
    } else if (req.body.listing.image && req.body.listing.image.trim() !== '') {
      // If no files uploaded but image URL provided
      newListing.image = req.body.listing.image;
    } else {
      // If no images uploaded, use default image
      newListing.image =
        "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60";
    }

    if (geometry) {
      newListing.geometry = geometry;
    }

    // Add timestamp
    newListing.createdAt = new Date();
    newListing.updatedAt = new Date();

    const savedListing = await newListing.save();
    console.log("✅ New listing saved to Atlas DB:", savedListing._id);
    
    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
  } catch (error) {
    console.error("❌ Error creating listing:", error);
    
    // Clean up uploaded files if database save fails
    if (req.files && req.files.length > 0) {
      try {
        for (let file of req.files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      } catch (cleanupError) {
        console.error("❌ Error cleaning up files:", cleanupError);
      }
    }
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      req.flash("error", `Validation Error: ${errorMessages.join(', ')}`);
    } else {
      req.flash("error", "Failed to create listing. Please try again.");
    }
    res.redirect("/listings/new");
  }
};

// ✏️ Render edit form
module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing you requested for does not exist");
      return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
  } catch (error) {
    console.error("❌ Error fetching listing for edit:", error);
    if (error.name === 'CastError') {
      req.flash("error", "Invalid listing ID format");
    } else {
      req.flash("error", "Failed to load listing for editing. Please try again.");
    }
    res.redirect("/listings");
  }
};

// 🔄 Update listing
module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    let geometry = null;
    if (req.body.listing.location) {
      geometry = await getCoordinatesFromLocation(req.body.listing.location);
    }

    let listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Update basic fields
    Object.assign(listing, req.body.listing);

    // Handle image deletion if requested
    if (req.body.deleteImages) {
      const imagesToDelete = Array.isArray(req.body.deleteImages) ? req.body.deleteImages : [req.body.deleteImages];
      
      for (let filename of imagesToDelete) {
        if (filename) {
          try {
            await cloudinary.uploader.destroy(filename);
          } catch (deleteError) {
            console.error("❌ Error deleting image from Cloudinary:", deleteError);
          }
        }
      }
      
      // Remove deleted images from database
      listing.images = listing.images.filter(img => !imagesToDelete.includes(img.filename));
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));
      
      listing.images.push(...newImages);
      
      // Update main image to the first uploaded image if no images exist
      if (listing.images.length === newImages.length) {
        listing.image = { url: newImages[0].url, filename: newImages[0].filename };
      }
    }

    // Handle image URL update if provided and no files uploaded
    if (!req.files || req.files.length === 0) {
      if (req.body.listing.image && req.body.listing.image.trim() !== '') {
        listing.image = req.body.listing.image;
      }
    }

    if (geometry) {
      listing.geometry = geometry;
    }

    // Update timestamp
    listing.updatedAt = new Date();

    const updatedListing = await listing.save();
    console.log("✅ Listing updated in Atlas DB:", updatedListing._id);

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("❌ Error updating listing:", error);
    
    // Clean up uploaded files if database update fails
    if (req.files && req.files.length > 0) {
      try {
        for (let file of req.files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      } catch (cleanupError) {
        console.error("❌ Error cleaning up files:", cleanupError);
      }
    }
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      req.flash("error", `Validation Error: ${errorMessages.join(', ')}`);
    } else {
      req.flash("error", "Failed to update listing. Please try again.");
    }
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};

// ❌ Delete listing
module.exports.destroyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    
    // Delete all images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      for (let img of listing.images) {
        if (img.filename) {
          try {
            await cloudinary.uploader.destroy(img.filename);
          } catch (deleteError) {
            console.error("❌ Error deleting image from Cloudinary:", deleteError);
          }
        }
      }
    }
    
    // Delete from Atlas DB (this will also trigger the post middleware to delete reviews)
    await Listing.findByIdAndDelete(id);
    console.log("✅ Listing deleted from Atlas DB:", id);

    req.flash("success", "Listing Deleted Successfully!");
    res.redirect("/listings");
  } catch (error) {
    console.error("❌ Error deleting listing:", error);
    req.flash("error", "Failed to delete listing. Please try again.");
    res.redirect("/listings");
  }
};

// 🌍 Geocode listing
module.exports.geocodeListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    if (!listing.location || listing.location.trim() === '') {
      req.flash("error", "Listing has no location to geocode");
      return res.redirect(`/listings/${id}`);
    }

    console.log("🌍 Geocoding listing:", listing.title, "Location:", listing.location);
    const geometry = await getCoordinatesFromLocation(listing.location);

    if (geometry && geometry.coordinates && geometry.coordinates.length === 2) {
      listing.geometry = geometry;
      listing.updatedAt = new Date();
      await listing.save();
      console.log("✅ Listing coordinates updated in Atlas DB:", listing._id, "Coordinates:", geometry.coordinates);
      req.flash("success", `Location coordinates updated successfully! (${geometry.coordinates[1]}, ${geometry.coordinates[0]})`);
    } else {
      console.log("❌ Failed to geocode location:", listing.location);
      req.flash("error", `Could not find coordinates for "${listing.location}". Please try a more specific location.`);
    }

    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("❌ Error geocoding listing:", error);
    req.flash("error", "Failed to update coordinates. Please try again.");
    res.redirect(`/listings/${req.params.id}`);
  }
};
