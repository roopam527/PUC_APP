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
const twilio = require('twilio');
const twilioClient = twilio('AC8985a005f9d8ebf9f0467bc13617106a', '26dc24316fc19277f53160e45e4b0a0a')
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const {isMobilePhone, isEmail, isLength} = require('validator');
const axios = require('axios');

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (info) {
      return res.json(info);
    }
    if(!user.email_verified && !user.phone_verified){
      return res.status(200).json({
        message: "User is not verified"
      });
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
  async (req, res) => {
    if(!req.body.email && !req.body.phone){
      return res.status(200).json({ message: "invalid request" });
    }

    if(req.body.email && !isEmail(req.body.email)){
      return res.status(200).json({ message: "invalid email"} );
    } else if(req.body.phone && !isMobilePhone(req.body.phone, 'en-IN', {strictMode: true})){
      return res.status(200).json({ message: "invalid phone number"} );
    }
    if(!isLength(req.body.password, { min: 4 })){
      return res.status(200).json({ message: "invalid password (min 4 charcters)" });
    }

    let user = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }]
    }).catch(() => {
      return res.status(200).send({ error: "Something Went wrong" });
    });
    
    if (!user) {
      user = await new User({
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        password: bcrypt.hashSync(req.body.password, salt)
      }).save().then(async () => {
          await axios.post('http://localhost:8000/auth/send-verification', {
            phone: req.body.phone,
            email: req.body.email
          });
          return res.status(200).json({ message: "done" });
        })
        .catch(err => {
          console.log(err);
          return res.status(501).json({ message: "Something Went wrong" });
        });
    } else {
      return res
        .status(200)
        .json({ message: "this email or username or phone_number is already registered" });
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
      // const payload = {
      //   user: {
      //     userId: person._id,
      //     username: person.username
      //   }
      // };
      // console.log(payload);
      // const token = jwt.sign(payload, config.JWT_KEY, { expiresIn: "240h" });
      const token = jwt.sign(
        { username: person.username, userId: person._id },
        config.JWT_KEY,
        { expiresIn: "240h" }
      );
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

router.post('/send-verification', async (req, res, next) => {
  var verificationCode = Math.floor(Math.random() * (100000 - 999999) + 999999);
  verificationCode = verificationCode.toString();
  const { phone, email } = req.body;
  if(email && phone) {
    return res.status(200).json({ message: "Invalid Request" });
  }
  try{
    if(phone){
      let user = await User.findOne({phone});
      if(user && user.phone_verified){
        return res.status(200).json({ message: "Already verified" });
      }
      var params = {
        to: phone,
        from: '+19283795019', // Your twilio phone number
        body: `Your PucApp verification code is ${verificationCode}`,
      };
      const msg = await twilioClient.messages.create(params);
      user.verification_code = verificationCode;
      await user.save();
      return res.status(200).json({ message: "Verification Code Send" });
    }
    if(email){
      let user = await User.findOne({email});
      if(user && user.email_verified){
        return res.status(200).json({ message: "Already verified" });
      }
      const msg = {
        to: email,
        from: 'pucapp2018@gmail.com',
        subject: 'PucApp Verification Code',
        text: `Your PucApp verification code is ${verificationCode}`,
        html: `Your PucApp verification code is <strong>${verificationCode}</strong>`,
      };
      await sgMail.send(msg);
      user.verification_code = verificationCode;
      await user.save();
      return res.status(200).json({ message: "Verification Code Send" });
    }
  } catch(err){
    console.log(err)
    res.status(200).json({ message: "Unable to send verification code" });
  }
})

router.post('/verify', async (req, res, next) => {
  const { phone, email, code } = req.body;
  if(email && phone) {
    return res.status(200).json({ message: "Invalid Request" });
  }
  try{
    if(phone){
      let user = await User.findOne({phone});
      if(user){
        if(user.phone_verified){
          return res.status(200).json({ message: "Already verified" });
        }
        if(code !== user.verification_code){
          return res.status(200).json({ message: "Invalid Code" });
        }
        user.phone_verified = true;
        await user.save();
        return res.status(200).json({ message: "Verification Done" });
      } else {
        res.status(200).json({ message: "Unable to verify" });
      }
    }
    if(email){
      let user = await User.findOne({email});
      if(user){
        if(user.email_verified){
          return res.status(200).json({ message: "Already verified" });
        }
        if(code !== user.verification_code){
          return res.status(200).json({ message: "Invalid Code" });
        }
        user.email_verified = true;
        await user.save();
        return res.status(200).json({ message: "Verification Done" });
      } else {
        res.status(200).json({ message: "Unable to verify" });
      }
    }
  } catch(err){
    console.log(err)
    res.status(200).json({ message: "Unable to verify" });
  }
})
module.exports = router;
