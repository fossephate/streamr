const fs = require("fs");
const http = require("http");
// const Splitter = require("stream-split");
// const NALseparator = new Buffer([0, 0, 0, 1]); // NAL break
const spawn = require("child_process").spawn;
let socketio = require("socket.io-client");

function getArgs() {
	let args = {};
	process.argv
	.slice(2, process.argv.length)
	.forEach((arg) => {
		// long arg
		if (arg.slice(0, 2) === "--") {
			const longArg = arg.split("=");
			args[longArg[0].slice(2, longArg[0].length)] = longArg[1];
		}
		// flags
		else if (arg[0] === "-") {
			const flags = arg.slice(1, arg.length).split("");
			flags.forEach((flag) => {
				args[flag] = true;
			});
		}
	});
	return args;
}

const myArgs = getArgs();

if (!myArgs.host1, !myArgs.port1 || !myArgs.host2, !myArgs.port2 || !myArgs.streamKey) {
	console.log("missing arguments! you need required args: --host1, --port1, --host2, --port2, --streamKey");
	console.log("host1 is the main server and host2 is the video relay server.");
	console.log("optional args: width, height, offsetX, offsetY, framerate, resolution, captureRate, videoBitrate, windowTitle, audioDevice.");
	console.log(myArgs);
	return;
}

let socket1 = socketio(myArgs.host1, {
	path: `/${myArgs.port1}/socket.io`,
	reconnect: true,
});
let socket2 = socketio(myArgs.host2, {
	path: `/${myArgs.port2}/socket.io`,
	reconnect: true,
});

// socket1.on("connect", () => {
// 	socket1.emit("join", `host${myArgs.cNum}`);
// });
// setInterval(() => {
// 	socket1.emit("join", `host${myArgs.cNum}`);
// }, 10000);
// socket1.on("restart", () => {
// 	process.exit();
// });
// socket1.on("settings", (data) => {
// 	// set settings
// 	settings = Object.assign({}, settings, data);
// 	// restart video with new settings:
// 	console.log("restarting ffmpeg (video)");
// 	createVideoStream();
// });

socket2.on("connect", () => {
	socket2.emit("authenticate", {streamKey: myArgs.streamKey});
});
setInterval(() => {
	socket2.emit("authenticate", {streamKey: myArgs.streamKey});
}, 10000);

// relay:
function send_stream(data) {
	socket2.emit("videoData", data);
}

let settings = {
	framerate: myArgs.framerate || 30,
	captureRate: myArgs.captureRate || 30,
	resolution: myArgs.resolution || 360,
	videoBitrate: myArgs.videoBitrate || 2,
	// bufSize: "0.6M",
	// minRate: "0.5M",
	// maxRate: "4M",
	offsetX: myArgs.offsetX || 0,
	offsetY: myArgs.offsetY || 0,
	width: myArgs.width || 1280,
	height: myArgs.height || 720,
	windowTitle: myArgs.windowTitle || null,
	audioDevice: myArgs.audioDevice || null,
};

// https://stackoverflow.com/questions/51143100/framerate-vs-r-vs-filter-fps
// https://trac.ffmpeg.org/wiki/StreamingGuide
// You may be able to decrease initial "startup" latency by specifing that I-frames come "more frequently" (or basically always, in the case of x264's zerolatency setting), though this can increase frame size and decrease quality, see ​here for some more background. Basically for typical x264 streams, it inserts an I-frame every 250 frames. This means that new clients that connect to the stream may have to wait up to 250 frames before they can start receiving the stream (or start with old data). So increasing I-frame frequency (makes the stream larger, but might decrease latency). For real time captures you can also decrease latency of audio in windows dshow by using the dshow audio_buffer_size ​setting. You can also decrease latency by tuning any broadcast server you are using to minimize latency, and finally by tuning the client that receives the stream to not "cache" any incoming data, which, if it does, increases latency.
// audio_buffer_size


