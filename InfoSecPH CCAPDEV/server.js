//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose hbs bcrypt passport passport-local express-session express-flash dotenv method-override

if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const express = require('express')
const helper = require('./components/hbsHelpers.js');
const server = express()

const methodOverride = require('method-override')
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const path = require('path')

const logRouter = require('./controller/log.js')
const profileRouter = require('./controller/profile.js')
const communityRouter = require('./controller/community.js')
const postRouter = require('./controller/post.js')
const actionRouter = require('./controller/action.js')

const userModel = require('./model/schema/users.js');
const postModel = require('./model/schema/posts.js');
const communityModel = require('./model/schema/community.js');

const initializePassport = require('./public/commons/javascripts/passport-config.js')
initializePassport(passport)


server.use(methodOverride('_method'))
server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.use(flash())
server.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000)  
  }
}))
server.use(passport.initialize())
server.use(passport.session())


const hbs = require('hbs')
server.set('view engine', 'hbs')
server.engine('hbs', handlebars.engine({
  extname: 'hbs',
  helpers: {
    if_cond: helper.if_cond,
    isInCollection: helper.isInCollection,
    isSameId: helper.isSameId
  }
}))

server.use(express.static('public'))

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


function errorFn(err) {
  console.error('Error:', err);
}

function sortedDate(array, limit) {
  const sortedArray = array.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (limit !== undefined) 
    return sortedArray.slice(0, limit);
  
  return sortedArray;
}

function getFormattedDate() {
  const currentDate = new Date();
  const options = {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: true
  };
  return currentDate.toLocaleString('en-US', options);
}


server.get('/', async (req, res) => {
  try {
    const searchQuery = {};
    let leanUser;

 
    const community_data = await communityModel.find(searchQuery).lean();
    const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
    const top_posts = await postModel.aggregate([
      { $match: searchQuery },
      { $addFields: {totalvote: { $add: [{"$toInt":"$up"}, {"$toInt":"$down"}] }}},
      { $sort: { totalvote: -1 } },
      { $limit: 5 }
    ]);

    if (req.user) {leanUser = req.user.toObject();}

    const posts = sortedDate(post_data);

    res.render('main', {
      layout: 'index',
      title:  'InfoSec',
      posts: posts,
      log: leanUser,
      top_posts: top_posts,
      recent_posts: sortedDate(post_data, 5),
      communityHeader: community_data,
    });

  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal Server Error');
  }
});

server.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    const searchQuery = {};

    let leanUser;
    if (req.user) {leanUser = req.user.toObject();}

    const community_data = await communityModel.find(searchQuery).lean();
    const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
    const top_posts = await postModel.aggregate([
      { $match: searchQuery },
      { $addFields: {totalvote: { $add: [{"$toInt":"$up"}, {"$toInt":"$down"}] }}},
      { $sort: { totalvote: -1 } },
      { $limit: 5 }
    ]);

    const filtered_posts = post_data.filter(post => {
      const postTitle = post.title.toString().toLowerCase();
      const username = post.uid.username.toString().toLowerCase();

      const queryString = query.toLowerCase();

      const matchesTitle = postTitle.includes(queryString);

      const matchesUsername = username.includes(queryString);

      console.log(matchesUsername)

      const matchesCommunity = post.cid.some(community => {
        const community_name = community.community_name.toString().toLowerCase();
        return community_name.includes(queryString);
      });

      return matchesTitle || matchesUsername || matchesCommunity;
    });

    console.log(filtered_posts)

    res.render('main', {
      layout: 'index',
      title:  'InfoSec',
      posts: filtered_posts,
      log: leanUser,
      top_posts: top_posts,
      recent_posts: sortedDate(post_data, 5),
      communityHeader: community_data,
    });

  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal Server Error');
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

function checkAuthenticated (req, res, next){
  if(req.isAuthenticated()){
    return next()
  }
  else{
    res.redirect('/log/login')
  }
}

server.use('/log', logRouter)
server.use('/profile', profileRouter)
server.use('/community', communityRouter)
server.use('/post', postRouter)
server.use('/action', actionRouter)

const port = process.env.PORT | 3000
server.listen(port, function(){
  console.log('Listening to port ' + port)
})
