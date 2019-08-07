const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = mongoose.model("users"); //users is a collection name
const config = require("../config/keys");
const requireLogin = require("../middlewares/requireLogin");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const validator = require('validator');
global.fetch = require('node-fetch');

var poolData = { UserPoolId : config.UserPoolId,
    ClientId : config.ClientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

router.post("/login", (req, res, next) => {
  
  if(!req.body.email && !req.body.phone && !req.body.username){
    return res.status(400).json({ error: {name: "unexpected", value: "invalid request"} });
  }

  if(req.body.username && !/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/.test(req.body.username)){
    return res.status(400).json({ error: {name: "username", value: "invalid username"} });
  } else if(req.body.email && !validator.isEmail(req.body.email)){
    return res.status(400).json({ error: {name: "email", value: "invalid email"} });
  } else if(req.body.phone && !validator.isMobilePhone(req.body.phone, 'en-IN')){
    return res.status(400).json({ error: {name: "phone", value: "invalid phone number"} });
  }
  if(!validator.isLength(req.body.password, { min: 8 })){
    return res.status(400).json({ error: {name: "password", value: "invalid password"} });
  }

  var authenticationData = {
    Username : req.body.username || req.body.email || req.body.phone, 
    Password : req.body.password, 
  };
  var userData = {
    Username: req.body.username || req.body.email || req.body.phone,
    Pool : userPool
  }
var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
          var accessToken = result.getAccessToken().getJwtToken();
          return res.status(200).json({
            token: accessToken,
            expiresIn: "240h",
            userId: result.getAccessToken().payload.sub
          });
      },

      onFailure: function(err) {
          return res.status(501).json({ message: err.message });
      },
  });
});

router.post(
  "/register",
  async (req, res) => {
      
      if(!/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/.test(req.body.username)){
        return res.status(400).json({ error: {name: "username", value: "invalid username"} });
      }

      if(!req.body.email && !req.body.phone){
        return res.status(400).json({ error: {name: "unexpected", value: "invalid request"} });
      }

      if(req.body.email && !validator.isEmail(req.body.email)){
        return res.status(400).json({ error: {name: "email", value: "invalid email"} });
      } else if(req.body.phone && !validator.isMobilePhone(req.body.phone, 'en-IN')){
        return res.status(400).json({ error: {name: "phone", value: "invalid phone number"} });
      }
      if(!validator.isLength(req.body.password, { min: 8 })){
        return res.status(400).json({ error: {name: "password", value: "invalid password"} });
      }

      let attributeList = [];
      attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'preferred_username',
        Value: req.body.username,
      }));
      if(req.body.email){
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'email',
          Value: req.body.email,
        }));
      } else if(req.body.phone){
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'phone_number',
          Value: req.body.phone,
        }));
      }

      userPool.signUp(req.body.username, req.body.password, attributeList, null, function(err, result){
        if (err) {
            return res.status(501).json({ message: err.message });
        }
        return res.status(200).json({ message: "done" });
      });
  }
);

router.post('/verification', (req,res)=>{

  if(!/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/.test(req.body.username)){
    return res.status(400).json({ error: {name: "username", value: "invalid username"} });
  }
  if(!validator.isLength(req.body.code, { min: 6, max: 6 })){
    return res.status(400).json({ error: {name: "code", value: "invalid code"} });
  }

  var userData = {
    Username: req.body.username,
    Pool : userPool
  }
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.confirmRegistration(req.body.code, true, function(err, result) {
    if (err) {
      console.log(err)
      return res.status(501).json({ message: err.message });
    }
    return res.status(200).json({ message: "done" });
  });
});

router.post('/resend-verification', (req,res)=>{
  
  if(!/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/.test(req.body.username)){
    return res.status(400).json({ error: {name: "username", value: "invalid username"} });
  }

  var userData = {
    Username: req.body.username,
    Pool : userPool
  }

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.resendConfirmationCode(function(err, result) {
    if (err) {
      console.log(err)
      return res.status(501).json({ message: err.message });
    }
    return res.status(200).json({ message: "done" });
  });
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
module.exports = router;
