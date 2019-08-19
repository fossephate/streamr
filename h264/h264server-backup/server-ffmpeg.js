"use strict";

/**
* Run this on windows desktop
* then browse (using google chrome/firefox) to http://[pi ip]:8080/
*/


const http    = require('http');
const express = require('express');


const WebStreamerServer = require('./lib/ffmpeg');

const app  = express();

  //public website
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/vendor/dist'));


const server  = http.createServer(app);
const silence = new WebStreamerServer(server, {
	fps: 30,
	width : 1280,
	height: 720,
	x: 317-1920,
	y: 61,
	scalex: 1280,
	scaley: 720,
	crf: 20,
});

// const silence = new WebStreamerServer(server, {
// 	fps: 20,
// 	width : 640,
// 	height: 360,
// 	x: 640-1920,
// 	y: 61,
// 	scalex: 640,
// 	scaley: 360,
// });

silence.start_feed();

server.listen(8080);