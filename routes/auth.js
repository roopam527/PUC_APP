const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const User = mongoose.model("users"); //users is a collection name
const bcrypt = require('bcryptjs');
const config = require('../config/keys')
const salt = bcrypt.genSaltSync(10);
const requireLogin = require('../middlewares/requireLogin');

router.post(
  "/login",
  passport.authenticate('local', { failureRedirect: '/auth/error' }),
  (req, res) => {
    const token = jwt.sign({username:req.user.username,userId:req.user._id},config.JWT_KEY,{expiresIn:'24h'});
			res.status(200).json({
				token:token,
				expiresIn : "24h",
				userId:req.user._id
			});
  }
);

router.post("/register", async (req, res) => {

let user = await User.findOne({ username: req.body.username }).catch(() => {
    return res.status(400).send({ error: "Something Went wrong" });
  });

  if (!user) {
    user = await new User({
      username: req.body.username,
      email:req.body.email,
      password: bcrypt.hashSync(req.body.password, salt)
    })
      .save()
      .catch(err => {
        console.log(err);
      });
    return res.status(200).send({ message: "done" });
  }
  return res.status(501).send({ error: "this email is already registered" });
});



router.get('/current_user',requireLogin,(req,res)=>{
  res.send(req.userData)
})
router.get("/error", (req, res) => {
  res.send("Something went wrong");
});

module.exports = router;
