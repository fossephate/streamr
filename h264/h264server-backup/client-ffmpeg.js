"use strict";

/**
* Run this on windows desktop
*/

const WebSocket = require('ws');
const Splitter        = require('stream-split');
const spawn  = require('child_process').spawn;
const NALseparator    = new Buffer([0,0,0,1]);//NAL break


const ws = new WebSocket('wss://twitchplaysnintendoswitch.com/3000/', {
  origin: 'https://twitchplaysnintendoswitch.com'
});


// const silence = new WebStreamerServer(server, {
// 	fps: 15,
// 	width : 1280,
// 	height: 720,
// 	x: 317-1920,
// 	y: 61,
// 	scalex: 1280,
// 	scaley: 720,
// });


function send_stream(data) {
	//this.wss.clients.forEach(function(socket) {

		// if(socket.buzy) {
		// 	return;
		// }

		// socket.buzy = true;
		// socket.buzy = false;

		//socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
		ws.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
			socket.buzy = false;
		});
	//});
}

var options = {
	fps: 15,
	width : 1280,
	height: 720,
	x: 317-1920,
	y: 61,
	scalex: 1280,
	scaley: 720,
}

var args = [
    "-f", "gdigrab",
    "-framerate", options.fps,
    "-offset_x", options.x, 
    "-offset_y", options.y, 
    "-video_size", options.width + 'x' + options.height,
    '-i',  'desktop', 
    '-pix_fmt',  'yuv420p',
    '-preset',  'ultrafast',
    '-crf',  '25',
    '-b:v', '5M',
    '-bufsize', '8000k',
    '-maxrate', '6000k',
    '-c:v',  'libx264',
    '-vprofile', 'baseline',
    '-tune', 'zerolatency',
    '-f' ,'rawvideo',
    // "-vf",  "scale=" + this.options.scalex + ":-1",
    // "-s:v",  this.options.scalex + "x" + this.options.scaley,
    // "-vf", "scale='640:trunc(ow/a/2)*2'",
    '-'
];

// if(this.ffmpegInstance != null) {
//     this.ffmpegInstance.kill('SIGINT');
// }

console.log("ffmpeg " + args.join(' '));
var ffmpegInstance = spawn('ffmpeg', args);

ffmpegInstance.on("exit", function(code){
  console.log("Failure", code);
});

var readStream = ffmpegInstance.stdout;
readStream = readStream.pipe(new Splitter(NALseparator));
readStream.on("data", send_stream);

ws.on('open', function open() {
  console.log('connected');
  ws.send(Date.now());
});