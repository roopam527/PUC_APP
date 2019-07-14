const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const status = require('../utility/challengStatus');
const challengeSchema = mongoose.Schema({
	title :  {type:String , required:true},
    description : {type: String,required:true},
    creator:{
        required:true,
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    filetype : {type:String,required:true},
    given_to:[{
        user:{  
            type: [Schema.Types.ObjectId],
            ref: 'users'
        },
        status:{
            type:String,
            default:status[0]
        } ,
        default:[]
    }],
});
challengeSchema.plugin(uniqueValidator);
module.exports = mongoose.model("challenges",challengeSchema);