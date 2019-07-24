const express = require("express");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const User = mongoose.model("users"); //users is a collection name
const requireLogin = require("../middlewares/requireLogin");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const multer = require("multer");
const path = require("path");
const uuidv4 = require("uuid/v4");
//var stringify = require("json-stringify-safe");
const Challenge = mongoose.model("challenges");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/profile_pics");
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

router.put(
  "/set_user_details",
  requireLogin,
  upload.single("profile_pic"),
  async (req, res) => {
    const data = {
      bio: req.body.bio,
      isPrivate: req.body.isPrivate,
      username: req.body.username,
      password: req.body.password
        ? bcrypt.hashSync(req.body.password, salt)
        : undefined
    };

    if (req.file) {
      Object.assign(data, { profile_pic: "/" + req.file.path });
    }

    for (let key in data) {
      if (!data[key]) {
        delete data[key];
      }
    }

    await User.findOneAndUpdate({ _id: req.userData.userId }, data, function(
      err,
      doc
    ) {
      if (err) return res.send(500, { message: err });
      return res.status(200).json({
        message: "User updated Successfully"
      });
    });
  }
);

router.get("/get_all_users", requireLogin, async (req, res) => {
  let users;
  const pageSize = +req.query.pagesize || 20;
  const currentPage = +req.query.page || 0;
  const LoggedInUser = await User.findById(req.userData.userId);
  console.log(req.userData.userId);

  if (req.query.search) {
    users = await User.find({ username: new RegExp(req.query.search, "i") })
      .skip(currentPage * pageSize)
      .limit(pageSize);
    console.log(req.userData.userId);
    // users = users.map(user => {
    //   //   if(JSON.parse(JSON.stringify(user._id)) === JSON.parse(JSON.stringify(loggedInUser._id))){
    //   //       return null
    //   //   }
    //   console.log(user._id);
    //   if (user._id !== req.userData.userId) {
    //     return {
    //       _id: user._id,
    //       username: user.username,
    //       profile_pic: user.profile_pic,
    //       bio: user.bio,
    //       following: LoggedInUser.followings.includes(user._id)
    //     };
    //   }
    // });
  } else {
    users = await User.find({})
      .skip(currentPage * pageSize)
      .limit(pageSize);
  }
  users = users.map(user => {
    user = JSON.parse(JSON.stringify(user));
    // user.followers = user.followers.length;
    // user.followings = user.followings.length;
    // user.blocked_accounts = user.blocked_accounts.length,
    //console.log(user);
    if (user._id !== req.userData.userId) {
      return {
        _id: user._id,
        username: user.username,
        profile_pic: user.profile_pic,
        bio: user.bio,
        following: LoggedInUser.followings.includes(user._id)
      };
    }
  });

  return res.status(200).json({
    count: users.length,
    user_searched_results: users
  });
});

router.get("/get_all_followers", requireLogin, async (req, res) => {
  const pageSize = +req.query.pagesize || 20;
  const currentPage = +req.query.page || 0;
  let userId = req.query.id;
  if (!userId) {
    userId = req.userData.userId;
  }
  // .skip(currentPage * pageSize)
  // .limit(pageSize)
  let user = await User.findById(userId).select("followers");
  let followers = [];
  for (
    let i = currentPage * pageSize;
    i <= currentPage * pageSize + pageSize - 1;
    i++
  ) {
    if (user.followers[i]) {
      result = await User.findById(user.followers[i]._id);

      followers.push({
        _id: result._id,
        username: result.username,
        profile_pic: result.profile_pic,
        bio: result.bio
      });
    }
  }
  // let followers = await Promise.all(user.followers.map(async (id)=> {

  //    const res =  await User.findById(id)
  //    return{
  //     _id:res._id,
  //     username:res.username,
  //     profile_pic:res.profile_pic,
  //     bio:res.bio,
  // }
  // }))

  console.log(req.query.search);
  console.log(followers);
  if (req.query.search) {
    followers = followers.filter(({ username }) =>
      username.match(new RegExp(req.query.search, "i"))
    );
  }

  res.status(200).json(followers);
});

router.get("/get_all_followings", requireLogin, async (req, res) => {
  try {
    const pageSize = +req.query.pagesize || 20;
    const currentPage = +req.query.page || 0;
    let userId = req.query.id;
    if (!userId) {
      userId = req.userData.userId;
    }

    let user = await User.findById(userId).select("followings");
    let followings = [];

    for (
      let i = currentPage * pageSize;
      i <= currentPage * pageSize + pageSize - 1;
      i++
    ) {
      if (user.followings[i]) {
        console.log(user.followings[i]);
        result = await User.findById(user.followings[i]._id);
        console.log(result);
        followings.push({
          _id: result._id,
          username: result.username,
          profile_pic: result.profile_pic,
          bio: result.bio
        });
      }
    }
    console.log(req.query.search);
    console.log(followings);
    if (req.query.search) {
      followings = followings.filter(({ username }) =>
        username.match(new RegExp(req.query.search, "i"))
      );
    }
    res.status(200).json(followings);
  } catch (err) {
    console.log(err);
    return res.status(422).json({
      message: `Something went wrong`
    });
  }
});

