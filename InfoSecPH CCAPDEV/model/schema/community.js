const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    cid:            {type: String},
    community_name: {type: String},
    color:          {type: String},
    image:          {type: String}
},{ versionKey: false });

module.exports = mongoose.model('community', communitySchema);