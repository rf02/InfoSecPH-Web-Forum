const mongoose = require('mongoose');
const postSchema = require('./posts');

const userSchema = new mongoose.Schema({
    uid:        {type: String},
    username:   {type: String},
    name:       {type: String},
    bio:        {type: String},
    pfp:        {type: String},
    password:   {type: String},
    friends:    [{type: mongoose.SchemaTypes.ObjectId, ref:"user"}],
    bookmarks:  [{type: mongoose.SchemaTypes.ObjectId, ref:"post"}]
},{ versionKey: false });
  
module.exports = mongoose.model('user', userSchema);