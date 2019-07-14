const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
// const challenge = require("../models/challenges");
const Challenge = mongoose.model("challenges");
const User = mongoose.model("users"); //users is a collection name

const multer = require('multer');
const requireLogin = require('../middlewares/requireLogin');

const storage = multer.diskStorage({
	destination: function(req,file,cb) {
       cb(null,"./uploads/");
	},
	filename: function(req,file,cb) {
		cb(null,new Date().toISOString()+file.originalname);
	}
});
const fileFilter = (req,file,cb) => {
	if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
		cb(null,true);
	}else {
		cb(null,false);
	}
};
const upload = multer({storage:storage,fileFilter:fileFilter});

router.post('/create',requireLogin,(req,res,next) =>{
	console.log(req.file);
	const challenge = new Challenge({
		title : req.body.title,
		description : req.body.description,
		creator: mongoose.Types.ObjectId(req.userData.userId),
        filetype: req.body.filetype,
        given_to : req.body.given_to
        

        //comment for commit
    
	});
	challenge.save().then(createdPost => {
		res.status(200).json({
			message:"Challenge added successfully",
		});
	}).catch(error => {
        console.log(error);
		res.status(500).json({
			message:"Challenge creation failed"
		});
	});
});

router.get('/fetch/:username',(req,res,next) => {
    Challenge.findOne({username:req.params.username}).then(challenge=>{
        if(challenge){
            res.status(200).json(challenge);
        }
        else {
            res.status(404).json({message:'Challenge not found'});

        }
    })
    .catch(error=>{
      res.status(500).json({
         message: "Fetching Challenge failed"
      });
    });
});

router.get('/fetch_my_challenges/:id',requireLogin,async (req,res)=>{

    try{
        const challenges = await Challenge.find({creator:req.params.id});
        res.status(200).json(challenges);
    }catch(error){
        res.status(500).json({
            msg:"Internal Server Error"
        })
    }
})

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
router.put('/update/:id',(req,res,next) => {
    const challenge_new_data = {
        title:req.body.title,
        discription:req.body.description,
        filetype:req.body.filetype
    }
    for(let key in challenge_new_data){
        if(!challenge_new_data[key]){
            delete challenge_new_data[key];
        }
    }
    Challenge.findById(req.params.id).then(challenge=>{
        if(challenge){
            Object.assign(challenge,challenge_new_data);
            res.status(200).json(challenge);
        }
        else {
            res.status(404).json({message:'Challenge not found'});
        }
    })
    .catch(error=>{
      res.status(500).json({
         message: "Fetching Challenge failed"
      });
    });
});

router.delete('/delete/:id',requireLogin,async (req,res)=>{
    try{
    await Challenge.deleteOne({_id:req.params.id});
    return res.status(200).json({
        message:"Challenge deleted successfully"
    })
    }catch(err){
        return res.status(404).json({
            message:"Failed to find Challenge"
        })
    }

})

module.exports = router;