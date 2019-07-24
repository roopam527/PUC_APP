const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
const status = require("../utility/challengStatus");
const challengeSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  filetype: { type: String, required: true },

  given_to: [
    {
      user_id: Schema.Types.ObjectId, //two ids?
      status: {
        type: String,
        default: status[0] //status date
      },
      date: {
        type: String,
        default: ""
      }
    }
  ], //challenge date
  date: {
    type: String,
    default: Date.now()
  }
});
challengeSchema.plugin(uniqueValidator);
module.exports = mongoose.model("challenges", challengeSchema);
