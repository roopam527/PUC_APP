
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allChatsSchema = new Schema({
  name:{
    type:String,
    default:"personal",
  },
  users:{
      type:[
        {type: Schema.Types.ObjectId, ref: 'users'}
      ]
  },
  time_of_creation:{
    type:String,
    default:moment().format('LLL')
  },
//   date_of_creation:{
//     type:String

//   },
  messages:[
    {type: Schema.Types.ObjectId, ref: 'messages'}
  ]
});


mongoose.model('allChats', allChatsSchema);
