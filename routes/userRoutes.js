const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = mongoose.model("users"); //users is a collection name
const requireLogin = require('../middlewares/requireLogin');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const multer = require('multer');
const path = require('path');
const uuidv4 = require('uuid/v4');

const storage = multer.diskStorage({
	destination: function(req,file,cb) {
       cb(null,"./uploads/profile_pics");
	},
	filename: function(req,file,cb) {
		cb(null,uuidv4()+file.originalname.split(" ").join(""));
	}
});
const fileFilter = (req,file,cb) => {
	var ext = path.extname(file.originalname);
	if(ext === '.jpeg' || ext === '.png'){
		cb(null,true);
	}else {
		return cb(null,new Error('Only images are allowed'));
	}
};
const upload = multer({storage:storage,fileFilter:fileFilter});



router.put('/set_user_details',requireLogin,upload.single('profile_pic'),async (req,res)=>{
   
    const data = {
        bio: req.body.bio,
        isPrivate:req.body.isPrivate,
        username:req.body.username,
        password:req.body.password ? bcrypt.hashSync(req.body.password, salt): undefined
    }

    if(req.file){
        Object.assign(data,{profile_pic:"/" + req.file.path})
    }

    for(let key in data){
        if(!data[key]){
            delete data[key];

        }
    }
    console.log(data)
    await User.findOneAndUpdate({_id:req.userData.userId},data,function(err, doc){
        if (err) return res.send(500, { message: err });
        return res.status(200).json({
            message:"User updated Successfully"
        })
    });

})

router.get('/get_all_users',requireLogin,async (req,res)=>{
    let users;
    const pageSize = +req.query.pagesize || 20;
    const currentPage = +req.query.page || 0;
  
   if(req.query.search){
     users = await User.find({'username' : new RegExp(req.query.search, 'i')})
     .skip(currentPage * pageSize)
     .limit(pageSize)
     
      users =  users.map((user)=>({
        _id:user._id,
        username:user.username,
        profile_pic:user.profile_pic
      }))
       
   }else{
       users =  await User.find({})
       .skip(currentPage * pageSize)
       .limit(pageSize)
   }
    users = users.map((user)=>{
        
       user = JSON.parse(JSON.stringify(user));
        // user.followers = user.followers.length;
        // user.followings = user.followings.length;
        // user.blocked_accounts = user.blocked_accounts.length,
        console.log(user)
        return user;
    })
   
   return res.status(200).json(users)
})

router.get('/get_all_followers/:id',requireLogin,async (req,res)=>{
    let user =  await User.findById(req.params.id).select('followers');
    const followers = await Promise.alluser.map(async (id)=> await User.findById(id))
    res.status(200).json(user.followers);
})

router.get('/get_user/:id',requireLogin,async (req,res)=>{
    let user =  await User.findById(req.params.id);
    user = JSON.parse(JSON.stringify(user));
    user.followers = user.followers.length;
    user.followings = user.followings.length;
    user.blocked_accounts = user.blocked_accounts.length;
    delete user['password']
    return res.status(200).json(user)
})

router.post('/follow/:id',requireLogin,async (req,res)=>{
    try{
    let loggedInUser = await  User.findById(req.userData.userId);
    //loggedInUser = JSON.parse(JSON.stringify(loggedInUser));
    let followed_user = await User.findById(req.params.id);
    let followings = JSON.parse(JSON.stringify(loggedInUser.followings));
    const followed_user_id = JSON.parse(JSON.stringify(followed_user._id));

    if(!(followings.includes(followed_user_id))){
    followed_user.followers.push(mongoose.Types.ObjectId(req.userData.userId));
    loggedInUser.followings.push(mongoose.Types.ObjectId(followed_user._id));
    await followed_user.save();
    await loggedInUser.save();
    return res.status(200).json({
        message:`${loggedInUser.username} started following ${followed_user.username}`
    })
}else{
    return res.status(200).json({
        message:`${loggedInUser.username} already following ${followed_user.username}`
    })
}
    }catch(err){
        console.log(err)
        return res.status(422).json({
            message:`Something went wrong`
        })
    }
})

router.post('/unfollow/:id',requireLogin,async (req,res)=>{
    try{
    let loggedInUser = await  User.findById(req.userData.userId);
    loggedInUser = JSON.parse(JSON.stringify(loggedInUser));
    let followed_user = await User.findById(req.params.id);
    followed_user = JSON.parse(JSON.stringify(followed_user));

    // followed_user.followers.push(mongoose.Types.ObjectId(req.userData.userId));
    console.log(followed_user.followers );
    console.log(loggedInUser.followings);
    followed_user.followers = followed_user.followers.filter((user)=>{
        return user != loggedInUser._id
    })
    console.log(followed_user.followers );
    // loggedInUser.followings.push(mongoose.Types.ObjectId(loggedInUser._id));
    loggedInUser.followings = loggedInUser.followings.filter((user)=>user != followed_user._id)
    console.log(loggedInUser.followings,followed_user._id);
    await User.findOneAndUpdate({_id:followed_user._id},{followers:followed_user.followers})
    await User.findOneAndUpdate({_id:loggedInUser._id},{followings:loggedInUser.followings})

    // await followed_user.save();
    // await loggedInUser.save();


    return res.status(200).json({
        message:`${loggedInUser.username} unfollowed ${followed_user.username}`
    })
    }catch(err){
        console.log(err)
        return res.status(422).json({
            message:`Something went wrong`
        })
    }
})

module.exports = router;
