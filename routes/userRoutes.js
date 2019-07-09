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

router.get('/get_all_users',async (req,res)=>{
    let users = await User.find({});
   
    users = users.map((user)=>{
        
       user = JSON.parse(JSON.stringify(user));
        user.followers = user.followers.length;
        user.followings = user.followings.length;
        user.blocked_accounts = user.blocked_accounts.length,
        console.log(user)
        return user;
    })
   
   return res.status(200).json(users)
})

router.get('/get_user/:id',async (req,res)=>{
    let user =  await User.findById(req.params.id);
    user = JSON.parse(JSON.stringify(user));
    user.followers = user.followers.length;
    user.followings = user.followings.length;
    user.blocked_accounts = user.blocked_accounts.length;
    delete user['password']
    return res.status(200).json(user)
})

module.exports = router;
