const express = require("express");
const router = express.Router();
const { upload } = require("../cloudConfig.js");

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

// Search route
router.get("/search", wrapAsync(listingController.search));

// Geocoding route
router.post("/:id/geocode", isLoggedIn, isOwner, wrapAsync(listingController.geocodeListing));

router.route("/")
  .get(wrapAsync(listingController.index))   // Index route
  .post(isLoggedIn, upload.array('images', 10), validateListing, wrapAsync(listingController.createListing));

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/:id")
  .get(wrapAsync(listingController.showListings))  // Show Route
  .put(isLoggedIn, isOwner, upload.array('images', 10), validateListing, wrapAsync(listingController.updateListing)) // Update Route
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing)); // Delete route

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
