const express = require('express')
const router = express.Router()

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
const commentModel = require('../model/schema/comments.js');

function errorFn(err) {
    console.error('Error:', err);
}

function sortedDate(array, limit) {
    const sortedArray = array.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (limit !== undefined) 
      return sortedArray.slice(0, limit);
    
    return sortedArray;
  }

async function populateUserIds(data){
    await Promise.all(data.map(async (item) => {
        if (item.comment) {
        await Promise.all(item.comment.map(async (c) => {
            c.uid = await userModel.findById(c.uid).lean();
            if (c.reply) {
            await Promise.all(c.reply.map(async (r) => {
                r.uid = await userModel.findById(r.uid).lean();
            }));
            }
        }));
        }
    }));
}

router.post('/friend/:uid',  checkAuthenticated, async (req, res) =>{
    try {
        const uid = req.params.uid;
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        await userModel.updateOne(
            { _id: leanUser._id },
            { $addToSet: { friends: uid } }
        );

        res.redirect(`/profile/${uid}`)
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/comments/:uid', async (req, res) => {
    try{
        const uid = req.params.uid;
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        const user_data = await userModel.find(searchQuery).lean();
        const comment_data = await commentModel.find({ 'comment.uid': uid }).lean();

        await populateUserIds(comment_data)

        const selected_user = user_data.find(user => user._id.toString() === uid);

        res.render('../views/partials/comments', {
            layout: 'user',
            title: 'InfoSec',
            user: selected_user,
            comments: comment_data,
        });

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:uid', async (req, res) => {
    try {
        const searchQuery = {};
        const profQuery = {uid: req.params.uid};

        let leanUser;

        const user_data = await userModel.find(searchQuery).lean();
        const post_data = await postModel.find(profQuery).populate('uid').populate('cid').lean();
        const community_data = await communityModel.find(searchQuery).lean();
        
        if (req.user) {leanUser = req.user.toObject();}

        //66090762e6eebfd300780c1d
    
        const uid = req.params.uid;
        const selected_user = user_data.find(user => user._id.toString() === uid);
    
        if (!selected_user) {
            return res.render('../views/error', {
                layout: 'invalid',
                title: 'Not Found'
            });
        }

        // const userPosts = post_data.find({post.uid: uid})
        // const userPosts = post_data.filter(post => post.uid._id.toString() === uid);
        // const userPosts = post_data.filter(post => post.uid.toString() === uid)
    
        // console.log(post_data);
        res.render('../views/profile', {
            layout: 'user',
            title: 'InfoSec',
            user: selected_user,
            posts: sortedDate(post_data,post_data.length),
            log: leanUser,
            communityHeader: community_data,
        });
    
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
