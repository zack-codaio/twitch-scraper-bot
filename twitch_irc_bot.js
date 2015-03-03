#!/usr/bin/env node

/**
 * Created by zackaman on 1/19/15.
 */

//TODO:
// - go to twitch.tv dota2 - DONE
// - get channel name of most popular stream - DONE
// - join channel on IRC - DONE
// - collect data for one hour - DONE
// - all emotes - DONE
// - how many people in a single minute - DONE
// - visualize - partial
// - post to twitter
// - repeat

//requires for scraping
var irc = require('irc');
var util = require('util');
var color = require('ansi-color').set;
var readline = require('readline');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var Browser = require('zombie');
var assert = require('assert');



//var emoteJSON = require('global.json');

var ask = false;
var debug = false;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (ask) {
    askForChannels();
}
else if (debug == true) {
    var channels = new Array();
    channels.push("#sololineabuse");
    setTimeout(function () {
        joinChannels(channels);
    }, 1000);
}
else if (debug == false) {

//goal: scrape the name of the first channel playing Dota2
    var domain = 'http://www.twitch.tv/';
    var twitch_html;

//go to Twitch/dota2
    Browser.localhost(domain, 3000);

//load page (load dynamic content using Zombie)
    var browser = Browser.create();
    //browser.visit('/directory/game/Dota%202', function (error) {
        browser.visit('/directory/game/League%20of%20Legends', function (error) {
        assert.ifError(error);

        twitch_html = browser.html();

        //parse html using Cheerio
        $ = cheerio.load(twitch_html);

        //var test = document.getElementsByClassName("info")[1].getElementsByTagName("a")[0].attributes.href
        var scraped_channel = $('.info a').first().attr("href");
        scraped_channel = scraped_channel.substr(1, scraped_channel.length);
        scraped_channel = scraped_channel.substr(0, scraped_channel.indexOf('/'));
        console.log("Most popular channel for Dota2 is currently:");
        console.log(scraped_channel);
        scraped_channel = "#" + scraped_channel;
        var channels = new Array();
        channels.push(scraped_channel);
        setTimeout(function () {
            joinChannels(channels, numViewers);
        }, 1000);

        //get number of viewers:
        var numViewers = $('.info').first().contents().filter(function(){
            return this.nodeType == 3;
        })[1];
        console.log("Number of Viewers:");
        console.log(numViewers.data);
        numViewers = numViewers.data;
    });
}


//from https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
function countOcurrences(str, value) {
    if (typeof(str) != 'undefined') {
        var regExp = new RegExp(value, "g");
        return str.match(regExp) ? str.match(regExp).length : 0;
    }
}

function askForChannels() {
    var join_channels;
    rl.question("What channels do you want to join? (no hashtags, space delimited, lowercase)", function (answer) {
        // TODO: Log the answer in a database
        console.log("Joining:", answer);
        join_channels = answer;
        rl.close();
        var res = answer.split(" ");
        for (var i = 0; i < res.length; i++) {
            res[i] = '#' + res[i];
        }
        if (res.length == 0) {
            console.log('no channels added')
        }
        else {

            setTimeout(function () {
                joinChannels(res);
            }, 3000);
        }
    });
}

function joinChannels(res, numViewers) {
    var c = new irc.Client(
        //'irc.dollyfish.net.nz',
        'irc.twitch.tv',
        'IACD',
        {
            userName: 'IACD',
            port: 6667,
            password: oauth,
            channels: res
            //debug: true
        }
    );

    c.addListener('error', function (message) {
        console.log(color('error: ', 'red'), message)
    });

    var repl = require('repl').start('> ');
    repl.context.repl = repl;
    repl.context.util = util;
    repl.context.irc = irc;
    repl.context.c = c;

    repl.inputStream.addListener('close', function () {
        console.log("\nClosing session");
        c.disconnect('Closing session');
    });


    //call another function
    //pass channel, channel name
    parse_twitch_stream(c, res[0], numViewers);

}

//for a single channel, parse messages
//per hour:
//stream name
//timestamp
//initial number of users
//data by minute
// - emote
// - # of uses
// - # of users who used that emote

