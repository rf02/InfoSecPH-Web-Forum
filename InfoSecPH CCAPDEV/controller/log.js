const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const bcrypt = require('bcrypt');
const passport = require('passport')

const userModel = require('../model/schema/users.js');
const postModel = require('../model/schema/posts.js');
const communityModel = require('../model/schema/community.js');

function errorFn(err) {
    console.error('Error:', err);
}

router.get('/signup', checkNotAuthenticated, async (req, res) => {
    try{
        const searchQuery = {};
        const community_data = await communityModel.find(searchQuery).lean();

        res.render('../views/partials/signup', {
            layout: 'log',
            title: 'InfoSec',
            communityHeader: community_data,
        })
    }
    catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/signup', checkNotAuthenticated, async (req, res) => {
    const { username, name, password, password2 } = req.body;
    
    try {
        if (password !== password2){
            return res.render('../views/alerts/error2', {
                layout: 'invalid',
                title: 'Error'
            });
        }

        const existingUser = await userModel.findOne({ username });

        if (existingUser){
            return res.render('../views/alerts/error2', {
                layout: 'invalid',
                title: 'Error'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await userModel.create({
            username,
            name,
            bio: 'No bio',
            pfp: 'https://static.thenounproject.com/png/1095867-200.png',
            posts: 0,
            password: hashedPassword
        });
        res.redirect('/');

    } catch (error) {
        console.error('Signup error:', error);
        res.redirect('/log/signup');
    }
});


router.get('/login', checkNotAuthenticated,  async (req, res) => {
    try{
        const searchQuery = {};
        const community_data = await communityModel.find(searchQuery).lean();

        res.render('../views/partials/login', {
            layout: 'log',
            title: 'InfoSec',
            communityHeader: community_data,
            message: req.flash('error')
        })
    }
    catch (err) {
        console.error('Login error:', error);
        res.redirect('/log/login');
    }
})

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/log/login',
    failureFlash: true
}))

router.get('/about', (req, res) =>{

    const searchQuery = {};

    communityModel.find(searchQuery).lean().then(function(community_data) {
        res.render('../views/partials/about', {
            layout: 'nav',
            title: 'InfoSec',
            communityHeader: community_data,
        })
    }).catch(errorFn) 
})

router.get('/friends', checkAuthenticated, async (req, res) =>{

    try{
        const searchQuery = {};
        let leanUser;

        if (req.user) {leanUser = req.user.toObject();}
        if (req.user)
            leanUser = await userModel.findById(req.user._id).populate('friends').lean();

        const community_data = await communityModel.find(searchQuery).lean();

        res.render('../views/partials/friends', {
            layout: 'user',
            title: 'InfoSec',
            communityHeader: community_data,
            log: leanUser
        })

    }catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/settings', checkAuthenticated, (req, res) =>{

    const searchQuery = {};
    let leanUser;

    if (req.user) {leanUser = req.user.toObject();}

    communityModel.find(searchQuery).lean().then(function(community_data) {
        res.render('../views/partials/settings', {
            layout: 'nav',
            title: 'InfoSec',
            communityHeader: community_data,
            log: leanUser
        })
    }).catch(errorFn) 
})

router.post('/settings', checkAuthenticated, async (req, res) =>{
    const {username, password, firstName, lastName, bio, pfp} = req.body;

    try {
        const user = await userModel.findById(req.user._id);
        
        if(username){
            const existingUser = await userModel.findOne({ username });

            if (existingUser){
                return res.render('../views/alerts/error2', {
                    layout: 'invalid',
                    title: 'Error'
                });
            }
            else
                user.username = username;
        }
        if(password)
            user.password = await bcrypt.hash(password, 10);
        if(firstName || lastName)
            user.name = `${firstName} ${lastName}`;
        if(bio)
            user.bio = bio;
        if(pfp)
            user.pfp = pfp;
        else
            user.pfp = user.pfp
        
        await user.save();
        
        res.redirect('/log/settings');
    } catch (error) {
        console.error('Error updating user information:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.delete('/settings', checkAuthenticated, async (req, res, next) => {
    try {

        if (req.user) {req.user = req.user.toObject();}

        const userId = req.user._id;
        const deletedUser = await userModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).send('User not found');
        }

        req.logout(() => {
            console.log('User deleted');
        });

        res.redirect('/');

    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/bookmark', checkAuthenticated, async (req, res) => {
    try {
        const searchQuery = {};
        let leanUser;
    
        if (req.user) {leanUser = req.user.toObject();}

        const bookmarks = leanUser.bookmarks;
        const community_data = await communityModel.find(searchQuery).lean();
        const bookmarkedPosts = await Promise.all(bookmarks.map(async (post) => {
            const postDoc = await postModel.findById(post._id).populate('uid').populate('cid');
            return postDoc.toObject();
        }));

        res.render('../views/main', {
            layout: 'index',
            title: 'InfoSec',
            posts: bookmarkedPosts,
            log: leanUser,
            communityHeader: community_data,
        });

    } catch (err) {
        console.error('Error retrieving user data:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/unfriend/:uid', checkAuthenticated, async (req, res) =>{
    try{
        const uid = req.params.uid;
        let leanUser;
    
        if (req.user) {leanUser = req.user.toObject();}

        await userModel.updateOne(
            { _id: leanUser._id },  
            { $pull: { friends: uid } }
        );

        res.redirect('/log/friends')
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});


function checkNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}

function checkAuthenticated (req, res, next){
    if(req.isAuthenticated()){
      return next()
    }
    else{
      res.redirect('/log/login')
    }
}


module.exports = router
