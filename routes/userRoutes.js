const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = mongoose.model("users"); //users is a collection name
const requireLogin = require('../middlewares/requireLogin');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);



router.put('/set_user_details',requireLogin,async (req,res)=>{
    const data = {
        bio: req.body.bio,
        isPrivate:req.body.isPrivate,
        username:req.body.username,
        password:req.body.password ? bcrypt.hashSync(req.body.password, salt): undefined
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
    const users = await User.find({});
   return res.status(200).json(users)
})

router.get('/get_user/:id',async (req,res)=>{
    const user =  await User.findById(req.params.id);
    return res.status.json(user)
})

module.exports = router;
