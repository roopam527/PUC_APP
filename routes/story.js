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
const _ = require("lodash");
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

router.get("/posted-stories", requireLogin, async (req, res, next) => {
    try{
        const receiver = await User.findById(req.userData.userId);
        const users  = [receiver.id, ...receiver.followings];
        const data =  await Promise.all(users.map(async (user) => {
          const user_data = await User.findById(user);
          const { Received_Stories } = user_data;
          if(Received_Stories)
          {
            let stories_tmp = await Received_Stories.reduce( async (result, story) => {
              const received_story = await stories.findById(story);
              let newResult = await result;
              if(received_story.isPosted){
                newResult.push({
                  image: received_story.image,
                });
              }
              return newResult;
            }, []);
            return {
              profile_pic: user_data.profile_pic,
              username: user_data.username,
              id: user_data.id,
              stories: stories_tmp
            }
          }
          return {
            profile_pic: user_data.profile_pic,
            username: user_data.username,
            id: user_data.id,
            stories: []
          }
      }));
      res.status(200).json(data);
    } catch(err) {
      console.log(err)
        return res.status(200).json({
            message: "Unable to fetch stories"
        });
    }
});

router.post("/post/:id", requireLogin, async (req, res, next) => {
  if(!isLength(req.params.id, { min: 1 })){
    return res.status(200).json({
        message: "Invalid story id"
    });
  }
  try{
    const receiver = await User.findById(req.userData.userId);
    const story = await stories.findById(req.params.id);

    if(story.receiver != req.userData.userId){
      return res.status(200).json({
          message: "Invalid story id"
      });
    }
    if(!story.isPosted){
      story.isPosted = true;
      await story.save();
    } else {
      return res.status(200).json({
          message: "Story already posted"
      });
    }

    return res.status(200).json({
    message: "story posted successfully"
    });
  } catch(err){
    console.log(err)
    return res.status(200).json({
        message: "story post failed"
    });
  }
});

router.get("/received-stories", requireLogin, async (req, res, next) => {
    try{
        const receiver = await User.findById(req.userData.userId);
        const { Received_Stories } = receiver;
        let users = []
        let index = 0;
        for(const story of Received_Stories){
          const received_story = await stories.findById(story);
          const sender = await User.findById(received_story.sender);
          let user = await _.find(users, (user) => {
            return user.id == sender.id;
          });
          if(user){
            user.stories.push({
              image: received_story.image
            })
          } else {
            users.push({
              index:index,
              id: sender.id,
              profile_pic: sender.profile_pic,
              username: sender.username,
              stories: [{
                image: received_story.image
              }],
            })
          }
          index++;
        }
        res.status(200).json({users});
    } catch(err) {
      console.log(err)
        return res.status(200).json({
            message: "Unable to fetch stories"
        });
    }
});

module.exports = router;
