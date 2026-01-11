#!/usr/bin/env bash
echo "$(date +"%F %T.%N") Script started"
export PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome
echo "$(date +"%F %T.%N") node weather.js"
node weather.js
echo "$(date +"%F %T.%N") cd tracker"
cd tracker
echo "$(date +"%F %T.%N") node tracker.js"
node tracker.js
cd ..
echo "$(date +"%F %T.%N") Script completed"
