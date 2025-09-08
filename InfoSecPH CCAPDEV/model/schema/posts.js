const mongoose = require('mongoose');
const userSchema = require('./users');
const communitySchema = require('./community');

const postSchema = new mongoose.Schema({
    uid:         {type: mongoose.SchemaTypes.ObjectId, ref:"user"},
    cid:         [{type: mongoose.SchemaTypes.ObjectId, ref:"community"}],
    hidden:      {type: Boolean},
    title:       {type: String},
    text:        {type: String},
    image:       {type: String},
    date:        {type: String},
    up:          {type: Number},
    down:        {type: Number},
    edited:      {type: Boolean}
},{ versionKey: false });


module.exports = mongoose.model('post', postSchema);