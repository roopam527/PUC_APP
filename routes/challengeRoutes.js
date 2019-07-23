//where to get users all info?
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const uuidv4 = require("uuid/v4");
const path = require("path");
ObjectId = require("mongodb").ObjectID;
// const challenge = require("../models/challenges");
const Challenge = mongoose.model("challenges");
const doneChallenge = mongoose.model("doneChallenges"); //completed challenge
const User = mongoose.model("users"); //users is a collection name

const multer = require("multer");
const requireLogin = require("../middlewares/requireLogin");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/challenge_pics");
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

router.post("/create", requireLogin, async (req, res, next) => {
  console.log(req.file);
  const challenge = new Challenge({
    title: req.body.title,
    description: req.body.description,
    creator: mongoose.Types.ObjectId(req.userData.userId),
    filetype: req.body.filetype,
    given_to: req.body.given_to.map(user => {
      return { user_id: user };
    })
    //comment for commit
  });
  let user = await User.findById(req.userData.userId);
  user.circle_level += 25;
  if (user.circle_level === 100) {
    user.circle_level = 0;
    user.level += 1;
  }
  console.log(user.circle_level);
  user.save();
  req.body.given_to.forEach(async user_id => {
    const user = await User.findById(user_id);
    user.My_Challenges.push(challenge._id);
    await user.save();
  });
  challenge
    .save()
    .then(createdPost => {
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

router.get("/fetch/:id", (req, res, next) => {
  Challenge.findById(req.params.id) //challenge schema does not have any field called username?
    .then(challenge => {
      if (challenge) {
        res.status(200).json(challenge);
      } else {
        res.status(404).json({ message: "Challenge not found" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching Challenge failed"
      });
    });
});

router.get("/available_challenges/:id", requireLogin, async (req, res) => {
  //This route??
  try {
    let chalenge = await User.findById(req.params.id);
    chalenge = await Promise.all(
      chalenge.My_Challenges.map(async id => {
        let data = await Challenge.findById(id);
        data = JSON.parse(JSON.stringify(data));
        console.log(data);
        data.given_to = data.given_to.filter(({ user_id, status }) => {
          if (user_id != req.params.id) return false;
          return true;
        });
        //delete data['given_to'];
        let dp = await User.findById(data["creator"]).select(
          "profile_pic username"
        );
        dp = JSON.parse(JSON.stringify(dp));
        // let name = await User.findById(data['creator']).select('username');
        // name = JSON.parse(JSON.stringify(name))
        return Object.assign(data, {
          profile_pic: dp.profile_pic,
          username: dp.username
        });
      })
    );
    res.status(200).json(chalenge);
  } catch (error) {}
});

// router.post("/result", requireLogin, async (req, res) => {
//   try {
//     //console.log(req.body)
//     const challenge = await Challenge.findById(req.body.challenge_id);
//     const given_to = challenge.given_to.map(data => {
//       if (JSON.parse(JSON.stringify(data.user_id)) === req.body.id) {
//         //mongoose object to javascript object
//         data.status = req.body.status; //but given_to doesn't have status field?
//       }
//     });
//     challenge.save().then(data => {});
//     res.status(200).json({
//       message: "true"
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({
//       message: "false"
//     });
//   }
// });

router.get("/fetch_my_challenges/:id", requireLogin, async (req, res) => {
  //add try and catch in fetch_my_challenges.s
  try {
    let challenges = await Challenge.find({ creator: req.params.id });
    //  const user_result =  await Promise.all(challenges.map(async({given_to}) =>{
    //        return await Promise.all( given_to.map(async ({user_id}) =>{
    //             console.log(user_id);
    //            await Challenge.findById(user_id)
    //        }))
    // // }))
    // challenges = JSON.parse(JSON.stringify(challenges))
    // console.log(challenges);
    challenges = JSON.parse(JSON.stringify(challenges));
    console.log(challenges);
    for (let users of challenges) {
      const all_users = await Promise.all(
        users.given_to.map(async data => {
          return await User.findById(data.user_id).select(
            "username profile_pic"
          );
          // let person = await User.findById(given_to.user_id);
          // let object = {};
          // object.username = person.username;
          // object.profile_pic = person.profile_pic;
          // console.log(object);
          // Object.assign(given_to, object);
          // console.log(given_to);
          // return given_to;
          // let person = await User.findById(user_id).select(
          //   "username profile_pic"
          // );
          // console.log("2");
          // console.log(person);
          // return person;
          /*let send = {};
          let person = await User.findById(user_id);
          console.log(person);
          console.log("1");
          send.username = person.username;
          send.profile_pic = person.profile_pic;
          return send;*/
        })
      );

      // console.log("2");
      //console.log(data);
      //return data;
    }
    //  console.log(user_result);

    res.status(200).json(challenges);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Internal Server Error"
    });
  }
});

// router.get('/fetch_challenges',async (req,res)=>{
//     let all_challenges =await Challenge.find({});
//     all_challenges.stringyfy().parse()
//     console.log(all_challenges)

//     for(let challenge of all_challenges){
//         let data = await Promise.all(challenge['given_to'].map(async (id)=> {
//             const user = await User.findById(id);
//             console.log("************")
//             console.log(user);
//          return user;
//         }))
//         console.log("-------------")
//         console.log(data);
//         challenge['given_to'] = data
//     }
//     //  all_challenges.map(async ({given_to})=>{
//     //     given_to =
//     //  })
//     return res.status(200).json(all_challenges);
// })
router.put("/update/:id", (req, res, next) => {
  const challenge_new_data = {
    title: req.body.title,
    discription: req.body.description,
    filetype: req.body.filetype
  };
  for (let key in challenge_new_data) {
    if (!challenge_new_data[key]) {
      delete challenge_new_data[key];
    }
  }
  Challenge.findById(req.params.id)
    .then(challenge => {
      if (challenge) {
        Object.assign(challenge, challenge_new_data);
        challenge.save();
        res.status(200).json(challenge);
      } else {
        res.status(404).json({ message: "Challenge not found" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching Challenge failed"
      });
    });
});

router.delete("/delete/:id", requireLogin, async (req, res) => {
  try {
    await Challenge.deleteOne({ _id: req.params.id });
    return res.status(200).json({
      message: "Challenge deleted successfully"
    });
  } catch (err) {
    return res.status(404).json({
      message: "Failed to delete Challenge"
    });
  }
});

router.post(
  "/done",
  requireLogin,
  upload.single("challenge_pic"),
  async (req, res) => {
    console.log("hii");
    console.log(req.file);
    try {
      let challenge = new doneChallenge({
        description: req.body.description,
        creator: req.body.creator,
        given_to: req.body.given_to,
        image: "/" + req.file.path,
        challenge_id: req.body.challenge_id
      });
      // if (req.file.path) {
      //   Object.assign(challenge, { image: "/" + req.file.path });
      // }
      console.log(req.userData.username);
      console.log("0");
      console.log(challenge.image);

      challenge.save().then(data => {
        res.json(data);
        //res.json({ message: "Challenge completion saved" });
      });
      let user = await User.findById(req.body.given_to);
      //user = JSON.parse(JSON.stringify(user));
      console.log("1");
      console.log(user);
      user.Done_Challenges.push(req.body.challenge_id);
      console.log("2");
      await user.save();
      console.log(user);
      console.log(user.Done_Challenges);
      console.log("2");
    } catch (error) {
      console.log(error.message);
      return res.json({ message: "Unable to save challenge completion" });
    }
  }
);

router.get("/fetch_doneChallenges/:id", requireLogin, async (req, res) => {
  try {
    console.log("1");
    console.log(req.userData.username);
    //const id = ObjectId("5d25c83d376dfa0017d9314");
    //var id = mongoose.Types.ObjectId("5d25c83d376dfa0017d9314");
    // var _id = mongoose.mongo.BSONPure.ObjectID.fromHexString(
    //   "5d25c83d376dfa0017d9314"
    // );
    //var _id = mongoose.mongo.ObjectId("5d25c83d376dfa0017d9314");

    let user = await User.findOne({ _id: req.params.id /*userData.userId*/ });

    console.log("2");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      user = JSON.parse(JSON.stringify(user));
      //console.log(user.Done_Challenges);
      //console.log(user);
      //let details = [];
      let details = await Promise.all(
        user.Done_Challenges.map(async challenge => {
          let ChalDetail = {
            creator_pic: "",
            creator_id: "",
            given_to_pic: "",
            given_to_id: req.params.id,
            challenge_pic: "",
            title: "",
            description: "",
            caption: ""
          };
          console.log("3");
          const chal = await Challenge.findById(challenge);
          // console.log(chal.creator);
          ChalDetail.creator_id = chal.creator;
          //console.log(ChalDetail.creator_id);
          ChalDetail.description = chal.description;
          ChalDetail.title = chal.title;
          //console.log(ChalDetail);
          const user = await User.findById(chal.creator);

          const given_to = await User.findById(req.params.id);

          ChalDetail.creator_pic = user.profile_pic;

          ChalDetail.creator_name = user.username;

          console.log(ChalDetail);
          console.log("4");

          ChalDetail.given_to_pic = given_to.profile_pic;
          ChalDetail.given_to_name = given_to.username;
          console.log(ChalDetail);
          console.log("5");
          let DoneChallenge = await doneChallenge.findOne({
            challenge_id: challenge
          });
          //   DoneChallenge = JSON.parse(JSON.stringify(DoneChallenge));
          console.log(DoneChallenge);
          console.log("5.1");
          ChalDetail.challenge_pic = DoneChallenge.image;
          //console.log(DoneChallenge);
          ChalDetail.caption = DoneChallenge.description;
          console.log(DoneChallenge.image);
          console.log(ChalDetail.challenge_pic);
          //console.log(ChalDetail);
          // console.log("6");
          //details.push(ChalDetail);
          //console.log(details);
          return ChalDetail;
        })
      );
      console.log("7");
      console.log(details);
      res.json(details);
    }
  } catch (err) {
    console.log(err);
    return res.json({
      message: "Unable to fetch the completed challenges"
    });
  }
});
// accept or decline by the given_to.
router.post("/accept_decline", requireLogin, async (req, res) => {
  try {
    let challenge = await Challenge.findById(req.body.challenge_id);
    challenge = JSON.parse(JSON.stringify(challenge));
    NewChallenge = new Challenge();
    NewChallenge = challenge;
    console.log(NewChallenge);
    if (req.body.status === "ACCEPTED") {
      console.log("1");
      for (let key in NewChallenge.given_to) {
        if (NewChallenge.given_to[key].user_id === req.body.user_id) {
          console.log("1.1");

          NewChallenge.given_to[key].status = "ACCEPTED";
          NewChallenge.given_to[key].date = Date.now;
          await Challenge.findByIdAndUpdate(
            req.body.challenge_id,
            { $set: NewChallenge },
            { new: true }
          );
          let user = await User.findById(req.body.user_id);
          user.circle_level += 25;
          if (user.circle_level === 100) {
            user.circle_level = 0;
            user.level += 1;
          }
          console.log(user.circle_level);
          user.save();
        }
        console.log(challenge);
        console.log(challenge.given_to[key]);
        /*challenge.given_to.ForEach(given_to => {
        
        }
      });*/
      }
    }
    if (req.body.status === "REJECTED") {
      console.log("1");
      for (let key in NewChallenge.given_to) {
        if (NewChallenge.given_to[key].user_id === req.body.user_id) {
          console.log("1.1");

          NewChallenge.given_to[key].status = "REJECTED";
          await Challenge.findByIdAndUpdate(
            req.body.challenge_id,
            { $set: NewChallenge },
            { new: true }
          );
        }
        console.log(challenge);
        console.log(challenge.given_to[key]);
        /*challenge.given_to.ForEach(given_to => {
        
        }
      });*/
      }
    }

    //await challenge.save();
    res.json({ message: "Status updated" });
  } catch (err) {
    console.log(err);
    res.json({ message: "Unable to update the status" });
  }
});
module.exports = router;
