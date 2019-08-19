"use strict";


const spawn = require("child_process").spawn;
const WebSocketServer = require("ws").Server;
const Splitter = require("stream-split");
const NALseparator = new Buffer([0, 0, 0, 1]); //NAL break


class FFMpegServer {

	constructor(server, options) {

		this.options = {};
		this.options.width = options.width;
		this.options.height = options.height;
		this.options.x = options.x;
		this.options.y = options.y;
		this.options.fps = options.fps;
		this.options.scalex = options.scalex;
		this.options.scaley = options.scaley;
		this.options.crf = options.crf;
		this.options.videoBitrate = options.videoBitrate;

		this.ffmpegInstance = null;

		this.wss = new WebSocketServer({ server });

		this.new_client = this.new_client.bind(this);
		this.start_feed = this.start_feed.bind(this);
		this.broadcast = this.broadcast.bind(this);

		this.args = [];

		this.wss.on("connection", this.new_client);
	}


	start_feed() {
		var readStream = this.get_feed();
		this.readStream = readStream;

		readStream = readStream.pipe(new Splitter(NALseparator));
		readStream.on("data", this.broadcast);
	}

	get_feed() {

		this.args = [
			"-f", "gdigrab",
			"-framerate", this.options.fps,
			"-offset_x", this.options.x,
			"-offset_y", this.options.y,
			"-video_size", this.options.width + "x" + this.options.height,
			"-i", "desktop",
			"-pix_fmt", "yuv420p",
			"-preset", "ultrafast",
			"-crf", this.options.crf,
			"-b:v", this.options.videoBitrate,
			// "-bufsize", "8000k",
			// "-maxrate", "6000k",
			"-c:v", "libx264",
			"-vprofile", "baseline",
			"-tune", "zerolatency",
			"-f", "rawvideo",
			// "-vf",  "scale=" + this.options.scalex + ":-1",
			// "-s:v",  this.options.scalex + "x" + this.options.scaley,
			// "-vf", "scale='640:trunc(ow/a/2)*2'",
			'-'
		];

		if (this.ffmpegInstance != null) {
			this.ffmpegInstance.kill();
		}

		console.log("ffmpeg " + this.args.join(" "));
		this.ffmpegInstance = spawn("ffmpeg", this.args);
		//streamer.stderr.pipe(process.stderr);

		this.ffmpegInstance.on("exit", function (code) {
			console.log("Failure", code);
		});

		return this.ffmpegInstance.stdout;
	}

	restart_feed() {
		console.log("restarting ffmpeg (video)");
		this.ffmpegInstance.kill();
		this.ffmpegInstance = spawn("ffmpeg", this.args);
	}


	broadcast(data) {
		this.wss.clients.forEach(function (socket) {

			if (socket.buzy) {
				return;
			}

			socket.buzy = false;

			socket.send(Buffer.concat([NALseparator, data]), { binary: true }, function ack(error) {
				socket.buzy = false;
			});
		});
	}

	new_client(socket) {

		var self = this;
		console.log("New guy");

		socket.send(JSON.stringify({
			action: "init",
			width: this.options.width,
			height: this.options.height,
		}));

		self.start_feed();

		//var readStream = this.readStream.pipe(new Splitter(NALseparator));
		//readStream.on("data", this.broadcast);

		// socket.on("message", function(data){
		//   var cmd = "" + data, action = data.split(" ")[0];
		//   console.log("Incomming action '%s'", action);

		//   if(action == "REQUESTSTREAM")
		//     self.start_feed();
		//   if(action == "STOPSTREAM")
		//     self.readStream.pause();
		// });

		socket.on("close", function () {
			//self.readStream.end();
			console.log("stopping client interval");
		});
	}

};


module.exports = FFMpegServer;