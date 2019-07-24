const express = require("express");
const router = express.Router();
const passport = require("passport");
const { check, validationResult } = require("express-validator");
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

router.post(
  "/register",
  // [
  //   check("username", "Please enter a name")
  //     .not()
  //     .isEmpty(),
  //   check("email", "Please enter a valid email address").isEmail(),

  //   check(
  //     "password",
  //     "The password must contain atleast 8 characters"
  //   ).isLength({ min: 8 })
  // ],
  async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    console.log(req.body);
    let user = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }]
    }).catch(() => {
      return res.status(200).send({ error: "Something Went wrong" });
    });

    if (!user) {
      user = await new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, salt)
      })
        .save()
        .then(() => {
          return res.status(200).json({ message: "done" });
        })
        .catch(err => {
          console.log(err);
          return res.status(501).json({ message: "Something Went wrong" });
        });
    } else {
      return res
        .status(200)
        .json({ message: "this email or username is already registered" });
    }
  }
);

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

router.post("/reg_gmail_fb", async (req, res, next) => {
  try {
    const login = {
      via: req.body.via,
      id: req.body.id
    };
    console.log("hello from backend");
    console.log(login);
    let person = await User.findOne({ login: login });
    console.log(person);
    if (!person) {
      console.log("1");
      let user = new User({
        username: req.body.id,
        email: req.body.id,

        login: {
          via: req.body.via,
          id: req.body.id
        },
        profile_pic: req.body.profile_pic
      });
      console.log("1.7");

      await user.save();
      console.log("1.9");
      res.status(200).json({ message: "User successfully created!!!" });
    } else {
      if (person.username === req.body.id) {
        return res.status(200).json({ message: "Username not set!!!" });
      }
      console.log("2");
      console.log(person._id);
      const payload = {
        user: {
          userId: person._id,
          username: person.username
        }
      };

      const token = jwt.sign(payload, config.JWT_KEY, { expiresIn: "240h" });
      res.status(200).json({
        message: "",
        token: token,
        expiresIn: "240h",
        userId: person._id
      });
    }
  } catch (err) {
    console.log(err);
    res.status(501).json({ message: "Unable to register or verify user!!!" });
  }
});

router.post("/gflogin", async (req, res) => {
  try {
    const login = {
      via: req.body.via,
      id: req.body.id
    };
    let person = await User.findOne({ username: req.body.username });
    if (person) {
      return res
        .status(200)
        .json({ message: "Oops!! Username already taken." });
    } else {
      let user = await User.findOne({ login: login });
      user.username = req.body.username;
      user.save();
      const token = jwt.sign(
        { username: user.username, userId: user._id },
        config.JWT_KEY,
        { expiresIn: "240h" }
      );
      res.status(200).json({
        message: "",
        token: token,
        expiresIn: "240h",
        userId: user._id
      });
      res.status(200).json({ message: "Username successfully saved!!" });
    }
  } catch (err) {
    console.log(err);
    res.status(501).json({ message: "Unable to register or verify user!!!" });
  }
});
module.exports = router;
