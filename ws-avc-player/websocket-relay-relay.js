const Splitter = require("stream-split");
const NALseparator = new Buffer([0, 0, 0, 1]); // NAL break
const spawn = require("child_process").spawn;
let io = require("socket.io-client");

const config = require("./config.js");

let socket2 = io("https://twitchplaysnintendoswitch.com", {
	path: "/8130/socket.io",
	reconnect: true,
});

let socket = io("https://twitchplaysnintendoswitch.com", {
	path: "/8100/socket.io",
	reconnect: true,
});
socket.on("connect", function () {
	socket.emit("joinSecure", { room: "lagless3Host", password: config.ROOM_SECRET });
});
setInterval(function () {
	socket.emit("joinSecure", { room: "lagless3Host", password: config.ROOM_SECRET });
}, 10000);
socket.on("restart", function () {
	process.exit();
});
socket.on("settings", (data) => {
	// set settings
	settings = Object.assign({}, settings, data);
	// restart video with new settings:
	createVideoStream();
});

// relay:
function send_stream(data) {
	socket2.emit("videoData", (data));
}

let settings = {
	framerate: 30,
	captureRate: 30,
	scale: 540,
	videoBitrate: 1,
	bufSize: "0.6M",
	minRate: "0.5M",
	maxRate: "4M",
	offsetX: 320,
	offsetY: 66,
	width: 1280,
	height: 720,
};

// https://stackoverflow.com/questions/51143100/framerate-vs-r-vs-filter-fps

function getVideoArgs() {
	let args = [
		// input:
		"-f", "gdigrab",
		"-offset_x", settings.offsetX,
		"-offset_y", settings.offsetY,
		"-video_size", settings.width + "x" + settings.height,
		// "-r", settings.captureRate,
		"-framerate", settings.captureRate,

		"-i", "title=OBS 21.1.0 (64bit, windows) - Profile: myProfile - Scenes: myScene",

		// output settings:
		"-vf", "fps=fps=1/" + settings.framerate,
		"-vf", "scale=" + (settings.scale * (16 / 9) + ":" + settings.scale),
		"-b:v", (settings.videoBitrate + "M"),
		"-bufsize", settings.bufSize,

		// "-bufsize", settings.bufSize,
		// "-minrate", settings.minRate,
		// "-maxrate", settings.maxRate,
		"-c:v", "libx264",
		"-tune", "zerolatency",
		"-preset", "ultrafast",
		"-vprofile", "baseline",
		"-pix_fmt", "yuv420p",
		"-f", "rawvideo",
		"-",
	];
	return args;
}

console.log("ffmpeg " + getVideoArgs().join(" "));

let ffmpegInstanceVideo;

function createVideoStream() {
	console.log("restarting ffmpeg (video)");
	try {
		ffmpegInstanceVideo.kill();
	} catch (error) {
		console.log("ffmpeg (video) was already killed / doesn't exist.")
	}

	ffmpegInstanceVideo = spawn("ffmpeg", getVideoArgs());
	// ffmpegInstanceVideo.stdout.on("data", (data) => {
	// 	console.log("stdout: " + data);
	// });
	// ffmpegInstanceVideo.stderr.on("data", (data) => {
	// 	console.log("stderr: " + data);
	// });
	// ffmpegInstanceVideo.on("close", (code) => {
	// 	console.log("closing code: " + code);
	// });
	let readStream = ffmpegInstanceVideo.stdout;
	readStream = readStream.pipe(new Splitter(NALseparator));
	readStream.on("data", send_stream);
}

createVideoStream();

// restart to prevent freezing:
setInterval(function () {
	createVideoStream();
}, 15000); // 15 seconds
