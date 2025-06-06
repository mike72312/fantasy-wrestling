// Wrestler.js (in the root directory)
const mongoose = require('mongoose');

// Define the schema for wrestlers
const wrestlerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    score: { type: Number, default: 0 }, // Store current score
    team: { type: String, required: true }, // Team name
    events: [{
        outcome: String,
        isTitleMatch: Boolean,
        eliminations: Number,
        signatureMoves: Number,
        pinfalls: Number,
        specialAppearance: Boolean,
        titleChange: Boolean,
    }]
});

// Create the model using the schema
const Wrestler = mongoose.model('Wrestler', wrestlerSchema);

module.exports = Wrestler;