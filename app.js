if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
  console.log("Cloudinary Name:", process.env.CLOUD_NAME);
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const initData = require("./init/data.js");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user.js");

// Routes
const listingRouter = require("./Routes/listing.js");
const reviewRouter = require("./Routes/review.js");
const userRouter = require("./Routes/user.js");
const bookingRouter = require("./Routes/booking.js");
const chatbotRouter = require("./Routes/chatbot.js");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Atlas Connection
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log(" Connected to MongoDB Atlas successfully");
  })
  .catch((err) => {
    console.error(" MongoDB Atlas connection failed:", err.message);
    process.exit(1);
  });

async function main() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('connected', () => {
      console.log(' Mongoose connected to MongoDB Atlas');
    });

    mongoose.connection.on('error', (err) => {
      console.error(' Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log(' Mongoose disconnected from MongoDB Atlas');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(' Mongoose connection closed through app termination');
      process.exit(0);
    });

    // Initialize DB with sample data if empty
    const count = await Listing.countDocuments({});
    if (count === 0) {
      await Listing.insertMany(initData.data);
      console.log(" Database initialized with sample data");
    } else {
      console.log(` Database already contains ${count} listings`);
    }
  } catch (error) {
    console.error(" Database initialization failed:", error);
    throw error;
  }
}

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// ⭐ Render proxy fix
app.set("trust proxy", 1);

// Session & Flash Configuration
const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  collectionName: "sessions",
  touchAfter: 24 * 3600,
  crypto: {
    secret: process.env.SESSION_SECRET || "fallback-secret-key"
  }
});

store.on('connected', () => {
  console.log(' Session store connected to MongoDB Atlas');
});
store.on('error', (error) => {
  console.error(' Session store error:', error);
});
store.on('disconnected', () => {
  console.log(' Session store disconnected from MongoDB Atlas');
});

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "fallback-secret-key",
  resave: false,
  saveUninitialized: false,   // ⭐ changed to false
  store,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === "production", // HTTPS only
    sameSite: "lax" // same domain so lax is safe
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & User Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Demo User Creation
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "sutudent@gmail.com",
    username: "nikhil",
  });
  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});

// Routers
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/bookings", bookingRouter);
app.use("/chatbot", chatbotRouter);
app.use("/", userRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(" Application Error:", err.stack);

  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    err.message = "Database connection lost. Please try again later.";
    err.status = 503;
  } else if (err.name === 'ValidationError') {
    err.message = "Invalid data provided. Please check your input.";
    err.status = 400;
  } else if (err.name === 'CastError') {
    err.message = "Invalid ID format.";
    err.status = 400;
  } else if (err.code === 11000) {
    err.message = "Duplicate entry found. This item already exists.";
    err.status = 409;
  }

  res.status(err.status || 500).render("error.ejs", { err });
});

// Server Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(` Server is listening on port ${PORT}`);
});
