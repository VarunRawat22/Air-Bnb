const User= require("../models/user")

module.exports.renderSignupForm= (req,res)=>{
    res.render("users/signup.ejs")
}

module.exports.signUp = async (req, res, next) => {
  try {
    let { username, password, email } = req.body;
    
    console.log("👤 Creating new user:", username, email);
    
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log("✅ User registered in Atlas DB:", registeredUser._id);
    
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      } else {
        req.flash("success", "Welcome to WanderLust! Account created successfully!");
        res.redirect("/listings");
      }
    });
  } catch (error) {
    console.error("❌ Error during user registration:", error);
    
    if (error.name === 'UserExistsError') {
      req.flash("error", "A user with the given username is already registered");
    } else if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      req.flash("error", `Validation Error: ${errorMessages.join(', ')}`);
    } else {
      req.flash("error", error.message || "Registration failed. Please try again.");
    }
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm= (req,res)=>{
    res.render("users/login.ejs")

}

module.exports.login = async (req, res) => {
  try {
    console.log("👤 User logged in:", req.user.username);
    req.flash("success", "Welcome back to WanderLust!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Error during login:", error);
    req.flash("error", "Login failed. Please try again.");
    res.redirect("/login");
  }
};

module.exports.logout = (req, res, next) => {
  try {
    console.log("👤 User logging out:", req.user ? req.user.username : 'Unknown');
    
    req.logOut((err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "You have been logged out successfully!");
      res.redirect("/listings");
    });
  } catch (error) {
    console.error("❌ Error during logout:", error);
    req.flash("error", "Logout failed. Please try again.");
    res.redirect("/listings");
  }
};