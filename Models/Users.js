'use strict'

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const Users = new Schema({
    name: {type: String, required:true},
    emailId: {type: String, trim: true, unique: true, index: true},
    accessToken: {type: String, trim: true, index: true, unique: true, sparse: true},
    password: {type: String, required:true},
    passwordResetToken: {type: String, trim: true, unique: true, sparse:true},
    registrationDate: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Users', Users);