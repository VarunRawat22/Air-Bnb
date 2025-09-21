const express=require("express");
const router=express.Router({mergeParams:true});

const wrapAsync = require("../utils/wrapAsync.js");

const Review = require('../models/review.js');
const Listing = require("../models/listing.js");
const {validateReview, isLoggedIn, isReviewAuthor}=require("../middleware.js")

const reviewController=require("../controllers/reviews.js")





//review 
//POST Review route
router.post("/",isLoggedIn,validateReview,         //validateReview ko as a middleware pass kr diya  => hopscotch se bina review k req bhejne p error aayega ab
  wrapAsync(reviewController.createReview));

//Delete Review Route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,
   wrapAsync(reviewController.destroyReview));


module.exports=router;                // common part for reviews== /listings/:id/reviews