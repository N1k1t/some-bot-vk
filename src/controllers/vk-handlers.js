const Async = require('some-async-chain');

const { User, Photo } = require('./mongo-schemes');
const { getTimestamp, strEq, parseWordByNumber } = require('./tools');
const { sendMessage, vkApiGet, vkUploadPhoto, getPhoto } = require('./vk-api-tools');

function onCurrentQuestion(user, reply, cb = Function(null)){
	let { currentQuestion } = user;
	const questions = require('../../data/vk-bot-questions.json');
	const chain = Async.create();

	if ( questions[currentQuestion].img ) chain.next(({ next }) => getPhoto(questions[currentQuestion].img, user.userId, (photo) => next(photo)));

	chain.next(({ next, data }, photo) => reply(questions[currentQuestion].title, photo ? `photo${photo.ownerId}_${photo.photoId}` : null, () => cb()));
}
function onStartMessage(user, reply){
	const context = require('../../data/vk-bot-config.json');
	const chain = Async.create();

	if ( context.startMessagePic ) chain.next(({ next }) => getPhoto(context.startMessagePic, user.userId, (photo) => next(photo)));

	chain.next(({ next }, photo) => {
		reply(context.startMessage, photo ? `photo${photo.ownerId}_${photo.photoId}` : null);
	});
}
function onEndMessage(user, reply){
	const context = require('../../data/vk-bot-config.json');
	const chain = Async.create();

	if ( context.endMessagePic ) chain.next(({ next }) => getPhoto(context.endMessagePic, user.userId, (photo) => next(photo)));

	chain.next(({ next }, photo) => {
		reply(context.endMessage, photo ? `photo${photo.ownerId}_${photo.photoId}` : null, () => next());
	});

	if ( context.showGiftsOnEnd ) chain.next(({ next }) => getAttemptsGift(user, reply, () => next()));
	if ( context.showAttemptsStatsOnEnd ) chain.next(({ next }) => getAttemptsStats(user, reply, () => next()));
}
function onMiddle(message, user, reply, next){
	const context = require('../../data/vk-bot-config.json');
	const questions = require('../../data/vk-bot-questions.json');

	if ( strEq(message.body, context.resetMessageReply) ){
		user.currentQuestion = 0;
		user.questionsAttempts = [];
		user.save();

		return onCurrentQuestion(user, reply);
	}

	next();
}
function getAttemptsGift(user, reply, cb = Function(null)){
	const context = require('../../data/vk-bot-config.json');
	let { questionsAttempts: attempts } = user;
	let max = 0;

	attempts.map((value) => max += value);

	for ( let key in context.giftsByAttempts ){
		let gift = context.giftsByAttempts[key];

		key = parseInt(key);

		if ( max <= key ) return onReply(gift);
	}

	function onReply(data){
		const chain = Async.create();

		if ( data.pic ) chain.next(({ next }) => getPhoto(data.pic, user.userId, (photo) => next(photo)));

		chain.next(({ next }, photo) => {
			reply(data.title, photo ? `photo${photo.ownerId}_${photo.photoId}` : null, () => cb());
		});
	}
}
function getAttemptsStats(user, reply, cb = Function(null)){
	const context = require('../../data/vk-bot-config.json');
	const questions = require('../../data/vk-bot-questions.json');
	let { questionsAttempts: attempts } = user;
	let resultStr = '';
	let attemptsStr = '';
	let max = 0;

	attempts.map((value, key) => {
		let questionStatsTitle = questions[key].statsTitle || '';

		attemptsStr += `Вопрос ${key + 1} ${questionStatsTitle ? `(${questionStatsTitle})` : ''}: ${value} ${parseWordByNumber(value, 'попытка', 'попытки', 'попыток')}\n`;
		max += value;
	});

	resultStr = `${context.ensStatsMessage}\nВсего неправильных ответов: ${max}`;
	if ( context.showFullAttemptsStats ) resultStr += `\n${attemptsStr}`;

	reply(resultStr, null, () => cb());
}

module.exports = {
	onCurrentQuestion: onCurrentQuestion,
	onStartMessage: onStartMessage,
	onEndMessage: onEndMessage,
	onMiddle: onMiddle,
}