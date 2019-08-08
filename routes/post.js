const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
ObjectId = require("mongodb").ObjectID;
const doneChallenges = mongoose.model("doneChallenges"); 
const User = mongoose.model("users");
const requireLogin = require("../middlewares/requireLogin");
const { isLength } = require('validator');

router.post("/comment", requireLogin, async (req, res, next) => {
  if(!isLength(req.body.comment, { min: 1 })){
    return res.status(200).json({
        message: "Invalid comment"
    });
  }

  const doneChallenge = new doneChallenges({
      _id: req.body.id
  })
  doneChallenge.update({ 
      $push: { comments: { user_id: req.userData.userId, comment: req.body.comment, createdAt: JSON.parse(JSON.stringify(Date.now())) } } , 
    }).then(() => {
        res.status(200).json({
        message: "Challenge added successfully"
        });
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({
      message: "Challenge creation failed"
    });
  });

});

router.get("/comments", requireLogin, async (req, res, next) => {
    if(!req.query.id){
        return res.status(200).json({
            message: "Invalid channel id"
        });
    }
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
});


module.exports = router;
