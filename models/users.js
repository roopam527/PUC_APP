const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: {
        type:String,
        required:true,
        unique : true
    },
    username: {
        type:String ,
         required:true,
         unique:true},
    password: {
        type: String,
        required:true
    },
    bio: { 
        type:String,
        default:"Hey there , I am using PUC APP"
    },
    isPrivate: { 
        type:Boolean,
        default:false
    },
    blocked_accounts:{
        type: [Schema.Types.ObjectId],
         ref: 'users',
        default:[]
    },
    followers:{
        type: [Schema.Types.ObjectId],
         ref: 'users',
        default:[]
    },
    followings:{
        type: [Schema.Types.ObjectId],
         ref: 'users',
        default:[]
    },
    profile_pic:{
        type:String
    }

});
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("users",userSchema);