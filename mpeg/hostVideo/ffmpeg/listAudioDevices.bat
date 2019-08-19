cd /D "%~dp0"
ffmpeg.exe -list_devices true -f dshow -i dummy
pause