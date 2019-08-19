cd /D "%~dp0"
title RGIO-video-host
RGIO-video-host.exe --host1=https://remotegames.io --port1=8100 --host2=https://remotegames.io --port2=8005 --offsetX=0 --offsetY=0 --width=1280 --height=720 --scale=360 --videoBitrate=2 --framerate=30 --captureRate=30 --windowTitle="WINDOW-TITLE-HERE" --audioDevice="AUDIO-DEVICE-HERE"
pause