router.get("/get_user/:id", requireLogin, async (req, res) => {
  console.log("1");
  let user = await User.findById(req.params.id);
  console.log("1");
  console.log(user);
  user = JSON.parse(JSON.stringify(user));
  user.followers = user.followers.length;
  user.followings = user.followings.length;
  user.blocked_accounts = user.blocked_accounts.length;

  let challenge = await Challenge.find({ creator: req.params.id });

  console.log("2");
  user.given = challenge.length;

  console.log("3");
  delete user["password"];
  return res.status(200).json(user);
});

router.post("/follow/:id", requireLogin, async (req, res) => {
  try {
    let loggedInUser = await User.findById(req.userData.userId);
    //loggedInUser = JSON.parse(JSON.stringify(loggedInUser));
    let followed_user = await User.findById(req.params.id);
    let followings = JSON.parse(JSON.stringify(loggedInUser.followings));
    const followed_user_id = JSON.parse(JSON.stringify(followed_user._id));

    if (!followings.includes(followed_user_id)) {
      followed_user.followers.push(
        mongoose.Types.ObjectId(req.userData.userId)
      );
      loggedInUser.followings.push(mongoose.Types.ObjectId(followed_user._id));
      await followed_user.save();
      await loggedInUser.save();
      return res.status(200).json({
        message: `${loggedInUser.username} started following ${
          followed_user.username
        }`
      });
    } else {
      return res.status(200).json({
        message: `${loggedInUser.username} already following ${
          followed_user.username
        }`
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(422).json({
      message: `Something went wrong`
    });
  }
});

router.post("/unfollow/:id", requireLogin, async (req, res) => {
  try {
    let loggedInUser = await User.findById(req.userData.userId);
    loggedInUser = JSON.parse(JSON.stringify(loggedInUser));
    let followed_user = await User.findById(req.params.id);
    followed_user = JSON.parse(JSON.stringify(followed_user));

    // followed_user.followers.push(mongoose.Types.ObjectId(req.userData.userId));
    console.log(followed_user.followers);
    console.log(loggedInUser.followings);
    followed_user.followers = followed_user.followers.filter(user => {
      return user != loggedInUser._id;
    });
    console.log(followed_user.followers);
    // loggedInUser.followings.push(mongoose.Types.ObjectId(loggedInUser._id));
    loggedInUser.followings = loggedInUser.followings.filter(
      user => user != followed_user._id
    );
    console.log(loggedInUser.followings, followed_user._id);
    await User.findOneAndUpdate(
      { _id: followed_user._id },
      { followers: followed_user.followers }
    );
    await User.findOneAndUpdate(
      { _id: loggedInUser._id },
      { followings: loggedInUser.followings }
    );

    // await followed_user.save();
    // await loggedInUser.save();

    return res.status(200).json({
      message: `${loggedInUser.username} unfollowed ${followed_user.username}`
    });
  } catch (err) {
    console.log(err);
    return res.status(422).json({
      message: `Something went wrong`
    });
  }
});

router.get("/all_info/:id", async (req, res) => {
  try {
    console.log("1");
    const user = await User.findById(req.params.id);
    console.log("2");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.json({ message: "Unable to fetch user" });
  }
});

router.post("/block", requireLogin, async (req, res) => {
  try {
    // var circularObj = {};
    // circularObj.circularRef = circularObj;
    // circularObj.list = [circularObj, circularObj];
    console.log("1");
    let user = await User.findById(req.body.user_id);
    console.log(user.Blocked);
    console.log(user);
    //user = JSON.parse(JSON.stringify(user));

    //user = stringify(user);
    console.log(user.Blocked);
    //user = JSON.parse(JSON.stringify(user));
    user.Blocked.push(req.body.to_be_blocked);
    //Object.assign(user, userBlocked);

    await use.save();
    res.status(200).json({ message: "User blocked" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to block user" });
  }
});

router.get("/show_blocked/:id", requireLogin, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    res.status(200).json(user.Blocked);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to fetch the blocked users" });
  }
});
router.post("/unblock", requireLogin, async (req, res) => {
  try {
    let user = await User.findById(req.body.user_id);
    for (let key in user.Blocked) {
      if (user.Blocked[key] === req.body.unblock_id) {
        user.Blocked.splice(key, 1);
        await user.save();
        console.log(user.Blocked);
        return res.status(200).json({ message: "User successfully unblocked" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to unblock the user!!" });
  }
});

module.exports = router;
