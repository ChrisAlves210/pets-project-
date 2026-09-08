"use strict";

const mongoose = require('mongoose'),
        Schema = mongoose.Schema;

const PetSchema = new Schema({
    name            : { type: String, required: true }
  , species         : { type: String, required: true }
  , birthday        : { type: String, required: true }
  , picUrl          : { type: String, required: true }
  , picUrlSq        : { type: String, required: true }
  , favoriteFood    : { type: String, required: true }
  , description     : { type: String, required: true, minlength: 140 }
},
{
  timestamps: true
});

module.exports = mongoose.model('Pet', PetSchema);
