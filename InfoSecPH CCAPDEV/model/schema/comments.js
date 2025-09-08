const mongoose = require('mongoose');
const postSchema = require('./posts');
const userSchema = require('./users');

const commentSchema = new mongoose.Schema({
    pid:            {type: mongoose.SchemaTypes.ObjectId, ref:"post"},
    comment: [{
          _id: false,
          uid:      {type: mongoose.SchemaTypes.ObjectId, ref:"user"},
          text:     {type: String},
          up:       {type: Number},
          down:     {type: Number},
          reply: [{
            _id: false,
            uid:    {type: mongoose.SchemaTypes.ObjectId, ref:"user"},
            text:   {type: String},
            up:     {type: Number},
            down:   {type: Number}
          }]
    }]
}, {versionKey: false })

module.exports = mongoose.model('comment', commentSchema);
