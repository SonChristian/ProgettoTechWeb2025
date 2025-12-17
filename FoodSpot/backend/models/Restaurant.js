// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: String,
    latitude: Number,
    longitude: Number,
    availableSeats: Number,
    openingHours: String
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
