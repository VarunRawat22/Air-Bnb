const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js');

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    
    images: [{
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    }],
    // Keep the old image field for backward compatibility
    image: {
        type: Schema.Types.Mixed, // Can be either a string or an object
        default: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
        get: function(data) {
            // If it's an object with url property, return the url
            if(typeof data === 'object' && data !== null && data.url) {
                return data.url;
            }
            // Otherwise return the data as is (string)
            return data;
        },
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },

    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review"
    },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"             //qoki user.js se hi owner login krega
    },
    geometry:{
        type:{
            type:String,
            enum:["Point"],   // sirf point hi hoga
            required:false
        },
        coordinates:{
            type:[Number],   // array of numbers hoga
            required:false
        }

    }

}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

listingSchema.post("findOneAndDelete", async(listing) =>{
    if(listing){
        await Review.deleteMany({ _id:{$in:listing.reviews}});  // listing dlt ho rhi h toh uske corresponding reviews ko b dlt kr dega by deliting their id
    }

});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;