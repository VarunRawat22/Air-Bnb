const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    // createdAt and updatedAt will be handled by timestamps option
    author:{
        type: Schema.Types.ObjectId,
        ref:"User"                    // jo user logged in hoga wahi hamra author bnega
    }
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model("Review", reviewSchema);
