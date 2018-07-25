//Require dependencies
const Twit = require('twit');
const request = require("request");
//local twitter config file or heroku config
let config;
//local cryptopanic api config file or heroku config
let cryptopanicApiKey;

// use this config when deploying to Heroku
const herokuConfig = {
  consumer_key: process.env['consumer_key'],
  consumer_secret: process.env['consumer_secret'],
  access_token: process.env['access_token'],
  access_token_secret: process.env['access_token_secret']
}

// if app is being deployed to heroku, use herokuConfig
// else use local config file
if(process.env.NODE_ENV == 'production'){
  config = herokuConfig;
  cryptopanicApiKey = process.env['apiKey'];
}
else{
  config = require('./config.js');
  cryptopanicApiKey = require("./config2").apiKey;
}




//putting our configuration details in twitter
const Twitter = new Twit(config);

//upon running the bot, tweet the latest top ten crypto prices
tweetLatestPrices();


// // tweet latest crypto news every 29 mins
setInterval(tweetLatestCryptoNews, 1000*60*29);

// // tweet latest prices once an hour
setInterval(tweetLatestPrices, 1000*60*60);

// // retweet the top two most recent crypto tweets every 3.9 hours
setInterval(retweetMostRecentTweets, 1000*60*60*3.9);



//experimenting with the ccxt package
// const ccxt = require ('ccxt');
// console.log (ccxt.exchanges); // print all available exchanges



// function that will tweet the latest news article headline and url
function tweetLatestCryptoNews() {
    
    // send a request to the cryptopanic API 
    request("https://cryptopanic.com/api/posts/?auth_token=" + cryptopanicApiKey + "&public=true", function(err, response, body) {

      // If the request is successful (i.e. if the response status code is 200)
      if (!err && response.statusCode === 200) {

        // Parse the body of the site and recover the data coming back
        // console.log("The data coming back is : " + JSON.parse(body).results);
        
        // parse the results coming back and save them in a variable
        const results = JSON.parse(body).results[1]

        // storing article headline
        let newsHeadline = results.title;

        // storing article url
        let link = results.url;

        // creating a variable to store a coin ticker
        let ticker;

        // if the article has a coin ticker then store it
        if (results.currencies) {
          ticker = results.currencies[0].code;
        }

        console.log("headline : ", newsHeadline);


        // if a ticker exists, post a tweet with the ticker, if not then just post a tweet with the headline and url
        if (ticker) {
          // send a post request to twitter with the status being the news headline
          Twitter.post('statuses/update', { status: newsHeadline + " " + link + " " +  "$" + ticker + " #cryptonews" +  " #crypto"}, function(err, data, response) {

            // if there is an error, log the error
            if(err){
              console.log(err);
            }
            // if there is no error, log the data coming back
            else {
              console.log(data.text);
              console.log("------ YES ticker");
            }

          });
        }
        else {
          // send a post request to twitter with the status being the news headline
          Twitter.post('statuses/update', { status: newsHeadline + " " + link + " #cryptonews" +  " #crypto"}, function(err, data, response) {

            // if there is an error, log the error
            if(err){
              console.log(err);
            }
            // if there is no error, log the data coming back
            else {
              console.log(data.text);
              console.log("------ NO ticker");
            }

          });
        }

      }
    });
}


// function that will tweet the latest top 10 crypto prices
function tweetLatestPrices() {
  // send a request to the coinmarketcap API for the top 10 coins
  request("https://api.coinmarketcap.com/v2/ticker/?limit=10", function(err, response, body) {
    // If the request is successful (i.e. if the response status code is 200)
    if (!err && response.statusCode === 200) {

      let topTenCoins = [];
      let orderedArr = [1,2,3,4,5,6,7,8,9,10]
 
      // parse the results coming back and save them in a variable called data
      const data = JSON.parse(body).data
      // console.log(data);

      for (let property in data) {
        let rank = data[property].rank;
        let symbol = data[property].symbol;
        let price = data[property].quotes.USD.price;
        topTenCoins.push({
          "rank": rank,
          "symbol": symbol,
          "price": price
        });
      }


      let orderedTopTenCoins = [];
      for (let i = 0; i < orderedArr.length; i++) {
        // console.log("first index ", orderedArr[i]);
        for (let k = 0; k < topTenCoins.length; k++) {
          // console.log(ranks[k].rank);
          if (orderedArr[i] == topTenCoins[k].rank) {
            // console.log(ranks[k].rank);
            orderedTopTenCoins.push(topTenCoins[k]);
          }
        }
      }
      // console.log("New ordered" , orderedTopTenCoins);
      
      // create a variable to store the tweet
      let tweet = "LATEST PRICES FOR TOP 10 CRYPTOCURRENCIES (USD): \n";
      

      // iterate through the data object that hold the top 10 cryptocurrencies
      for (let i = 0; i < orderedTopTenCoins.length; i++) {
        // console.log(orderedTopTenCoins[i].rank, orderedTopTenCoins[i].symbol, orderedTopTenCoins[i].price)
        tweet = tweet + orderedTopTenCoins[i].rank + ".) $" + orderedTopTenCoins[i].symbol + " = $" + orderedTopTenCoins[i].price + "\n" ;
      }

      console.log(tweet);

      //   // send a post request to twitter with the status being the news headline
        Twitter.post('statuses/update', { status: tweet }, function(err, data, response) {

          // if there is an error, log the error
          if(err){
            console.log(err);
          }
          // if there is no error, log the data coming back
          else {
            console.log(data.text);
            console.log("------ PRICES HAVE BEEN TWEETED");
          }

        });

    }


  });
}



// function that will find the 2 most popular tweets on crypto and retweet them
function retweetMostRecentTweets() {
  // q is the required parameter which is used to store search query. It will search for tweets containing #crypto. Where count is the number of tweets, result_type:’recent’ will return the most recent results and lang:’en’ returns English results.
  // this will be passed in the get request to Twitter
  let params = {
    q: '#crypto',
    count: 2,
    result_type: 'recent',
    lang: 'en'
  }

  // attach the search parameters into the get request to find tweets
  // make a get request to search/tweets and pass in search 
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
            console.log(err.message);
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
  });
}

