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


// tweet latest crypto news every 6 mins
setInterval(tweetLatestCryptoNews, 1000*60*6);

// tweet latest prices once an hour
setInterval(tweetLatestPrices, 1000*60*60);

// retweet the top two most recent crypto tweets every 3.9 hours
setInterval(retweetMostRecentTweets, 1000*60*60*3.9);

// tweet global market data and btc data 7.9 hours
setInterval(tweetMarketAndBTCData, 1000*60*60*7.9);



//experimenting with the ccxt package
// const ccxt = require ('ccxt');
// console.log (ccxt.exchanges); // print all available exchanges

// function that will format a string number to add commas -- ex. 8346 becomes 8,346
const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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
        price = numberWithCommas(price);
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

// function that will tweet Bitcoin's and the marketcap's data
function tweetMarketAndBTCData() {
  // send a request to the coinmarketcap API for the top 10 coins
  request("https://api.coinmarketcap.com/v2/ticker/1/", function(err, response, body) {
    let BTCpercent_change_1h;
    let BTCpercent_change_24h;
    let BTCpercent_change_7d;

    // If the request is successful (i.e. if the response status code is 200)
    if (!err && response.statusCode === 200) {
 
      // parse the results coming back and save them in a variable called data
      const data = JSON.parse(body).data

      let BTCprice = data.quotes.USD.price;
      BTCprice = numberWithCommas(BTCprice);
      let BTCvolume24hrs = data.quotes.USD.volume_24h;
      BTCvolume24hrs = numberWithCommas(BTCvolume24hrs);
      let BTCmarketcap = data.quotes.USD.market_cap;
      BTCmarketcap = numberWithCommas(BTCmarketcap);
      BTCpercent_change_1h = String(data.quotes.USD.percent_change_1h);
      BTCpercent_change_24h = String(data.quotes.USD.percent_change_24h);
      BTCpercent_change_7d = String(data.quotes.USD.percent_change_7d);


      // If the change is not negative, add a + sign in front of the price change
      if (BTCpercent_change_1h[0] !== "-") {
        BTCpercent_change_1h = "+" + BTCpercent_change_1h;
      }

      if (BTCpercent_change_24h[0] !== "-") {
        BTCpercent_change_24h = "+" + BTCpercent_change_24h;
      }

      if (BTCpercent_change_7d[0] !== "-") {
        BTCpercent_change_7d = "+" + BTCpercent_change_7d;
      }


      request("https://api.coinmarketcap.com/v2/global/", function(err, response, body) {
        let total_market_cap;
        if (!err && response.statusCode === 200) {
          const data = JSON.parse(body).data

          let BTC_marketcap_percentage = data.bitcoin_percentage_of_market_cap;
          total_market_cap = data.quotes.USD.total_market_cap;
          total_market_cap = numberWithCommas(total_market_cap);
          total_market_cap = total_market_cap.split(",");

          if (total_market_cap.length == 5) {
            total_market_cap = total_market_cap[0] + " Trillion";

          } else if (total_market_cap.length == 4) {
            total_market_cap = total_market_cap[0] + " Billion";

          } else if (total_market_cap.length == 3) {
            total_market_cap = total_market_cap[0] + " Million";
          }


          let total_volume_24h = data.quotes.USD.total_volume_24h;
          total_volume_24h = numberWithCommas(total_volume_24h);
          // console.log(total_volume_24h);

          let tweet = "GLOBAL MARKET DATA (USD):\n" +
            "Market Cap: $" + total_market_cap + "\n" +
            "24Hr Volume: $" + total_volume_24h + "\n" +
            "BTC Dominance: " + BTC_marketcap_percentage +  "%\n" +
            "\n" + 
            "BTC DATA (USD):\n" +
            "Price: $" + BTCprice + "\n" +
            "Market Cap: $" + BTCmarketcap + "\n" +
            "24Hr Volume: $" + BTCvolume24hrs + "\n" +
            "Percent Change 1Hr: " + BTCpercent_change_1h + "%\n" +
            "Percent Change 24Hr: " + BTCpercent_change_24h + "%\n" +
            "Percent Change 7d: " + BTCpercent_change_7d + "%"
          ;

          console.log(tweet);

          // send a post request to twitter with the status being the news headline
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
      })

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

