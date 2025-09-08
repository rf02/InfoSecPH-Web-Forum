const express = require('express')
const router = express.Router();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const postModel = require('../model/schema/posts.js');
const communityModel = require('../model/schema/community.js');

function errorFn(err) {
    console.error('Error:', err);
}

function sortedDate(array, limit) {
    const sortedArray = array.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (limit !== undefined) 
      return sortedArray.slice(0, limit);
    
    return sortedArray;
  }

router.get('/:cid', async (req, res) => {
    try {
        const searchQuery = {};
        let leanUser;
        
        const post_data = await postModel.find(searchQuery).populate('uid').populate('cid').lean();
        const community_data = await communityModel.find(searchQuery).lean();
    
        if (req.user) {leanUser = req.user.toObject();}
    
        const cid = req.params.cid;
        const selected_community = community_data.find(community => community._id.toString() === cid);
    
        if (!selected_community) {
            return res.render('../views/error', {
                layout: 'invalid',
                title: 'Not Found'
            });
        }
        const communityPosts = post_data.filter(post => post.cid.some(obj => obj._id.toString() === cid));

        const top_posts = await postModel.aggregate([
            { $match: searchQuery },
            { $addFields: {totalvote: { $add: [{"$toInt":"$up"}, {"$toInt":"$down"}] }}},
            { $sort: { totalvote: -1 } },
            { $limit: 4 }
        ]);
          
        const posts = sortedDate(communityPosts);


        res.render('../views/main', {
            layout: 'index',
            title: 'InfoSec',
            posts: posts,
            log: leanUser,
            communityHeader: community_data,
            recent_posts: sortedDate(post_data, 3),
            top_posts: top_posts
        });
    } catch (err) {
        errorFn(err);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router
