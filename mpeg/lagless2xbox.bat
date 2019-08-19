cd /D "%~dp0"
title lagless2xbox
node ws-relay.js --host1=https://remotegames.io --port1=8099 --host2=https://remotegames.io --port2=8001 --offsetX=2560 --offsetY=0 --width=1920 --height=1080 --scale=360 --videoBitrate=1.8 --framerate=30 --captureRate=30 --audioDevice="Line 2 (Virtual Audio Cable)" --streamKey="b"