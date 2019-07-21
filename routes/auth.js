const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = mongoose.model("users"); //users is a collection name
const bcrypt = require("bcryptjs");
const config = require("../config/keys");
const salt = bcrypt.genSaltSync(10);
const requireLogin = require("../middlewares/requireLogin");

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (info) {
      return res.json(info);
    }

    //console.log(res.info)
    const token = jwt.sign(
      { username: user.username, userId: user._id },
      config.JWT_KEY,
      { expiresIn: "240h" }
    );
    res.status(200).json({
      token: token,
      expiresIn: "240h",
      userId: user._id
    });
  })(req, res, next);
});

// router.post('/login_google',(req,res)=>{

// })

router.post("/register", async (req, res) => {
  let user = await User.findOne({
    $or: [{ email: req.body.email }, { username: req.body.username }]
  }).catch(() => {
    return res.status(400).send({ error: "Something Went wrong" });
  });

  if (!user) {
    user = await new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt)
    })
      .save()
      .catch(err => {
        console.log(err);
        return res
          .status(501)
          .json({ message: "this email or username is already registered" });
      });
    return res.status(200).json({ message: "done" });
  }
});

router.post("/reset_password", requireLogin, async (req, res) => {
  const user = await User.findById(req.userData.userId);
  bcrypt.compare(req.body.password, user.password, async (err, isMatch) => {
    if (err) throw err;

    if (isMatch) {
      user.password = bcrypt.hashSync(req.body.new_password);
      await user.save();
      return res.status(200).json({
        message: "done"
      });
    } else {
      return res.status(422).json({ error: "Password incorrect" });
    }
  });
});

router.get("/current_user", requireLogin, (req, res) => {
  res.send(req.userData);
});
router.get("/error", (req, res) => {
  console.log(res);
  res.status(422).json(req.info);
});

module.exports = router;
