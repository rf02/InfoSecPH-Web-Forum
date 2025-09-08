// Install Command:
// npm init
// npm i express express-handlebars body-parser mongoose hbs bcrypt passport passport-local express-session express-flash dotenv method-override

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const server = express();
const path = require('path');

const helper = require('../components/hbsHelpers.js');

const methodOverride = require('method-override');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');

const logRouter = require(path.join(__dirname, '../controller/log.js'));
const profileRouter = require(path.join(__dirname, '../controller/profile.js'));
const communityRouter = require(path.join(__dirname, '../controller/community.js'));
const postRouter = require(path.join(__dirname, '../controller/post.js'));
const actionRouter = require(path.join(__dirname, '../controller/action.js'));

const userModel = require(path.join(__dirname, '../model/schema/users.js'));
const postModel = require(path.join(__dirname, '../model/schema/posts.js'));
const communityModel = require(path.join(__dirname, '../model/schema/community.js'));

const initializePassport = require(path.join(__dirname, '../public/commons/javascripts/passport-config.js'));
initializePassport(passport);

// Middleware
server.use(methodOverride('_method'));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(flash());
server.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  })
);
server.use(passport.initialize());
server.use(passport.session());

// View engine
const hbs = require('hbs');
server.set('view engine', 'hbs');
server.engine(
  'hbs',
  handlebars.engine({
    extname: 'hbs',
    helpers: {
      if_cond: helper.if_cond,
      isInCollection: helper.isInCollection,
      isSameId: helper.isSameId,
    },
  })
);

server.set('views', path.join(__dirname, '../views'));
server.use(express.static(path.join(__dirname, '../public')));

const mongoose = require('mongoose');
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}
connectDB();

// Utility functions
function sortedDate(array, limit) {
  const sortedArray = array.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (limit !== undefined) return sortedArray.slice(0, limit);
  return sortedArray;
}

// Routes
server.get('/', async (req, res) => {
  try {
    const searchQuery = {};
    let leanUser;

    const community_data = await communityModel.find(searchQuery).lean();
    const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
    const top_posts = await postModel.aggregate([
      { $match: searchQuery },
      { $addFields: { totalvote: { $add: [{ $toInt: '$up' }, { $toInt: '$down' }] } } },
      { $sort: { totalvote: -1 } },
      { $limit: 5 },
    ]);

    if (req.user) {
      leanUser = req.user.toObject();
    }

    const posts = sortedDate(post_data);

    res.render('main', {
      layout: 'index',
      title: 'InfoSec',
      posts: posts,
      log: leanUser,
      top_posts: top_posts,
      recent_posts: sortedDate(post_data, 5),
      communityHeader: community_data,
    });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

server.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    const searchQuery = {};

    let leanUser;
    if (req.user) {
      leanUser = req.user.toObject();
    }

    const community_data = await communityModel.find(searchQuery).lean();
    const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
    const top_posts = await postModel.aggregate([
      { $match: searchQuery },
      { $addFields: { totalvote: { $add: [{ $toInt: '$up' }, { $toInt: '$down' }] } } },
      { $sort: { totalvote: -1 } },
      { $limit: 5 },
    ]);

    const filtered_posts = post_data.filter((post) => {
      const postTitle = post.title.toString().toLowerCase();
      const username = post.uid.username.toString().toLowerCase();
      const queryString = query.toLowerCase();

      const matchesTitle = postTitle.includes(queryString);
      const matchesUsername = username.includes(queryString);
      const matchesCommunity = post.cid.some((community) => {
        const community_name = community.community_name.toString().toLowerCase();
        return community_name.includes(queryString);
      });

      return matchesTitle || matchesUsername || matchesCommunity;
    });

    res.render('main', {
      layout: 'index',
      title: 'InfoSec',
      posts: filtered_posts,
      log: leanUser,
      top_posts: top_posts,
      recent_posts: sortedDate(post_data, 5),
      communityHeader: community_data,
    });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

server.delete('/logout', checkAuthenticated, (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/log/login');
  }
}

server.use('/log', logRouter);
server.use('/profile', profileRouter);
server.use('/community', communityRouter);
server.use('/post', postRouter);
server.use('/action', actionRouter);

server.use((err, req, res, next) => {
  console.error('🔥 Express error:', err.stack || err);
  res.status(500).send('Something broke: ' + err.message);
});

module.exports = server;
