const { User, Photo } = require('./mongo-schemes');

function sendMessage(userId, message, cb = Function(null)){
	const queryString = require('querystring');

	https.get(`https://api.vk.com/method/messages.send?user_id=${userId}&message=${queryString.escape(message)}&access_token=${vkAccessToken}&v=5.80`, (res) => {
		const chain = Async.create();

		chain.next(({ next }) => {
			res.body = '';
			res.on('data', (chunk) => res.body += chunk);
			res.on('end', () => next(JSON.parse(res.body)));
		});

		chain.next(({next: next}, data) => cb(data));
	});
}
function vkApiGet(method, query, cb = Function(null)){
	const queryString = require('querystring');

	https.get(`https://api.vk.com/method/${method}?${query}&access_token=${vkAccessToken}&v=5.80`, (res) => {
		res.body = '';
		res.on('data', (chunk) => res.body += chunk);
		res.on('end', () => cb(JSON.parse(res.body)));
	});
}
function vkUploadPhoto(filePath, userId, cb = Function(null)){
	const chain = Async.create();

	chain.next(({ next, data }) => {
		fs.stat(filePath, (err, stats) => {
			data.photo = {
				fileName: Path.basename(filePath),
				size: stats.size,
				extName: Path.extname(filePath).substr(1),
				path: filePath
			}

			next();
		});
	});
	chain.next(({ next, data }) => {
		fs.readFile(filePath, (err, file) => {
			if ( err ) return console.log(err);

			data.photo.array = file;
			next();
		});
	});
	chain.next(({ next, data }) => {
		vkApiGet('photos.getMessagesUploadServer', `peer_id=${userId}`, (res) => next(res));
	});
	chain.next(({ next, data }, { response }) => {
		let { upload_url: uploadUrl } = response;
		let { photo } = data;
		let form = new FormData();

		uploadUrl = url.parse(uploadUrl);

		form.append('photo', photo.array, {
			filename: photo.fileName,
			filepath: photo.path,
			contentType: `image/${photo.extName}`,
			knownLength: photo.size
		});
		form.submit(uploadUrl, function(err, res) {
			if (err) console.log(err);
			next(res);
		});
	});
	chain.next(({ next, data }, res) => {
		res.body = '';
		res.on('data', (chunk) => res.body += chunk);
		res.on('end', () => next(JSON.parse(res.body)));
	});
	chain.next(({ next, data }, res) => {
		let { photo, server, hash } = res;

		vkApiGet('photos.saveMessagesPhoto', `server=${server}&photo=${photo}&hash=${hash}`, ({ response }) => {
			new Photo({ timestamp: getTimestamp(), path: filePath, photoId: response[0].id, ownerId: response[0]['owner_id'] }).save();

			cb(response);
		});
	});
}
function getPhoto(path, userId, cb){
	Photo.find({ path: path }, (err, photos) => {
		if ( err ) return console.log(err);
		if ( !photos[0] ) return vkUploadPhoto(path, userId, (response) => {
			cb({ photoId: response[0].id, ownerId: response[0]['owner_id'] })
		});

		cb({ photoId: photos[0].photoId, ownerId: photos[0].ownerId });
	});
}

module.exports = {
	sendMessage: sendMessage,
	vkApiGet: vkApiGet,
	vkUploadPhoto: vkUploadPhoto,
	getPhoto: getPhoto
}