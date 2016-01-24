var terms = 
[
	{
		term: "ocean",
		syll: 2
	},
	{
		term: "bernie",
		syll: 2
	},
	{
		term: "Shibes4life",
		syll: 3
	},
	{
		term: "tree",
		syll: 1
	}
];

var syllables = 
{
	1:['wow', 'much', 'so', 'no', 'such'],
 	2:['many', 'being', 'beauti', 'indee', 'pracious', 'very'], 
 	3:['engeneer', 'michgan', 'computir', 'ohagan', 'chinchilla']
 }


function makeHaiku(terms){

	var haiku = [];

	for(var i = 0; i < 4; i++)
	{
		
		var nums;
		
		if(i == 1)
		{ //7 syll line
			nums = getSequence(7, terms[i].syll, terms[i + 1].syll);
			i++;
		}
		
		else
		{
			nums = getSequence(5, terms[i].syll);
		}


		var used1 = false;
		var used2 = false;
		var currentLine = "";
		var sum = SumOf(nums);

		for(var j = 0; j < nums.length; j++)
		{
			
			if(sum == 7)
			{
				if(nums[j] == terms[i].syll && !used1){
					currentLine += terms[i].term + " ";
					used1 = true;
					// insert i syll
					// set used1 to true
				}

				else if(nums[j] == terms[i + 1].syll && !used2)
				{
					currentLine += terms[i + 1].term + " ";
					used2 = true;
					// insert i + 1 syll
					// set used2 to true
				}
				
				else
				{
					var randomWord = getRandom(syllables[nums[j]]);
					currentLine += randomWord + " ";
				}

				// console.log(currentLine + '/n');
				// check both syllables
				// have two flags
			} 

			else 
			{
				
				if(nums[j] == terms[i].syll && !used1)
				{
					currentLine += terms[i].term + " ";
					used1 = true;

					
				}
				
				else
				{
					var randomWord = getRandom(syllables[nums[j]]);
					currentLine += randomWord + " ";
				}

				 
				 // console.log(currentLine + '\n');

				// check first syllable
				// have one flag
			}

		} 
		haiku.push(currentLine);
		
	}
	console.log(haiku);
}


function getSequence(max, syll, syll2)
{
	
	var sequence;
	
	do
	{
		var sum = 0;
		sequence = [];
		
		while(sum < max)
		{
			var rand = Math.floor((Math.random() * 3) + 1);
			sum = SumOf(sequence);
			var potentialNew = sum + rand;
			if(potentialNew <= max)
				sequence.push(rand);
			sum = SumOf(sequence);
		}

		var test1 = (sequence.indexOf(syll) >= 0);
		var test2 = true;

		if(max == 7)
			test2 = (sequence.indexOf(syll2) >= 0);

		var overallTest = test1 && test2;

	}while(!overallTest);


	return sequence;
}

function SumOf(arr)
{
	var sum = 0;

	for(var i = 0; i < arr.length; i++)
	{
    	sum += arr[i]; //don't forget to add the base
	}

	return sum;
}

makeHaiku(terms);


function getRandom(array)
{
	var rand = Math.floor(Math.random()* array.length);
	
	return array[rand];
}










