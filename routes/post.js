const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
ObjectId = require("mongodb").ObjectID;
const doneChallenges = mongoose.model("doneChallenges"); 
const User = mongoose.model("users");
const requireLogin = require("../middlewares/requireLogin");
const { isLength } = require('validator');
let emojis = [
    "cry",
    "laugh",
    "sad",
    "love",
]
router.post("/comment", requireLogin, async (req, res, next) => {
  if(!isLength(req.body.comment, { min: 1 })){
    return res.status(200).json({
        message: "Invalid comment"
    });
  }
  try{
    const doneChallenge = await doneChallenges.findById(req.body.id);
    await doneChallenge.update({ 
        $push: { comments: { user_id: req.userData.userId, comment: req.body.comment } } , 
      })
    res.status(200).json({
    message: "comment added successfully"
    });
  } catch(err){
    res.status(200).json({
        message: "comment creation failed"
    });
  }
});

router.get("/comments", requireLogin, async (req, res, next) => {
    if(!req.query.id){
        return res.status(200).json({
            message: "Invalid post id"
        });
    }
    try{
        const doneChallenge = await doneChallenges.findById(req.query.id);
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

//Likes
router.post("/like", requireLogin, async (req, res, next) => {
    if(!req.body.id){
      return res.status(200).json({
          message: "Invalid post id"
      });
    }

    if(emojis.indexOf(req.body.emoji) == -1){
        return res.status(200).json({
            message: "Invalid emoji"
        });
    }
  
    let doneChallenge = await doneChallenges.findById(req.body.id);
    doneChallenge.update({ 
        $push: { likes: { user_id: req.userData.userId, emoji: req.body.emoji } } , 
      }, { upsert: true }).then(() => {
          res.status(200).json({
          message: "Like added successfully"
          });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Like creation failed"
      });
    });
  
  });


module.exports = router;
