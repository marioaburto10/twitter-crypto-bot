//Require dependencies
var Twit = require('twit');
var config = require('./config.js'); 
var request = require("request");

//putting our configuration details in twitter
var Twitter = new Twit(config);

// q is the required parameter which is used to store search query. It will search for tweets containing #crypto. Where count is the number of tweets, result_type:’recent’ will return the most recent results and lang:’en’ returns English results.
var params = {
q: '#crypto',
count: 10,
result_type: 'recent',
lang: 'en'
}


// run a request to the cryptopanic API 
request("https://cryptopanic.com/api/posts/?auth_token=b3452c8af088c05e6ca151617bac9b9146c004b8&public=true", function(error, response, body) {

  // If the request is successful (i.e. if the response status code is 200)
  if (!error && response.statusCode === 200) {

    // Parse the body of the site and recover the data coming back
    // console.log("The data coming back is : " + JSON.parse(body).results);
    
    // save the headline
    var newsHeadline = JSON.parse(body).results[1].title;

    // send a post request to twitter with the status being the news headline
    Twitter.post('statuses/update', { status: newsHeadline }, function(err, data, response) {

      // if there is an error, log the error
      if(err){
        console.log(err);
      }
      // if there is no error, log the data coming back
      else {
        console.log(data);
      }

    });


  }
});






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