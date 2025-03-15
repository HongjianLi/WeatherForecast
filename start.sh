#!/usr/bin/env bash
echo "$(date +"%F %T.%N") Script started"
echo "$(date +"%F %T.%N") node index.js"
node index.js
export PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome
echo "$(date +"%F %T.%N") cd nmc"
cd nmc
echo "$(date +"%F %T.%N") node index.js"
node index.js
echo "$(date +"%F %T.%N") cd .."
cd ..
echo "$(date +"%F %T.%N") cd weather"
cd weather
echo "$(date +"%F %T.%N") node index.js city"
node index.js city # This script creates screenshots in the `city` directory.
echo "$(date +"%F %T.%N") node index.js county"
node index.js county # This script creates screenshots in the `county` directory.
echo "$(date +"%F %T.%N") cd .."
cd ..
echo "$(date +"%F %T.%N") cd flight"
cd flight
echo "$(date +"%F %T.%N") node index.js"
node index.js
cd ..
echo "$(date +"%F %T.%N") Script completed"
