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
        $push: { comments: { user_id: req.userData.userId, comment: req.body.comment, createdAt: Date.now() } } , 
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
  
    try{
    let doneChallenge = await doneChallenges.findById(req.body.id);

    for(let i=0; i< doneChallenge.likes.length; i++) {
        if(doneChallenge.likes[i].user_id == req.userData.userId){
            const a = await doneChallenges.updateOne({ _id: req.body.id, 'likes.user_id': req.userData.userId}, { '$set': { 
                'likes.$.emoji': req.body.emoji,
                'likes.$.createdAt': Date.now() 
            }}, { new: true });
            let doc = await doneChallenges.findById(req.body.id).select({likes: 1});
            return res.status(200).json({
                likes_count: doc.likes.length
            });
        }
    }
        
    await doneChallenge.update({ 
        $push: { likes: { user_id: req.userData.userId, emoji: req.body.emoji, createdAt: Date.now() } } , 
    })

    let doc = await doneChallenges.findById(req.body.id).select({likes: 1});
    return res.status(200).json({
        likes_count: doc.likes.length
    });

    } catch(err){
        res.status(200).json({
            message: "Like creation failed"
        });
    }
});

router.get("/likes", requireLogin, async (req, res, next) => {
    if(!req.query.id){
      return res.status(200).json({
          message: "Invalid post id"
      });
    }

    if(emojis.indexOf(req.query.emoji) == -1 && req.query.emoji != "all"){
        return res.status(200).json({
            message: "Invalid emoji"
        });
    }
    
    try{
        const doneChallenge = await doneChallenges.findById(req.query.id);
        let likes = [];
        if(req.query.emoji === "all"){
            likes = await Promise.all(doneChallenge.likes.map(async (l) => {
                let like = {}
                const user = await User.findById(l.user_id);
                like.profile_pic = user.profile_pic;
                like.username = user.username;
                like.bio = user.bio;
                return like;
            }));
        } else {
            for(const l of doneChallenge.likes){
                let like = {}
                if(req.query.emoji == l.emoji){
                    const user = await User.findById(l.user_id);
                    like.profile_pic = user.profile_pic;
                    like.username = user.username;
                    like.bio = user.bio;
                    likes.push(like);   
                }
            };
        }
        res.status(200).json({
            likes: await likes
        });
    } catch(err) {
        console.log(err)
        return res.status(200).json({
            message: "Unable to fetch the likes"
        });
    }

});


module.exports = router;
