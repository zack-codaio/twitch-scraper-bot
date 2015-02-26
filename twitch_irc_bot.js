#!/usr/bin/env node

/**
 * Created by zackaman on 1/19/15.
 */

//TODO:
    // - go to twitch.tv dota2 - DONE
    // - get channel name of most popular stream - DONE
    // - join channel on IRC - DONE
    // - collect data for one hour - partial
        // - all emotes
        // - how many people in a single minute
    // - visualize
    // - post to twitter
    // - repeat

var irc = require('irc');
var util = require('util');
var color = require('ansi-color').set;
var readline = require('readline');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var Browser = require('zombie');
var assert = require('assert');


var ask = false;
var debug = false;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if(ask){
    askForChannels();
}
else if(debug == true){
    var channels = new Array();
    channels.push("#sololineabuse");
    setTimeout(function(){
        joinChannels(channels);
    }, 1000);
}
else if (debug == false){

//goal: scrape the name of the first channel playing Dota2
    var domain = 'http://www.twitch.tv/';
    var twitch_html;

//go to Twitch/dota2
    Browser.localhost(domain, 3000);

//load page (load dynamic content using Zombie)
    var browser = Browser.create();
    browser.visit('/directory/game/Dota%202', function (error) {
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
        setTimeout(function(){
            joinChannels(channels);
        }, 1000);
    });
}





//from https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
function countOcurrences(str, value) {
    var regExp = new RegExp(value, "g");
    return str.match(regExp) ? str.match(regExp).length : 0;
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

function joinChannels(res){
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

    //for each channel
    //for Kappa per minute
    //start an interval timer for 1 minute
    //initialize emotes to 0;
    console.log(util.inspect(res, {depth: null}));
    var emotes = new Object();
    for (var i = 0; i < res.length; i++) {
        emotes[res[i]] = new Object();
        emotes[res[i]].channel = res[i];
        emotes[res[i]].timestamp = '';
        emotes[res[i]].Kappa = 0;
        emotes[res[i]].EleGiggle = 0;
        emotes[res[i]].Kreygasm = 0;
        emotes[res[i]].fourhead = 0;
        emotes[res[i]].FrankerZ = 0;
    }
    count = 0;
    setInterval(function () {
        count++;
        console.log(count);
        if (count == 60) {
            //at the end of the minute
            //for each channel
            //console.log(util.inspect(emotes, {depth: null}));
            var keys = Object.keys(emotes);
            var keylength = keys.length;
            console.log("keylength = "+keylength);
            for (var i = 0; i < keylength; i++) {
                //timestamp
                emotes[res[i]].timestamp = Date.now();

                //save data to log
                var output = JSON.stringify(emotes[res[i]], null, 4);
                console.log(output);
                var filename = keys[i].substring(1, keys[i].length) + ".txt";
                fs.appendFile('./twitch_logs/'+filename, output+"\n\n", function(err){
                    if(err){
                        console.log('error writing to '+filename);
                    }
                });


                //console.log(util.inspect(emotes, {depth: null}));

                //output to KPM to twitch
                console.log("KPM = " + emotes[res[i]].Kappa);
                c.say(keys[i], "Kappa per minute = "+emotes[res[i]].Kappa);
                //peak Kappa for hour, day, week month, year


                //reset state
                emotes[res[i]].Kappa = 0;
                emotes[res[i]].EleGiggle = 0;
                emotes[res[i]].Kreygasm = 0;
                emotes[res[i]].fourhead = 0;
                emotes[res[i]].FrankerZ = 0;

            }
            count = 0;
        }
    }, 1000);

//c.addListener('raw', function(message) { console.log('raw: ', message) });
    c.addListener('raw', function (message) {
        console.log(message.args[0] + ": " + message.args[1]);

        //increment kappa by 1 in the message listener
        if (typeof(message.args[1]) != "undefined") {
            var matchesKappa = countOcurrences(message.args[1], 'Kappa');
            //console.log(util.inspect(matches, {showHidden: false, depth: null}));
            if (matchesKappa > 0) {
                console.log('found ' + matchesKappa + ' Kappas');
                emotes[message.args[0]].Kappa += matchesKappa;
            }

            var matchesEleGiggle = countOcurrences(message.args[1], 'EleGiggle');
            //console.log(util.inspect(matches, {showHidden: false, depth: null}));
            if (matchesEleGiggle > 0) {
                console.log('found ' + matchesEleGiggle + ' EleGiggles');
                emotes[message.args[0]].EleGiggle += matchesEleGiggle;
            }

            var matches4Head = countOcurrences(message.args[1], '4Head');
            //console.log(util.inspect(matches, {showHidden: false, depth: null}));
            if (matches4Head > 0) {
                console.log('found ' + matches4Head + ' 4Heads');
                emotes[message.args[0]].fourhead += matches4Head;
            }

            var matchesKreygasm = countOcurrences(message.args[1], 'Kreygasm');
            //console.log(util.inspect(matches, {showHidden: false, depth: null}));
            if (matchesKreygasm > 0) {
                console.log('found ' + matchesKreygasm + ' Kreygasm');
                emotes[message.args[0]].Kreygasm += matchesKreygasm;
            }

            var matchesFrankerZ = countOcurrences(message.args[1], 'FrankerZ');
            //console.log(util.inspect(matches, {showHidden: false, depth: null}));
            if (matchesFrankerZ > 0) {
                console.log('found ' + matchesFrankerZ + ' FrankerZ');
                emotes[message.args[0]].FrankerZ += matchesFrankerZ;
            }
        }


    });
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
}




