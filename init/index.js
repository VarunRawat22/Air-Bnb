const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");  // ✅ Import User model

// MongoDB connection string
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Connect to DB
main()
  .then(() => console.log("connected to DB"))
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  // ✅ Delete old listings before inserting fresh data
  await Listing.deleteMany({});

  // ✅ Check if at least one user exists, else create a default seed user
  let user = await User.findOne();
  if (!user) {
    user = new User({
      email: "seeduser@example.com",
      username: "seed_user"
    });

    // User.register => from passport-local-mongoose (hashes password automatically)
    await User.register(user, "seedpassword");
    console.log("Default user created:", user.username);
  }

  // ✅ Assign correct ObjectId of the user to all listings
  // `new mongoose.Types.ObjectId()` is required (not just mongoose.Types.ObjectId)
  initData.data = initData.data.map(obj => ({
    ...obj,
    owner: new mongoose.Types.ObjectId(user._id) // ✅ fixed with `new`
  }));

  // ✅ Insert the updated listings into DB
  await Listing.insertMany(initData.data);
  console.log("Data was initialized with owner:", user.username);
};

// Run the seeding function
initDB();
