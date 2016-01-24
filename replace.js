var prompt = require('prompt');
var mongoose = require('mongoose');

var url = 'mongodb://localhost:27017/dogeku';

mongoose.connect(url);
var Schema = mongoose.Schema;
var replaceSchema = new Schema ({
	toReplace: String,
	replaceWith: String,
	regExp: Object
});

var Replacer = mongoose.model('Replacer', replaceSchema);

var replacers = [];
prompt.get(['toReplace', 'replaceWith'], function(err, result) {
	//prompt user for two separate inputs
	//one: toReplace
	//two: replaceWith
	console.log(result.toReplace);
	console.log(result.replaceWith);
	var replacer = new Replacer({
		toReplace: result.toReplace, 
		replaceWith: result.replaceWith,
		regExp: new RegExp(result.toReplace, 'i', 'g')
	});
	replacer.save(function(err, replacer) {
		if (err) return console.error(err);
	})

});