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
        const userStories = await stories.find(req.query.sto);
        const comments = await Promise.all(doneChallenge.comments.map(async (c) => {
            let comment = {
                comment: c.comment,
                createdAt: c.createdAt
            }
            const user = await User.findById(c.user_id);
            comment.profile_pic = user.profile_pic;
            comment.username = user.username;
            return comment;
        }));
        res.status(200).json({
            comments: await comments
        });
    } catch(err) {
        return res.status(200).json({
            message: "Unable to fetch the comments"
        });
    }
});

module.exports = router;
