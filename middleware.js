const Listing = require("./models/listing");
const Review = require("./models/review");
const {listingSchema,reviewSchema} = require("./schema.js");
const ExpressError= require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to create listings!!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id); // ✅ await added

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (
    !listing.owner || 
    !res.locals.currentUser || 
    !listing.owner.equals(res.locals.currentUser._id)
  ) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }

  next(); // ✅ call next if owner is correct
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let {id, reviewId } = req.params;
  let review = await Review.findById(reviewId); // ✅ await added


  if (! review.author.equals(res.locals.currentUser._id)){
    req.flash("error","You are not the author of this review")
    return res.redirect(`/listings/${id}`)
  }
   

  next(); // ✅ call next if owner is correct
};

module.exports.validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body);
   
    if(error){
      throw new ExpressError(400,error);
    }else{
      next();
    }
   
}

module.exports.validateReview = (req,res,next)=>{
  let {error} = reviewSchema.validate(req.body);
  if(error){
    throw new ExpressError(400, error.details.map(el=>el.message).join(","));
  } else {
    next();
  }
}