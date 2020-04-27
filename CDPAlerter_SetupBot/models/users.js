const mongoose = require('mongoose')

const users = new mongoose.Schema({
  userid: {type:Number, default: 0},
  vault: {type:Number, default: 0},
  threshold: {type:Number, default: 0}
})

module.exports = mongoose.model('users', users)