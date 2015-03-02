
var util = require('util');
var fs = require('fs');

var Canvas = require('canvas');
var Image = Canvas.Image;
var canvas = new Canvas(506, 337);
ctx = canvas.getContext('2d');

ctx.font = '30px Impact';
ctx.rotate(.1);
ctx.fillText("Awesome!", 50, 100);

var te = ctx.measureText('Awesome!');
ctx.strokeStyle = 'rgba(0,0,0,0.5)';
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + te.width, 102);
ctx.stroke();

console.log('<img src="' + canvas.toDataURL() + '" />');

//get json

//get number of minutes
//to determine bar length

//find highest number of ocurrences
//scale bar height to 250px
//bar height = (ocurrences / max ocurrences) * 250px

//set bar saturation via users / ocurrences

//draw baseline



//save png
var out = fs.createWriteStream("./rendered_visualizations" + '/test.png')
    , stream = canvas.pngStream();

stream.on('data', function(chunk){
    out.write(chunk);
});

stream.on('end', function(){
    console.log('saved png');
});


