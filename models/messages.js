
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messagesSchema = new Schema({
    message_type:{
        type:String,
        required:true
    },
    message:{
        type:String,
        default:null
    },
    image:{
        type:String,
        default:null
    },
    sender:{
        required:true,
        type: Schema.Types.ObjectId,
         ref: 'users'
    },
    receiver:{
        type: [Schema.Types.ObjectId],
         ref: 'users',
        default:[]
    },
    time:{
        type:String,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    seenBy:{
        type:[
            {type: String, ref: 'users'}
          ],
          default:[]
    }
});


mongoose.model('messages', messagesSchema);
