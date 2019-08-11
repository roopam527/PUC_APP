const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
const storySchema = mongoose.Schema({
      sender: { type: Schema.Types.ObjectId, required: true },
      receiver: { type: Schema.Types.ObjectId, required: true },
      image: { type: String, required: true },
      isPosted: {type: Boolean, required: true },
      createdAt: { type: String, default: Date.now(), required: true }
});
storySchema.plugin(uniqueValidator);
module.exports = mongoose.model("stories", storySchema);
