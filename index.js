/*======================================
=            MONGO CONNTECT            =
======================================*/
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/vk-chat-bot', (err) => {
	if ( err ) return console.error(err);

	console.log('Mongodb was connected!');
});


/*============================================
=            LISTEN PUBLIC SERVER            =
============================================*/
let { listen: listenPublicServer } = require('./public-server');
let { host, port } = require('./data/public-server-config');

listenPublicServer(() => console.log('Public server running in %s:%d', host, port));





/*=====================================
=            LISTEN VK BOT            =
=====================================*/
let { listen: listenVkBotServer } = require('./vk-bot-server');

listenVkBotServer(() => console.log('Vk bot start running'));



/*===========================
=            ETC            =
===========================*/
process.on('uncaughtException', (err) => console.error(err.stack));