@echo off
:loop
cd C:\Users\Administrator\Downloads\Discordjs
node index.js

:: Check the exit status
if %ERRORLEVEL% equ 1 (
    echo "Node process exited due to timeout, restarting..."
    goto loop
)

:: Add a small delay before restarting to avoid rapid restarts
timeout /t 5
goto loop
