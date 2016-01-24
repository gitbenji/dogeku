// grabs tag from image

var Clarifai = require('./clarifai_node.js');

var syllable = require('syllable');
var assert = require('assert');
var Q = require('q');

module.exports = function(imgUrl, fileName) {
	var dfd = Q.defer();

	// scan image
	runClarifai(imgUrl, fileName)
	.then(function(tags) {
		console.log(tags);
		// get good tags
		tags = max34(tags);
		console.log(tags);
		// db matches
		substituteStrings(tags)
		.then(function(replacers) {

			tags = subSub(replacers, tags);

			dfd.resolve(getTerms(tags));

		}, function(err) {
			dfd.reject(err);
		});
	}, function(err) {
		dfd.reject(err);
	});

	return dfd.promise;
}

function runClarifai(imgUrl, fileName) {
	var dfd = Q.defer();

	Clarifai.tagURL(imgUrl, fileName, function(err, res) {
		// console.log('request handler!');
		if(err) {
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

			dfd.reject(err);
			return;
		} 
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
				if(result.status_code === "OK" ) {

					tags.concat(result.result.tag.classes);						

				} else {
					console.log(
						'docid=' + res.result.docid,
						'local_id=' + res.result.local_id,
						'status_code=' + res.result.status_code,
						'error = ' + res.result.result.error
					);
				}
			});

			dfd.resolve(tags);
		}	
	});

	return dfd.promise;
} 

function max34(tags) {
	var tagList = [];

	tags.every(function(tag) {
		if (syllable(tag) <= 3 && tag !== 'no person') {
			tagList.push(tag);
			console.log('foo');
			if(tagList.length === 4) {
				console.log(tagList);
				return false;
			}
			return true;
		}
		return true;
	});

	return tagList;
}


//grab array of objects from replace.js ---> replacers[]
//use replacers[0].toReplace for function
function substituteStrings(tags) {
	var dfd = Q.defer();
	

	MongoClient.connect(url, function(err, db) {
		console.log('connected');
		if(err) {
			dfd.reject(err);
			return;
		}

		var replacers = [];
		var cursor = db.collection('replacers').find();

		cursor.each(function(err, doc) {
			if(err) {
				dfd.reject(err);
				return false;
			}
			if(doc) {
			 	replacers.push(doc);
			} else {
				dfd.resolve(replacers);
			}
		});

	});

	return dfd.promise;
}

function subSub(replacers, tags) {
	var replacedTags = [];
	var count = 0;


	tags.forEach(function(tag) {
		// should only run 4 times

		for (var j = 0; j < replacers.length; j++) {
			// run through all replacement options

			// check sameness
			if (tag.includes(replacers[j].toReplace)) {	

				var newstr = tag.replace(replacers[j].regExp, replacers[j].replaceWith);
				replacedTags.push(newstr);
				return false;
			}
			
			count++;
			if (count == replacers.length){
				count = 0;
				replacedTags.push(tag);
			}
		
		}
	});

	return replacedTags;	
}


// term and syll
function getTerms(tags) {
	var syllableList = [];
	var terms = [];

	tags.forEach(function(tag) {
		syllableList.push(syllable(tag));
	});

	tags.forEach(function(tag, i) {
		terms.push({
			term: tag,
			syll: syllableList[i]
		})
	});

	console.log(terms);
	return terms;

}



