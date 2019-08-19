cd /D "%~dp0"
title lagless2switch
node ws-relay.js --host1=https://remotegames.io --port1=8099 --host2=https://remotegames.io --port2=8000 --offsetX=0 --offsetY=0 --width=1920 --height=1080 --scale=540 --videoBitrate=2 --framerate=30 --captureRate=30 --windowTitle="switch" --audioDevice="Line 1 (Virtual Audio Cable)" --streamKey="a"