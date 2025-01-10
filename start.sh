#!/usr/bin/env bash
echo "$(date +"%F %T.%N") Script started"
export PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome
cd weather
echo "$(date +"%F %T.%N") node index.js city"
node index.js city # This script creates screenshots in the `city` directory.
echo "$(date +"%F %T.%N") node index.js county"
node index.js county # This script creates screenshots in the `county` directory.
cd ..
echo "$(date +"%F %T.%N") Script completed"
