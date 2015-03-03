/**
 * Created by zackaman on 3/2/15.
 */


var util = require('util');
var fs = require('fs');

var Canvas = require('canvas');
var Image = Canvas.Image;

var imageWidth = 520;
var imageHeight = 337;
var sidePadding = 15;
var baselineY = 310;
var topSpace = 20;
var legendWidth = 80;
var drawableWidth = imageWidth - 2 * sidePadding - legendWidth;

var Twit = require('twit');
//var twitCreds = require('botConfig.js');
var T = new Twit(twit_credentials);
var emoji = require('node-emoji');

//draw_and_tweet_minute('./twitch_logs_by_minute/1425342663827-#tsm_theoddone.json', 60);

function draw_and_tweet_minute(filename, minute) {
    var emotes = require(filename);
    emotes = emotes.minutes[minute].emotes;
    //console.log(util.inspect(emotes));

    var emoteArray = [];

    //count number of emotes
    var totalEmotes = 0;
    var emoteKeys = Object.keys(emotes);
    for (var i = 0; i < emoteKeys.length; i++) {
        //totalEmotes += emotes[emoteKeys[i]].ocurrences;
        for (var j = 0; j < emotes[emoteKeys[i]].ocurrences; j++) {
            emoteArray.push(emoteKeys[i]);
        }
    }
    imageHeight = 40 * Math.ceil(emoteArray.length / 17) + 10;
    if (emoteArray.length < 17) {
        imageWidth = 40 * emoteArray.length;
    }
    //imageHeight = 500;
    console.log(emoteArray);

    translate_to_emoji(emoteArray);


    var canvas = new Canvas(imageWidth, imageHeight);
    ctx = canvas.getContext('2d');


    //draw white background
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, imageWidth, imageHeight);

    var curX = 5;
    var curY = 5;

    //draw emotes in order

    //draw_emotes(0);
    function draw_emotes(a) {
        console.log(a);
        console.log(emoteArray.length);
        if (a == emoteArray.length) {
            save_img();
        }
        else {


            var iconFile = './resources/icons/' + emoteArray[a] + '.png';

            fs.readFile(iconFile, function (err, data) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                var img = new Canvas.Image;
                img.src = data;

                console.log(iconFile);
                console.log("x: " + curX + " y: " + curY);
                console.log("width: " + img.width + " height: " + img.height);

                ctx.drawImage(img, curX, curY, img.width, img.height);
                curX += img.width + 5;
                if (curX >= 500) {
                    curX = 5;
                    curY += 40;
                }

                draw_emotes(a + 1);
            });
        }

    }

    function save_img() {
        //save png
        var filename = "./tweetable_images" + '/test.png';
        var out = fs.createWriteStream(filename)
            , stream = canvas.pngStream();

        stream.on('data', function (chunk) {
            out.write(chunk);
        });

        stream.on('end', function () {
            console.log('saved png');
            //console.log(emoteSet['Kappa'].color);
            //tweet_img(filename);
        });
    }




    //var twitter_update_with_media = require('twitter_update_with_media');
    //
    //var tuwm = new twitter_update_with_media(twit_credentials);



    function tweet_img(filename) {


        //tuwm.post('This is a test', filename, function(err, response) {
        //    if (err) {
        //        console.log(err);
        //    }
        //    console.log(response);
        //});


        console.log(filename);
        //
        // post a tweet with media
        //
        //var b64content = fs.readFile(filename, {encoding: 'base64'}, function (err, data) {
        //    console.log(data);
        //    // first we must post the media to Twitter
        //    T.post('media/upload', {media: b64content}, function (err, data, response) {
        //        console.log(util.inspect(response, {depth:null}));
        //
        //        // now we can reference the media and post a tweet (media will attach to the tweet)
        //        var mediaIdStr = data.media_id_string;
        //        var params = {status: 'loving life #nofilter', media_ids: [mediaIdStr]}
        //
        //        T.post('statuses/update', params, function (err, data, response) {
        //            console.log(data)
        //        })
        //    });
        //
        //    console.log(data);
        //})

        //
        //  tweet 'hello world!'
        //
        T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
            console.log(data)
        })
    }


    function handleError(err) {
        console.error('response status:', err.statusCode);
        console.error('data:', err.data);
    }

}

function translate_to_emoji(emoteArray){
    console.log("translating");
    console.log(emoteArray);

    var emojiString = "";
    var length = 0;

    for(var i= 0 ; i < emoteArray.length; i++){
        if(length < 70){
            switch(emoteArray[i]){
                case "Kappa":
                    emojiString+= emoji.get(":japanese_goblin:");
                    break;
                case "Keepo":
                    emojiString+=emoji.get(":japanese_ogre:");
                    break;
                case "PogChamp":
                    emojiString+=emoji.get(":scream:");
                    break;
                case "BibleThump":
                    emojiString+=emoji.get(":cold_sweat:");
                    break;
                case "BabyRage":
                    emojiString+=emoji.get(":baby:");
                    emojiString+=emoji.get(":rage:");
                    break;
                case "ANELE":
                    emojiString+=emoji.get(":man_with_turban:");
                    break;
                case "PJSalt":
                    emojiString+=emoji.get(":fist:");
                    break;
                case "ResidentSleeper":
                    emojiString+=emoji.get(":sleeping:");
                    break;
                case "SwiftRage":
                    emojiString+=emoji.get(":pouting_cat:");
                    break;
                default:
                    break;
            }


        }
        else{
            break;
        }
    }

    emojiString = emojiString.substr(0, 140);

    console.log(emojiString);

    T.post('statuses/update', { status: emojiString }, function(err, data, response) {
        console.log(emoteArray);
        console.log(emojiString)

    })
}