const FormData = require('form-data');
const https = require('https');
const url = require('url');
const Async = require('some-async-chain');

const { vkAccessToken } = require('./data/vk-server-config');
const { onCurrentQuestion, onStartMessage, onEndMessage, onMiddle } = require('./src/controllers/vk-handlers');
const { sendMessage, vkApiGet, vkUploadPhoto, getPhoto } = require('./src/controllers/vk-api-tools');
const { getTimestamp, strEq, parseWordByNumber } = require('./src/controllers/tools');
const { User, Photo } = require('./src/controllers/mongo-schemes');

const VkApi = require('node-vk-bot-api');
const vkBot = new VkApi(vkAccessToken);

vkBot.on(onReply);

function onReply({ reply, body, attachments, peer_id: userId }){
	const chain = Async.create();
	const questions = require('./data/vk-bot-questions.json');
	const context = require('./data/vk-bot-config.json');

	chain.next(({ next }) => {
		User.find({ userId: userId }, (err, users) => {
			if ( err ) return console.log(err);
			if ( !users[0] ) return next();

			next(users[0]);
		});
	});
	
	chain.next(({ next }, user) => {
		if ( user ) return next(user);

		new User({ userId: userId, currentQuestion: -1, questionsAttempts: [], timestamp: getTimestamp() }).save((err, result) => next(result));
	});
	
	chain.next(({ next, data }, user) => {
		data.user = user;

		let { currentQuestion } = user;

		if ( user.currentQuestion == -1 ){
			if ( !strEq(body, context.startMessageReply) ) return onStartMessage(user, reply);
			
			user.currentQuestion = 0;
			user.save();

			return next();
		}
		if ( strEq(body, context.getCurrentQuestionReply) ) return next();

		onMiddle({ body: body, attachments: attachments }, user, reply, (skipAnswerAnalize) => {
			if ( questions.length == user.currentQuestion ) return next();

			let isAnswerRight = strEq(body, questions[user.currentQuestion].answer);

			if ( !user.questionsAttempts[currentQuestion] ) user.questionsAttempts[currentQuestion] = 0;
			if ( !isAnswerRight ){
				user.questionsAttempts[currentQuestion]++;
				user.markModified('questionsAttempts');
				user.save();

				return reply(context.wrongAnswerMessage)
			}
			if ( isAnswerRight ) user.currentQuestion++;

			reply(context.rightAnswerMessage, null, () => {
				user.markModified('questionsAttempts');
				user.save(() => next());
			});
		});
	});
	
	chain.next(({ next, data }) => {
		let { user } = data;

		if ( questions.length == user.currentQuestion )return onEndMessage(user, reply);

		onCurrentQuestion(user, reply);
	});
}

module.exports = {
	listen: (cb) => {
		vkBot.listen();
		cb();
	}
}