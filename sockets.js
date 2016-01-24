// Handles sockets

var io = require('socket.io');
var fs = require('fs-extra');
var crypto = require('crypto');
var path = require('path');
var haiku = require('./haiku');
var tagger = require('./tagger');

var hmac = crypto.createHmac('sha256', 'asdasd');

function genId() {
	var currDate = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	hmac.update(currDate + random);
	return hmac.digest('hex');
}

function genPath(fileName) {
	fs.ensureDirSync(__dirname + '/public/img/static');
	return path.resolve(__dirname + '/public/img/static/'+fileName);
}


module.exports = function(io) {

	
	io.on('connection', function(socket) {
		socket.emit('testConnect', {
			message: 'hello'
		});
		

		socket.on('imageUpload', function(data) {

			// TODO check image size

			// check image type
			var typeSection = data.imageData.substring(0, 30);
			var re = /^data:image\/((png)|(jpeg)|(gif));base64,/;
			if(!typeSection.match(re)) {
				// bad file
				console.log('Bad', typeSection);
				return;
			}

			var ext = '.' + typeSection.substring(11, typeSection.indexOf(';'));

			var buffer = new Buffer(data.imageData.replace(re, ''), 'base64');
			console.log('uploading...');

			// TODO grab extention from buffer
			var fileName = genId() + ext;
			var imgPath = genPath(fileName);
			// console.log(imgPath);

			// run through clarifai
			var testURL = 'http://5bbe1c9c.ngrok.io/img/static/'+fileName;
			

			fs.writeFile(imgPath, buffer, function(err) {
				if(err) {
					console.log(err);
					return;
				}

				// image has been saved to server

				socket.emit('imageSaved', {
					url: '/img/static/' + fileName
				});

				// make haiku
				tagger(testURL, fileName)
				.then(function(terms) {
					console.log('jared');
					socket.emit('haiku', {
						message: haiku(terms)
					});
	
				}, function(err) {
					console.log(err);
				})
				.fail(function(err){
					console.log(err);
				});

				
				console.log('upload complete', fileName);
			});


		});
	});	
};