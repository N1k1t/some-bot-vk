const { removeFromCache } = require('some-module-utils');
const { User, Photo } = require('./src/controllers/mongo-schemes');
const { vkAccessToken } = require('./data/vk-server-config');
const { host, port, serviceAccessToken } = require('./data/public-server-config');

const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.static('./public'));

app.get('/tools', async (req, res) => {
	await validateToken(req, res);

	fs.readFile('./public/tools.html', 'utf-8', (err, contents) => res.send(contents));
});
app.get('/clear-configs-cache', async (req, res) => {
	await validateToken(req, res);

	removeFromCache(`${process.cwd()}/config.json`);
	removeFromCache(`${process.cwd()}/questions.json`);

	res.json({ status: 1, message: 'Success' });
});
app.get('/clear-images-cache', async (req, res) => {
	await validateToken(req, res);

	Photo.deleteMany({ path: /\./ }, (err, result) => res.json({ status: 1, message: 'Success' }));
});
app.get('/drop-database', async (req, res) => {
	await validateToken(req, res);

	db.dropDatabase();

	res.json({ status: 1, message: 'Success' });
});
app.get('/get-users-count', async (req, res) => {
	await validateToken(req, res);

	User.count((err, result) => res.json({ status: 1, data: result, message: 'Success' }));
});
app.get('/get-cached-images-count', async (req, res) => {
	
	Photo.count((err, result) => res.json({ status: 1, data: result, message: 'Success' }));
});

function validateToken(req, res){
	return new Promise((resolve) => {
		if ( !req.query.token ) return res.json({ status: 0, message: 'Access token is not alowed' });
		if ( req.query.token !== serviceAccessToken ) return res.json({ status: 0, message: 'Access token is not alowed' });

		resolve();
	});
}

module.exports = {
	listen: (cb) => app.listen(port, host, cb)
}