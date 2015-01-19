#!/usr/bin/env node

/**
 * Created by zackaman on 1/19/15.
 */

var irc = require('irc');
var util = require('util');
var color = require('ansi-color').set;
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var join_channels;
rl.question("What channels do you want to join? (no hashtags, space delimited)", function (answer) {
    // TODO: Log the answer in a database
    console.log("Joining:", answer);
    join_channels = answer;
    rl.close();
    var res = answer.split(" ");
    for(var i = 0; i < res.length; i++){
        res[i] = '#'+res[i];
    }
    if(res.length == 0){
        console.log('no channels added')
    }
    else {

        setTimeout(function () {
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

//c.addListener('raw', function(message) { console.log('raw: ', message) });
            c.addListener('raw', function (message) {
                console.log(message.args[0] + ": " + message.args[1]);
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
        }, 3000);
    }
});




