const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
ObjectId = require("mongodb").ObjectID;
const stories = mongoose.model("stories");
const User = mongoose.model("users");
const requireLogin = require("../middlewares/requireLogin");
const { isLength } = require('validator');
const path = require("path");
const multer = require("multer");
const uuidv4 = require("uuid/v4");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/story_pics");
  },
  filename: function(req, file, cb) {
    cb(null, uuidv4() + file.originalname.split(" ").join(""));
  }
});

const fileFilter = (req, file, cb) => {
  var ext = path.extname(file.originalname);
  if (ext === ".jpeg" || ext === ".png") {
    cb(null, true);
  } else {
    return cb(null, new Error("Only images are allowed"));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post("/create", requireLogin, upload.single("story_pic"), async (req, res, next) => {
  console.log(req.body)
  if(!isLength(req.body.receiver, { min: 1 })){
    return res.status(200).json({
        message: "Invalid receiver"
    });
  }
  if(req.userData.userId === req.body.receiver){
    return res.status(200).json({
        message: "Sender and Receiver should be different"
    });
  }
  try{
    const sender = await User.findById(req.userData.userId);
    const receiver = await User.findById(req.body.receiver);
    const story = new stories({
      sender: req.userData.userId,
      receiver: req.body.receiver,
      image: "/" + req.file.path,
      isPosted: false,
      createdAt: Date.now(),
    });

    const data = await story.save();
    sender.Send_Stories.push(data._id);
    receiver.Received_Stories.push(data._id);
    await sender.save();
    await receiver.save();
    return res.status(200).json({
    message: "story added successfully"
    });
  } catch(err){
    console.log(err)
    return res.status(200).json({
        message: "story creation failed"
    });
  }
});

router.get("/received-stories", requireLogin, async (req, res, next) => {
    if(!req.query.user_id){
        return res.status(200).json({
            message: "Invalid user id"
        });
    }
    try{
        const receiver = await User.findById(req.query.user_id);
        let data = {
          receiver_profile_pic: receiver.profile_pic,
          receiver_username: receiver.username
        }
        const received_stories = await Promise.all(receiver.Received_Stories.map(async (story) => {
            let data = {};
            const received_story = await stories.findById(story);
            const sender = await User.findById(received_story.sender);
            data.sender_profile_pic = sender.profile_pic;
            data.sender_username = sender.username;
            data.sender_id = sender.id;
            data.image = received_story.image;
            return data;
        }));
        data.stories = received_stories
        res.status(200).json(data);
    } catch(err) {
      console.log(err)
        return res.status(200).json({
            message: "Unable to fetch stories"
        });
    }
});

module.exports = router;
