//Require dependencies
var Twit = require('twit');
var config = require('./config.js');
console.log(config);

//putting our configuration details in twitter
var Twitter = new Twit(config);
console.log(Twitter);
console.log('-----------');


// Creating retweet bot, that will find the latest crypto news. We will take params object that will take properties initialize by us.
// In the above code, q is the required parameter which is used to store search query. It will search for tweets containing #crypto. Where count is the number of tweets, result_type:’recent’ will return the most recent results and lang:’en’ returns English results.
var params = {
q: '#crypto',
count: 10,
result_type: 'recent',
lang: 'en'
}

// attach the search parameters into the get request to find tweets
// we make a get request to search/tweets and pass in our search .
Twitter.get('search/tweets', params, function(err, data, response) {
  // If there is no error, proceed
  if(!err){
    // Loop through the returned tweets
	//our request will return an array of multiple tweets via the data.statuses object.
    for(let i = 0; i < data.statuses.length; i++){
      // Get the tweet Id from the returned data
      let id = { id: data.statuses[i].id_str }
      // send a post request to retweet a status with a certain ID
      Twitter.post('statuses/retweet/:id', id, function(err, response){
        // If the retweeting fails, log the error message
        if(err){
          console.log(err[0].message);
        }
        // If the retweeting is successful, log the ID of the tweet
        else{
          let username = response.user.screen_name;
          let tweetId = response.id_str;
          console.log(`${username} retweeted tweet with ID ${tweetId}`)
        }
      });
    }
  } else {
    console.log(err);
  }
})