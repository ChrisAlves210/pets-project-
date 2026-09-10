"use strict";

const mongoose = require('mongoose'),
        Schema = mongoose.Schema;

const PetSchema = new Schema({
    name            : { type: String, required: true }
  , species         : { type: String, required: true }
  , birthday        : { type: String, required: true }
  , picUrl          : { type: String }
  , picUrlSq        : { type: String }
  , avatarUrl       : { type: String }
  , favoriteFood    : { type: String, required: true }
  , description     : { type: String, required: true, minlength: 140 }
  , price           : { type: Number, required: true, min: 0, default: 9.99 }
},
{
  timestamps: true
});

module.exports = mongoose.model('Pet', PetSchema);
