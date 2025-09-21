const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose= require("passport-local-mongoose");

const userSchema=new Schema({
    email:{                  //password and username password-local-mongoose apne aap define kr deta h issliye ham bass email save kr rhe h
        type:String,
        required: true

    }
})


userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', userSchema);     // userSchema ko as a user export kr diya