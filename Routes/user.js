const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl}=require("../middleware.js");

const userController=require("../controllers/users.js");

router.route("/signup")
      .get(userController.renderSignupForm)
      .post(wrapAsync(userController.signUp)); //signup

// sanme router.route login k liye b kr skte h lekin m nhi kr rha taki phr se padhu toh samaj aa sake


router.get("/login",userController.renderLoginForm);

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
  userController.login
);


router.get("/logout",userController.logout);

module.exports=router;