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

function getFormattedDate() {
    const currentDate = new Date();
    const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    };
    return currentDate.toLocaleString('en-US', options);
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

function errorFn(err) {
    console.error('Error:', err);
}

router.get('/create', checkAuthenticated, async (req, res) => {
    try{
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        const community_data = await communityModel.find(searchQuery).lean();

        res.render('../views/create', {
            layout: 'user',
            title: 'InfoSec',
            log: leanUser,
            communities: community_data,
        })

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/create', checkAuthenticated, async (req, res) => {
    try{
        const {title, text, image, community} = req.body

        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        const newPost = new postModel({
            uid: leanUser._id,
            cid: community,
            title,  
            text,
            hidden: false,
            ifwithImage: image ? true : false,
            image: image || null,
            date: getFormattedDate(),
            up: 0,
            down: 0,
        });

        await newPost.save();

        res.redirect('/');

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/edit/:pid', checkAuthenticated, async(req, res) =>{
    try{
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}
        const community_data = await communityModel.find(searchQuery).lean();
        const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();

        const pid = req.params.pid;
        const post = post_data.find(post => post._id.toString() === pid);

        res.render('../views/edit', {
            layout: 'user',
            title: 'InfoSec',
            log: leanUser,
            communities: community_data,
            post: post
        })
        
    } catch (err){
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/edit/:pid', checkAuthenticated,  async (req, res) => {
    try {
        const pid = req.params.pid;
        const { title, text, image, community } = req.body;

        const post = await postModel.findById(pid);

        if (community)
            post.cid = community;
        if (title)
            post.title = title;
        if (text.length > 0) 
            post.text = text;
        if (image){
            post.ifwithImage = !!image;
            post.image = image || null;
        }

        post.edited = true;

        await post.save();



        res.redirect(`/post/${pid}`);
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/delete/:pid', checkAuthenticated, async (req, res) => {
    try{
        const searchQuery = {};

        const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();

        const pid = req.params.pid;
        const post = post_data.find(post => post._id.toString() === pid);

        res.render('../views/alerts/delete', {
            layout: 'userd',
            title: 'InfoSec',
            post: post,
        })

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/delete/:pid', checkAuthenticated, async (req, res) => {
    try{
        const searchQuery = {};

        const pid = req.params.pid;
        const post = await postModel.findByIdAndUpdate(pid, { hidden: true }, { new: true });

        res.redirect('/');
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/comment/:pid', checkAuthenticated, async (req, res) =>{
    try{
        const pid = req.params.pid;
        const { comment } = req.body;

        if (!comment || comment.trim() === '') {
            return res.redirect(`/post/${pid}`);
        }

        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        const newComment = {
            uid: leanUser._id,
            text: comment,
            up: 0,
            down: 0,
            reply: []
        };

        let commentThread = await commentModel.findOne({ pid: pid });
        if (!commentThread) { commentThread = new commentModel({ pid: pid, comments: [] });}

        commentThread.comment.push(newComment);
        await commentThread.save(); 

        res.redirect(`/post/${pid}`);
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/comment/:pid/:uid', checkAuthenticated, async (req, res) =>{
    try{
        const { pid, uid } = req.params;
        const { reply } = req.body;

        if (!reply || reply.trim() === '') {
            return res.redirect(`/post/${pid}`);
        }

        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        let commentThread = await commentModel.findOne({ pid: pid });
        let comment = null;
    
        if (commentThread) { comment = commentThread.comment.find(c => c.uid.toString() === uid); }


        comment.reply.push({
            uid: leanUser._id,
            text: reply,
            up: 0,
            down: 0
        });

        await commentThread.save()

        res.redirect(`/post/${pid}`);
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/:pid', async (req, res) =>{
    try {
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}

        const community_data = await communityModel.find(searchQuery).lean();
        const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
        const comment_data = await commentModel.find(searchQuery).lean();

        await populateUserIds(comment_data);
    
        const pid = req.params.pid;
        const post = post_data.find(post => post._id.toString() === pid);

        if (!post) {res.render('../views/error', {
            layout: 'invalid',
            title: 'Not Found'
        })}

        const commentThread = comment_data.find(comment => comment.pid.toString() === pid)

        res.render('../views/post', {
            layout: 'user',
            title: 'InfoSec',
            post: post,
            commentThread: commentThread,
            log: leanUser,
            communityHeader: community_data
        })

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

function checkAuthenticated (req, res, next){
    if(req.isAuthenticated()){
      return next()
    }
    else{
      res.redirect('/log/login')
    }
}


module.exports = router
