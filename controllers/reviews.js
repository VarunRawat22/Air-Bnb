const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
  try {
    console.log("📝 Creating review for listing:", req.params.id);
    console.log("📝 Review data:", req.body.review);
    
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    newReview.createdAt = new Date();

    // Save review to Atlas DB
    const savedReview = await newReview.save();
    console.log("✅ Review saved to Atlas DB:", savedReview._id);

    // Add review to listing
    listing.reviews.push(savedReview._id);
    listing.updatedAt = new Date();
    await listing.save();
    console.log("✅ Review added to listing in Atlas DB");

    req.flash("success", "Review Added Successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (error) {
    console.error("❌ Error creating review:", error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      req.flash("error", `Review Error: ${errorMessages.join(', ')}`);
    } else {
      req.flash("error", "Failed to add review. Please try again.");
    }
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.destroyReview = async (req, res) => {
  try {
    let { id, reviewId } = req.params;
    reviewId = reviewId.trim(); // Remove extra spaces

    console.log("🗑️ Deleting review:", reviewId, "from listing:", id);

    // Verify review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash("error", "Review not found");
      return res.redirect(`/listings/${id}`);
    }

    // Remove review from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    
    // Delete review from Atlas DB
    await Review.findByIdAndDelete(reviewId);
    console.log("✅ Review deleted from Atlas DB:", reviewId);

    req.flash("success", "Review Deleted Successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    
    if (error.name === 'CastError') {
      req.flash("error", "Invalid review ID format");
    } else {
      req.flash("error", "Failed to delete review. Please try again.");
    }
    res.redirect(`/listings/${req.params.id}`);
  }
};