function getVideoArgs() {

	let args = [
		// input:
		"-f", "gdigrab",
		"-offset_x", settings.offsetX,
		"-offset_y", settings.offsetY,
		"-video_size", `${settings.width}x${settings.height}`,
		// "-r", settings.captureRate,
		"-framerate", settings.captureRate,
		"-draw_mouse", 0,

		"-i", `title=${settings.windowTitle}`,
		// "-i", "title=Xbox",
		// "-i", "desktop",
		// "-show_region", 1,

		// output settings:
		"-f", "mpegts",
		// "-vf", "fps=fps=1/" + settings.framerate,// disabled for testing
		"-vf", `scale=${(settings.resolution * (16 / 9))}:${settings.resolution}`,
		"-b:v", `${settings.videoBitrate}M`,
		"-bf", 0, // new
		"-me_method", "zero", // epzs / zero// new
		"-g", 10,// group of pictures (gop)// new
		"-c:v", "mpeg1video",
		"-",
	];

	// audio and video combined:
	// let args2 = [
	//
	// 	// video:
	// 	"-f", "gdigrab",
	// 	"-offset_x", settings.offsetX,
	// 	"-offset_y", settings.offsetY,
	// 	"-video_size", `${settings.width}x${settings.height}`,
	// 	// "-r", settings.captureRate,
	// 	"-framerate", settings.captureRate,
	// 	"-draw_mouse", 0,
	//
	// 	"-i", `title=${settings.windowTitle}`,
	//
	// 	// audio:
	// 	"-f", "dshow",
	// 	"-ar", 44100, // 44100
	// 	"-ac", 1, // new
	// 	"-audio_buffer_size", 0,// new
	// 	"-i", `audio=${settings.audioDevice}`,
	//
	// 	// output settings:
	// 	"-f", "mpegts",
	//
	// 	// audio:
	// 	"-c:a", "mp2",
	// 	"-b:a", "128k",
	// 	// "-tune", "zerolatency",// new// might be x264 only
	// 	"-async", 1,// audio sync method// new
	// 	"-muxdelay", 0.001,
	// 	// video:
	// 	// "-vf", "fps=fps=1/" + settings.framerate,// disabled for testing
	// 	"-vf", `scale=${(settings.resolution * (16 / 9))}:${settings.resolution}`,
	// 	"-b:v", `${settings.videoBitrate}M`,
	// 	"-bf", 0, // new
	// 	"-me_method", "zero", // epzs / zero// new
	// 	"-g", 10,// group of pictures (gop)// new
	// 	"-c:v", "mpeg1video",
	// 	"-",
	// ];

	// delete the windowTitle argument if it's null:
	if (!myArgs.windowTitle) {
		args[13] = "desktop";
	}
	// if there is a window specified get rid of the width and height arguments:
	if (myArgs.windowTitle) {
		args.splice(6, 1);
		args.splice(6, 1);// pos 7 becomes pos 6
	}

	return args;
}

let path;
if (process.pkg) {
	// path = __dirname.substring(10);
	path = process.execPath;
	let index = path.lastIndexOf("\\");
	// let n = (path.length - index) - 1;
	let n = (path.length - index);
	path = path.slice(0, -n);
} else {
	path = process.cwd();
}

let ffmpegLocation = path + "\\ffmpeg\\ffmpeg.exe";

// audio:
function getAudioArgs() {
	// audio:
	let args = [
		// input:
		"-f", "dshow",
		// "-ar", 44100, // 44100
		// "-ac", 1, // new
		"-i", `audio=${settings.audioDevice}`,

		// output:
		"-f", "mpegts",
		"-ar", 44100, // 44100
		"-ac", 1, // new
		"-audio_buffer_size", 0,// new
		"-c:a", "mp2",
		"-b:a", "128k",// 128k
		//"-async", 1,// audio sync method// new
		"-muxdelay", 0.001,
		"-",
	];
	return args;
}

console.log("ffmpeg " + getVideoArgs().join(" "));
console.log("ffmpeg " + getAudioArgs().join(" "));

let ffmpegInstanceVideo;
let ffmpegInstanceAudio;

let log = false;

function createVideoStream() {
	console.log("restarting ffmpeg (video)");
	try {
		ffmpegInstanceVideo.kill();
	} catch (error) {
		console.log("ffmpeg (video) was already killed / doesn't exist.")
	}

	ffmpegInstanceVideo = spawn(ffmpegLocation, getVideoArgs());

	if (log) {
		// ffmpegInstanceVideo.stdout.on("data", (data) => {
		// 	console.log("stdout: " + data);
		// });
		ffmpegInstanceVideo.stderr.on("data", (data) => {
			console.log("stderr: " + data);
		});
	}
	ffmpegInstanceVideo.on("close", (code) => {
		console.log("closing code: " + code);
	});
	let readStream = ffmpegInstanceVideo.stdout;
	// readStream = readStream.pipe(new Splitter(NALseparator));
	readStream.on("data", send_stream);
}


function createAudioStream() {
	console.log("restarting ffmpeg (audio)");
	try {
		ffmpegInstanceAudio.kill();
	} catch (error) {
		console.log("ffmpeg (audio) was already killed / doesn't exist.")
	}

	console.log("ffmpeg " + getAudioArgs().join(" "));
	ffmpegInstanceAudio = spawn(ffmpegLocation, getAudioArgs());
	if (log) {
		// ffmpegInstanceAudio.stdout.on("data", (data) => {
		// 	console.log("stdout: " + data);
		// });
		ffmpegInstanceAudio.stderr.on("data", (data) => {
			console.log("stderr: " + data);
		});
	}
	ffmpegInstanceAudio.on("close", (code) => {
		console.log("closing code: " + code);
	});
	let readStream = ffmpegInstanceAudio.stdout;
	readStream.on("data", send_stream);
}

createVideoStream();
if (myArgs.audioDevice) {
	createAudioStream();
}

// restart to prevent freezing:
setInterval(() => {
	createVideoStream();
}, 60000 * 2);// 2 minutes
if (myArgs.audioDevice) {
	setInterval(() => {
		createAudioStream();
	}, 60000 * 10);// 10 minutes
}
