const express = require('express')
const router = express.Router();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const userModel = require('../model/schema/users.js');
const postModel = require('../model/schema/posts.js');
const communityModel = require('../model/schema/community.js');

function errorFn(err) {
    console.error('Error:', err);
}

router.post('/up/:pid', checkAuthenticated, async (req, res) =>{
    try{
        const searchQuery = {};
        let leanUser;
    
        if (req.user) {leanUser = req.user.toObject();}

        console.log('success')


    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/down/:pid', checkAuthenticated, async (req, res) =>{
    try{
        const searchQuery = {};
        let leanUser;
    
        if (req.user) {leanUser = req.user.toObject();}

        console.log('success')


    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/bookmark/:pid', checkAuthenticated, async (req, res) =>{
    try{
        const pid = req.params.pid
        let leanUser;
    
        if (req.user) {leanUser = req.user.toObject();}

        await userModel.updateOne(
            { _id: leanUser._id },
            { $addToSet: { bookmarks: pid } }
        );

        res.redirect(`/post/${pid}`)

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

function checkAuthenticated (req, res, next){
    if(req.isAuthenticated()){
      return next()
    }
    else{
      res.redirect('/log/login')
    }
}


module.exports = router
