"use strict";

const ws = require('ws');
const Splitter = require('stream-split');
const spawn = require('child_process').spawn;
const NALseparator = new Buffer([0, 0, 0, 1]); // NAL break
let io = require("socket.io-client");

const config = require("./config.js");


let socket = io("https://twitchplaysnintendoswitch.com", {
	path: "/8130/socket.io",
	reconnect: true,
});


let socket2 = io("https://twitchplaysnintendoswitch.com", {
	path: "/8110/socket.io",
	reconnect: true,
});
socket2.on("connect", function () {
	socket2.emit("joinSecure", { room: "lagless3Host", password: config.ROOM_SECRET });
});
setInterval(function () {
	socket2.emit("joinSecure", { room: "lagless3Host", password: config.ROOM_SECRET });
}, 10000);
socket2.on("restart", function () {
	process.exit();
});
socket2.on("settings", function (data) {
	// set settings
	settings = Object.assign({}, settings, data);
	// restart video with new settings:
	console.log("restarting ffmpeg (video)");
	ffmpegInstance.kill();
	ffmpegInstance = spawn("ffmpeg", getArgs());
});


function send_stream(data) {
	//this.wss.clients.forEach(function(socket) {
	// if(socket.buzy) {
	// 	return;
	// }

	// socket.buzy = true;
	// socket.buzy = false;

	//socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
	// ws.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
	// 	socket.buzy = false;
	// });
	//});
	// console.log("got data.")
	socket.emit("videoData3", (data));
}

let settings = {
	framerate: 15,
	scale: "960:540",
	// scale: "640:360",
	// scale: "256:144",
	// videoBitrate: "3.5M",
	videoBitrate: "0.8M",
	bufSize: "0.6M",
	minRate: "0.5M",
	maxRate: "4M",
	offsetX: 320,
	offsetY: 41,
};

function getArgs() {
	let args = [
		"-f", "gdigrab",
		"-framerate", settings.framerate,
		"-offset_x", settings.offsetX, // -1600
		"-offset_y", settings.offsetY, //  61+360
		"-video_size", 1280 + "x" + 720,
		// "-i",  "desktop",
		"-i", "title=OBS 21.1.0 (64bit, windows) - Profile: myProfile - Scenes: myScene",
		// "-i title= \"OBS 21.1.0 (64bit, windows) - Profile: myProfile - Scenes: myScene\"",
		// "-vf", "fps=fps=1/" + settings.framerate,
		"-vf", "scale=" + settings.scale,
		"-b:v", settings.videoBitrate,
		"-bufsize", settings.bufSize,
		"-tune", "zerolatency",

		// "-bufsize", settings.bufSize,
		// "-minrate", settings.minRate,
		// "-maxrate", settings.maxRate,
		"-vcodec", "libx264",
		"-vprofile", "baseline",
		"-pix_fmt", "yuv420p",
		"-f", "rawvideo",
		// "http://localhost:8083",
		// "http://localhost:8082"
		"-",
	];
	return args;
}

console.log("ffmpeg " + getArgs().join(" "));
let ffmpegInstance = spawn("ffmpeg", getArgs());
ffmpegInstance.stdout.on("data", function (data) {
	console.log("stdout: " + data);
});
ffmpegInstance.stderr.on("data", function (data) {
	console.log("stderr: " + data);
});
ffmpegInstance.on("close", function (code) {
	console.log("closing code: " + code);
});

let readStream = ffmpegInstance.stdout;
readStream = readStream.pipe(new Splitter(NALseparator));
readStream.on("data", send_stream);