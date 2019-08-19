"use strict";


const spawn  = require('child_process').spawn;
// const merge  = require('mout/object/merge');

const Server = require('./_server');


class FFMpegServer extends Server {

  constructor(server, opts) {
    super(server, opts);
  }

  get_feed() {

    var args = [
        "-f", "gdigrab",
        "-framerate", this.options.fps,
        "-offset_x", this.options.x, 
        "-offset_y", this.options.y, 
        "-video_size", this.options.width + 'x' + this.options.height,
        '-i',  'desktop', 
        '-pix_fmt',  'yuv420p',
        '-preset',  'ultrafast',
        '-crf',  this.options.crf,
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

    if(this.ffmpegInstance != null) {
        this.ffmpegInstance.kill('SIGINT');
    }

    console.log("ffmpeg " + args.join(' '));
    this.ffmpegInstance = spawn('ffmpeg', args);
    //streamer.stderr.pipe(process.stderr);

    this.ffmpegInstance.on("exit", function(code){
      console.log("Failure", code);
    });

    return this.ffmpegInstance.stdout;
  }

};


module.exports = FFMpegServer;


