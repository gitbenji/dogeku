var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var dotenv = require('dotenv');
var glob = require('glob');
var syllable = require('syllable');
var Clarifai = require('./clarifai_node.js');

var io = require('socket.io');
var fs = require('fs-extra');
var crypto = require('crypto');
var path = require('path');

var app = {};
var port = 8000;


dotenv.load();

/**
 * Setup Clarifi
 */
Clarifai.initAPI(process.env.CLIENT_ID, process.env.CLIENT_SECRET);



/**
 * Setup Express
 */
var e = app.e = express();
app.server = app.server = http.createServer(e);
io = io(app.server);


e.use(express.static(__dirname + '/public'));



/**
 * Routes
 */
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });


app.server.listen(port, function() {
	console.log('Listening on port ' + port + '\n');
});




/**
 * Setup socket.io
 */
var hmac = crypto.createHmac('sha256', 'asdasd');
io.on('connection', function(socket) {
	socket.emit('testConnect', {
		message: 'hello'
	});

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

		fs.writeFile(imgPath, buffer, function(err) {
			if(err) {
				console.log(err);
				return;
			}

			// image has been saved to server

			socket.emit('imageSaved', {
				url: '/img/static/' + fileName
			});
			console.log('upload complete', fileName);
		});
	});


	// socket.on('imageUpload', function (msg) {
	// 	var base64Data = decodeBase64Image(msg.imageData);
	// 	// if directory is not already created, then create it, otherwise overwrite existing image
	// 	fs.exists(__dirname + "/" + msg.imageMetaData, function (exists) {
	// 	    if (!exists) {
	// 	        fs.mkdir(__dirname + "/" + msg.imageMetaData, function (e) {
	// 	            if (!e) {
	// 	                console.log("Created new directory without errors." + client.id);
	// 	            } else {
	// 	                console.log("Exception while creating new directory....");
	// 	                throw e;
	// 	            }
	// 	        });
	// 	    }
	// 	});
	//
	// 	// write/save the image
	// 	// TODO: extract file's extension instead of hard coding it
	// 	fs.writeFile(__dirname + "/" + msg.imageMetaData + "/" + msg.imageMetaData + ".png", base64Data.data, function (err) {
	// 	    if (err) {
	// 	        console.log('ERROR:: ' + err);
	// 	        throw err;
	// 	    }
	// 	});
	// 	// I'm sending image back to client just to see and a way of confirmation. You can send whatever.
	// 	client.emit('user image', msg.imageData);
	// });

	function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
        return response;
    }

});







var tagList = []; // array for final list of all tags to send to SnoopDog
// callback function for clarafai API to handle the errors
function commonResultHandler( err, res ) {
	// console.log('request handler!');
	if(err !== null) {
		console.log(' there was an error!');
		if( typeof err.status_code === "string" && err.status_code === "TIMEOUT") {
			console.log("TAG request timed out");
		}
		else if( typeof err.status_code === "string" && err.status_code === "ALL_ERROR") {
			console.log("TAG request received ALL_ERROR. Contact Clarifai support if it continues.");
		}
		else if( typeof err.status_code === "string" && err.status_code === "TOKEN_FAILURE") {
			console.log("TAG request received TOKEN_FAILURE. Contact Clarifai support if it continues.");
		}
		else if( typeof err.status_code === "string" && err.status_code === "ERROR_THROTTLED") {
			console.log("Clarifai host is throttling this application.");
		}
		else {
			console.log("TAG request encountered an unexpected error: ");
			console.log(err);
		}
	}
	else {
		// console.log('else');
		// if some images were successfully tagged and some encountered errors,
		// the status_code PARTIAL_ERROR is returned. In this case, we inspect the
		// status_code entry in each element of res["results"] to evaluate the individual
		// successes and errors. if res.status_code === "OK" then all images were
		// successfully tagged.


		// This is where it's successful, or partially successful
		if( typeof res.status_code === "string" &&
			( res.status_code === "OK" || res.status_code === "PARTIAL_ERROR" )) {


			var tags = [];

			res.results.forEach(function(result) {
				if(res.results[i].status_code === "OK" ) {

					tags = res.results[i].result.tag.classes;


					var count = 0;

					tags.forEach(function(tag) {
						if (syllable(tag) <= 3) {
							count++;
							tagList.push(tag);
							if(count == 4){
								return false;
							}
						}

					});

				} else {
					console.log(
						'docid=' + res.result.docid,
						'local_id=' + res.result.local_id,
						'status_code=' + res.result.status_code,
						'error = ' + res.result.result.error
					);
				}
			});

		}
	}
	// console.log(tag);
	// console.log(tagList[0]);
	console.log(tagList);
	countSyllables(tagList);
}

function substituteStrings(tags) {

}

// term and syll
function countSyllables(tags) {
	var syllableList = [];
	var syllableCount = 0;
	// var term = new Object();
	var terms = [];
	var i;

	// console.log(terms);
	for (i = 0; i < tags.length; i++) {
		// console.log(terms[i]);
		// console.log(syllable(terms[i]));
		syllableCount = syllable(tags[i]);
		// console.log(syllableCount);
		// console.log('foo');
		syllableList.push(syllableCount);
	}
	console.log(syllableList);

	for (i = 0; i < tags.list; i++){
		terms[i] = new Term(tags[i], syllableList[i]);
	}
	// makeHaiku(terms, syllableList);
}

//function Term()

// run through directory of files and pass them into clarafai to get tagged
// which then gets saved in mongodb
function runThroughFiles(dir){
	glob(dir + "/*.jpeg", function (err, files) {
	  // files is an array of filenames.
	  // If the `nonull` option is set, and nothing
	  // was found, then files is ["**/*.js"]
	  // er is an error object or null.

	  if(err)
	  	console.log('-- ERROR GETTING FILES WITH GLOB --');

	  // console.log(files);

	  // loop through filenames
	  for(var i = 0; i < files.length; i++){
	  	var filepath = files[i];
	  	var index = filepath.lastIndexOf('/');
	  	var ourId = filepath.substring(index + 1);
	  	// console.log(ourId);
		var testURL = 'http://5bbe1c9c.ngrok.io' + '/' + 'public/2Btagged/'+ ourId;

		console.log(testURL);

		// make call to clarafai to get the tags for that certain video
		Clarifai.tagURL(testURL , ourId, commonResultHandler);
	  }
	});
}


// run through files and tag them and then store them
var folderPath = './public/2Btagged';
// console.log(syllable('dog'));
runThroughFiles(folderPath);
