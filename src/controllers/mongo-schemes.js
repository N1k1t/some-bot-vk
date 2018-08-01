const mongoose = require('mongoose');
const db = mongoose.connection;

const userSchema = mongoose.Schema({
	userId: String,
	currentQuestion: Number,
	timestamp: Number,
	questionsAttempts: Array,
});
const photosSchema = mongoose.Schema({
	path: String,
	photoId: String,
	ownerId: String,
	timestamp: Number
});

module.exports = {
	User: mongoose.model('User', userSchema),
	Photo: mongoose.model('Photo', photosSchema)
}