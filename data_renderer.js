
var util = require('util');
var fs = require('fs');

var Canvas = require('canvas');
var Image = Canvas.Image;

var imageWidth = 506;
var imageHeight = 337;
var sidePadding = 15;
var baselineY = 310;
var topSpace = 20;
var legendWidth = 80;
var drawableWidth = imageWidth - 2 * sidePadding - legendWidth;

var emotes = require('./twitch_json/1425242227267-#dotapit.json');
//process for
// - number of minutes
var minutes = Object.keys(emotes.minutes);
var numMinutes = minutes.length;

// - number of different emotes
//build set of emotes present in the JSON
var emoteSet = {};
var mostOcurrences = 0;
for(var i = 0; i < numMinutes; i++){
    var curEmote = emotes.minutes[minutes[i]].emoteName;
    //console.log(curEmote);
    if(!(curEmote in emoteSet)){
        emoteSet[curEmote] = true;
    }

    // - highest number of emotes
    if(emotes.minutes[minutes[i]].ocurrences > mostOcurrences){
        mostOcurrences = emotes.minutes[minutes[i]].ocurrences;
    }
}
console.log("Largest spike = "+ mostOcurrences);
var numEmotes = Object.keys(emoteSet).length;

var colorList = ['#000000', '#0000FF', '#660066', '#990000', '#006600', '#FF6600', '#CCCC00', '#663300', '#FF0099', '#66FF00'];

var curColor = 0;
for(var i = 0; i < numEmotes; i++){
    emoteSet[Object.keys(emoteSet)[i]] = colorList[curColor];
    curColor++;
    if(curColor >= colorList.length){
        curColor = 0;
    }
}

//for legend:
// - emote name
// - color
// - ocurrences

var canvas = new Canvas(imageWidth, imageHeight);
ctx = canvas.getContext('2d');

//draw white background
ctx.fillStyle = '#FFF';
ctx.fillRect(0,0,imageWidth, imageHeight);

//draw baseline
ctx.fillStyle = '#000';
ctx.beginPath();
ctx.lineTo(0+sidePadding,baselineY);
ctx.lineTo(sidePadding + drawableWidth,baselineY);
ctx.strokeStyle = 'rgba(0,0,0,0.5)';
ctx.stroke();

//draw bars
var curX = sidePadding;
var barWidth = drawableWidth / numMinutes;
var barHeight = 0;
var curY = 0;
var maxHeight = baselineY - topSpace;
for(var i = 0; i < numMinutes; i++){
    //find highest number of ocurrences
    //scale bar height to 250px?
    //bar height = (ocurrences / max ocurrences) * 250px
    //calculate barHeight and use that to place initial Y coord
    var emoteName = emotes.minutes[minutes[i]].emoteName;
    ctx.fillStyle = emoteSet[emoteName];
    var ocurrences = emotes.minutes[minutes[i]].ocurrences;
    var numUsers = emotes.minutes[minutes[i]].numUsers;
    barHeight = maxHeight * ocurrences / mostOcurrences;
    curY = maxHeight - barHeight + topSpace;

    //set bar saturation via users / ocurrences
    //set transparency based on hive-mindey-ness
    ctx.globalAlpha = Math.pow(numUsers / ocurrences, 2);

    //set color from emote
    console.log(emoteSet[emoteName]);


    ctx.fillRect(curX, curY, barWidth-2, barHeight);
    curX += barWidth;
}


//label minutes
var baselineOffset = 18;
ctx.fillStyle = "#000";
ctx.font = '14px Helvetica';
ctx.fillText("0",sidePadding, baselineY + baselineOffset);
var lastMinute = Object.keys(emotes.minutes).length;
ctx.fillText(lastMinute,  sidePadding + drawableWidth - ctx.measureText(lastMinute).width, baselineY + baselineOffset);
ctx.fillText("Minutes", imageWidth/2 - ctx.measureText("Minutes").width, baselineY+baselineOffset);

//ctx.rotate(.1);
//ctx.fillText("Awesome!", 50, 100);
//
//var te = ctx.measureText('Awesome!');
//ctx.strokeStyle = 'rgba(0,0,0,0.5)';
//ctx.beginPath();
//ctx.lineTo(50, 102);
//ctx.lineTo(50 + te.width, 102);
//ctx.stroke();
//
//console.log('<img src="' + canvas.toDataURL() + '" />');

//draw legend
var curX = imageWidth - legendWidth + 15;
var curY = 15;
var rectSize = 10;
for(var i = 0; i < numEmotes; i++){
    //draw rectangle
    //var emoteName = emotes.minutes[minutes[i]].emoteName;
    boxY = curY + imageHeight / numEmotes - rectSize/2;
    ctx.fillStyle = emoteSet[Object.keys(emoteSet)[i]];
    ctx.fillRect(curX, curY, rectSize, rectSize);
    //draw emote
    //draw text

    curY += imageHeight / numEmotes;
}


//save png
var out = fs.createWriteStream("./rendered_visualizations" + '/test.png')
    , stream = canvas.pngStream();

stream.on('data', function(chunk){
    out.write(chunk);
});

stream.on('end', function(){
    console.log('saved png');
    console.log(emoteSet);
    console.log(numEmotes);
    //console.log(emoteSet['Kappa'].color);
});