//each minute
//emotes used
// - # of uses
// - list of who used that emote
function parse_twitch_stream(c, channel_name, numViewers) {

    var minute = 0;
    var past_minuteJSON;
    minute_parser();
    var hourJSON = init_hourJSON(channel_name, numViewers);
    var emoteKeys;


    //for 60 times
    //return minuteJSON after a minute, then call minute_parser() again

    function minute_parser() {
        //each minute
        //emotes used
        // - # of uses
        // - list of who used that emote

        //intialize data structure
        var minuteJSON = require('./global.json');
        delete minuteJSON.meta;
        delete minuteJSON.template;
        //console.log(util.inspect(minuteJSON.emotes, {depth:null}))
        emoteKeys = Object.keys(minuteJSON.emotes);

        //initialize userSet property as an Object to imitate a set
        for (var i = 0; i < emoteKeys.length; i++) {
            minuteJSON.emotes[emoteKeys[i]].userSet = {};
            minuteJSON.emotes[emoteKeys[i]].ocurrences = 0;
        }
        //console.log(util.inspect(emoteKeys, {depth:null}))

        if(minute == 0) {
            c.addListener('raw', function (message) {
                //console.log(util.inspect(message, {depth: null}));
                //console.log(message.args[1]);

                var userName = message.nick;

                //search for emotes
                for (var i = 0; i < emoteKeys.length; i++) {
                    //console.log(emoteKeys[i]);

                    var ocurrences = countOcurrences(message.args[1], emoteKeys[i]);
                    if (ocurrences > 0) {
                        //console.log(emoteKeys[i] + " : " + ocurrences);
                        //check to see if userName already present
                        //if not, add to list
                        if (!(userName in minuteJSON.emotes[emoteKeys[i]].userSet)) {
                            minuteJSON.emotes[emoteKeys[i]].userSet[userName] = true;
                            //console.log("added "+userName+" for "+emoteKeys[i]);
                        }

                        //add ocurrences to json
                        minuteJSON.emotes[emoteKeys[i]].ocurrences += ocurrences;

                    }
                }
            });
        }

        //return minuteJSON after 1 minute
        setTimeout(function(){
            minuteJSON;
            minute++;
            console.log(util.inspect(minuteJSON, {depth: null}));
            parse_minute_into_hour(minuteJSON);
            //return true;
        }, 60000);
    }

    function init_hourJSON(streamName, numViewers){
        var hourJSON = new Object();

        hourJSON.streamName = streamName;
        hourJSON.timestamp = Date.now();
        hourJSON.numViewers = numViewers;
        hourJSON.minutes = {};

        return hourJSON;
    }

    function parse_minute_into_hour(minuteJSON){
        //clone minuteJSON
        var minuteCLONE = JSON.parse(JSON.stringify(minuteJSON));

        console.log("parse_minute_into_hour()");
        //var minuteInHour = {};
        //var highestEmoticon = "Kappa";
        //var highestQuantity = 0;
        //var numUsers = 0;

        //iterate through emoticons
        //find which emoticon has the highest quantity in the minute

        //console.log("MINUTEJSON: ");
        //console.log(util.inspect(minuteJSON, {depth:null}));
        //console.log("for loop has "+minuteJSON.emotes.length+ " emotes to check");

        //for(var i = 0; i < emoteKeys.length; i++){
            //if(minuteJSON.emotes[emoteKeys[i]].ocurrences > highestQuantity){
            //    highestQuantity = minuteJSON.emotes[emoteKeys[i]].ocurrences;
            //    highestEmoticon = emoteKeys[i];
            //    numUsers = Object.keys(minuteJSON.emotes[emoteKeys[i]].userSet).length;
            //}
        //}
        //console.log("reached end of for loop");


        for(var i = 0; i < emoteKeys.length; i++){
            if(minuteCLONE.emotes[emoteKeys[i]].ocurrences == 0){
                delete minuteCLONE.emotes[emoteKeys[i]];
            }
            else{
                delete minuteCLONE.emotes[emoteKeys[i]].description;
                delete minuteCLONE.emotes[emoteKeys[i]].image_id;
            }
        }

        //tweet?


        //add to minuteInHour:
        // - emoticon name
        // - # of uses
        // - # of users

        //minuteInHour.emoteName = highestEmoticon;
        //minuteInHour.ocurrences = highestQuantity;
        //minuteInHour.numUsers = numUsers;

        //add to hourJSON
        console.log("set minute in hourJSON");
        //hourJSON.minutes[minute] = minuteInHour;
        hourJSON.minutes[minute] = minuteCLONE;
        console.log("log hourJSON");
        console.log(util.inspect(hourJSON, {depth: null}));
        console.log(minute);

        var filename = "./twitch_logs_by_minute/"+hourJSON.timestamp+"-"+hourJSON.streamName+".json";
        fs.writeFile(filename, JSON.stringify(hourJSON, null, 4, function(err){
            if(err){
                console.log(err);
            }
            else {
                console.log("JSON saved to " + filename);
            }
        }))

        if(minute < 60){
         console.log("starting minute "+minute);
            minute_parser();
        }
        else{
            //pass filename
            //render and tweet
            //close
        }
    }
}