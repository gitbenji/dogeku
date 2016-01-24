var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var port = 8000;
var app = {};
var dotenv = require('dotenv').load();
var glob = require('glob');
var syllable = require('syllable');

// set up clarafai client
var Clarifai = require('./clarifai_node.js');
Clarifai.initAPI(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

var e = app.e = express();
app.server = app.server = http.createServer(e);

e.use('/public', express.static(__dirname + '/public'));
//e.use(express.static(__dirname + '/public'));

e.use(bodyParser.json()); //HELP this doesn't allow post to run
e.use(bodyParser.urlencoded({ extended: true })); //HELP what is extension


var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });


app.server.listen(port, function() {
	console.log('Listening on port ' + port + '\n');
});

e.post('/api/upload', jsonParser, function(req,res) {
	console.log('got it, jonathan');
	console.log(req.body);
});



var tagList = []; // array for final list of all tags to send to SnoopDog
// callback function for clarafai API to handle the errors
function commonResultHandler( err, res ) {
	// console.log('request handler!');
	if( err != null ) {
		console.log(' there was an error!');
		if( typeof err["status_code"] === "string" && err["status_code"] === "TIMEOUT") {
			console.log("TAG request timed out");
		}
		else if( typeof err["status_code"] === "string" && err["status_code"] === "ALL_ERROR") {
			console.log("TAG request received ALL_ERROR. Contact Clarifai support if it continues.");				
		}
		else if( typeof err["status_code"] === "string" && err["status_code"] === "TOKEN_FAILURE") {
			console.log("TAG request received TOKEN_FAILURE. Contact Clarifai support if it continues.");				
		}
		else if( typeof err["status_code"] === "string" && err["status_code"] === "ERROR_THROTTLED") {
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
		// successes and errors. if res["status_code"] === "OK" then all images were 
		// successfully tagged.


		// This is where it's successful, or partially successful
		if( typeof res["status_code"] === "string" && 
			( res["status_code"] === "OK" || res["status_code"] === "PARTIAL_ERROR" )) {

			// console.log('-- RESULTS --');
			// console.log(res.results);
			var tag = [];
			// the request completed successfully
			for(i = 0; i < res.results.length; i++) {
				// console.log('goo');
				if( res["results"][i]["status_code"] === "OK" ) {

					// logs and ish
					// console.log( 'docid: '+res.results[i].docid + '\n' +
					// 	' local_id: '+res.results[i].local_id + '\n' +
					// 	' tags: '+res["results"][i].result["tag"]["classes"] )
					tag = res["results"][i].result["tag"]["classes"]
					// console.log('HERE: ' + tag);

					// testarr = ['tree', 'dog', 'curiosity', 'engineering', 'gold', 'fib'];

					var count = 0;
					for (var i = 0; i < tag.length; i++){
						// console.log(tag[i]);
						if (syllable(tag[i]) > 3){
							continue;
						}
						else{
							count++;
							tagList.push(tag[i]);
							if (count == 4){
								break;
							}
						}

						
						//tagList.push(tag[i]);
					}
					
				}
				else {
					console.log( 'docid='+res.results[i].docid +
						' local_id='+res.results[i].local_id + 
						' status_code='+res.results[i].status_code +
						' error = '+res.results[i]["result"]["error"] )
				}
			}
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
	// console.log(terms);
	for (var i = 0; i < tags.length; i++) {
		// console.log(terms[i]);
		// console.log(syllable(terms[i]));
		syllableCount = syllable(tags[i]);
		// console.log(syllableCount);
		// console.log('foo');
		syllableList.push(syllableCount);
	}
	console.log(syllableList);
	for (var i = 0; i < tags.list; i++){
		terms[i] = new Term(tags[i], syllableList[i]);
	}
	// makeHaiku(terms, syllableList);
}

function Term()

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