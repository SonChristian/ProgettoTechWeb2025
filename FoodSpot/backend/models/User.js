const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    restaurantName: String,
    date: String,
    time: String,
    numPeople: Number
});

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema, 'users');
