@ECHO OFF
SETLOCAL EnableExtensions DisableDelayedExpansion

rem Part 1: ALL USEFUL WINDOW TITLES
echo(
set "_myExcludes=^\"conhost ^\"dwm ^\"nvxdsync ^\"nvvsvc ^\"dllhost ^\"taskhostex"
for /F "tokens=1,2,8,* delims=," %%G in ('
  tasklist /V /fo:csv ^| findstr /V "%_myExcludes%"
                                        ') do (
    if NOT "%%~J"=="N/A" echo %%G,%%~H,%%J
)

rem Part 2: MY OWN cmd WINDOW TITLE
echo(
set "_myTitleTail= - %~0"
for /F "tokens=1,2,8,* delims=," %%G in ('
  tasklist /V /fo:csv ^| findstr /I /C:"%_myTitleTail%"
                                        ') do (
    set "_myTitleBatch=%%~J"
    set "_myCmdPIDno=%%~H"
)
call set "_myCmdTitle=%%_myTitleBatch:%_myTitleTail%=%%"
echo _myCmdPIDno=%_myCmdPIDno%
SETLOCAL EnableDelayedExpansion
  echo _myCmdTitle=!_myCmdTitle!
ENDLOCAL