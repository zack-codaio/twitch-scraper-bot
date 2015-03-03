/**
 * Created by zackaman on 3/3/15.
 */


var util = require('util');
var fs = require('fs');

var Canvas = require('canvas');
var Image = Canvas.Image;

var emotes = require('./twitch_logs_by_minute/1425359460960-#eternalenvyy.json');
//process for
// - number of minutes
var minutes = Object.keys(emotes.minutes);
var numMinutes = minutes.length;

var imageWidth = numMinutes * 40 + 40;
var sidePadding = 20;
var topSpace = 20;
var legendWidth = 0;
var drawableWidth = imageWidth - 2 * sidePadding - legendWidth;


// - number of different emotes
//build set of emotes present in the JSON
var emoteSet = {};
var mostOcurrences = 0;
for (var i = 0; i < numMinutes; i++) {
    //for each bar

    minuteOcurrences = 0;

    //for each emote in the minute
    minuteEmotes = Object.keys(emotes.minutes[minutes[i]].emotes);
    for (var j = 0; j < minuteEmotes.length; j++) {
        minuteOcurrences += emotes.minutes[minutes[i]].emotes[minuteEmotes[j]].ocurrences;
    }
    if (minuteOcurrences > mostOcurrences) {
        mostOcurrences = minuteOcurrences;
    }
}


console.log("Largest spike = " + mostOcurrences);
var imageHeight = 40 * mostOcurrences + 40;
var baselineY = imageHeight - 20;

var canvas = new Canvas(imageWidth, imageHeight);
ctx = canvas.getContext('2d');

//draw white background
console.log("image size = " + imageWidth + " x " + imageHeight);
ctx.fillStyle = '#FFF';
ctx.fillRect(0, 0, imageWidth, imageHeight);

//draw baseline
ctx.fillStyle = '#000';
ctx.beginPath();
ctx.lineTo(0 + sidePadding, baselineY);
ctx.lineTo(sidePadding + drawableWidth, baselineY);
ctx.strokeStyle = 'rgba(0,0,0,0.5)';
ctx.stroke();

draw_bar_for_minute(0);

function draw_bar_for_minute(minute) {
    //if (b == emoteArray.length) {
    if (minute == minutes.length) {
        save_img();
        //next minute
    }
    else {
        var emoteArray = [];
        var totalEmotes = 0;
        console.log(util.inspect(emotes.minutes, {depth: null}));
        var emoteKeys = Object.keys(emotes.minutes[minutes[minute]].emotes);
        console.log(util.inspect(emotes.minutes[minutes[minute]].emotes, {depth: null}));
        for (var i = 0; i < emoteKeys.length; i++) {
            for (var j = 0; j < emotes.minutes[minutes[minute]].emotes[emoteKeys[i]].ocurrences; j++) {
                emoteArray.push(emoteKeys[i]);
            }
        }
        console.log(emoteArray);

        //draw images onto canvas
        //start first one at (curX, baselineY - 40);
        curX = sidePadding + minute * 40;
        curY = baselineY - 40;
        console.log("curY init: " + curY);
        draw_emotes(0);
        function draw_emotes(a) {
            console.log("draw_emotes(" + a + ")");
            if (a == emoteArray.length) {
                draw_bar_for_minute(minute+1)
                //next minute
            }
            else {
                console.log(a);
                console.log(emoteArray.length);
                var iconFile = './resources/icons/' + emoteArray[a] + '.png';



                fs.readFile(iconFile, function (err, data) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    if(emoteArray[a] != "TTours") {
                        var img = new Canvas.Image;
                        img.src = data;

                        console.log(iconFile);
                        console.log("x: " + curX + " y: " + curY);
                        console.log("width: " + img.width + " height: " + img.height);

                        //try{
                        ctx.drawImage(img, curX, curY, img.width, img.height);
                        curY -= 40;
                    }
                    //}
                    //catch(e){
                    draw_emotes(a + 1);
                    //}
                    //save_img();
                });
            }
        }
    }
}


function save_img() {
    //save png
    var filename = "./rendered_visualizations" + '/hour_test3.png';
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
