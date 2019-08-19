const AvcServer = require("./lib/server");
const path = require("path");
const http = require("http");
const WebSocketServer = require("uws").Server;
const net = require("net");
const spawn = require("child_process").spawn;

const width = 1280;
const height = 720;

const express = require("express");
const app = express();
// serve the html/index.html
app.use(express.static(path.resolve(__dirname, "html")));
// serve the player
app.use(express.static(path.resolve(__dirname, "../lib")));

const server = http.createServer(app);

// init web socket
const wss = new WebSocketServer({ /* port: 3333 */ server });
// init the avc server.
const avcServer = new AvcServer(wss, width, height);

// handling custom events from client
avcServer.client_events.on("custom_event_from_client", e => {
	console.log("a client sent", e);
	// broadcasting custom events to all clients (if you wish to send a event to specific client, handle sockets and new connections yourself)
	avcServer.broadcast("custom_event_from_server", { hello: "from server" });
})


// create the tcp sever that accepts a h264 stream and broadcasts it back to the clients
this.tcpServer = net.createServer((socket) => {
	// set video stream
	avcServer.setVideoStream(socket);

})
this.tcpServer.listen(8083, "0.0.0.0");

server.listen(8003);

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
		"http://localhost:8083",
		// "http://localhost:8082"
	];
	return args;
}

if (this.ffmpegInstance != null) {
	this.ffmpegInstance.kill("SIGINT");
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