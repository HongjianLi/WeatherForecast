#!/usr/bin/env bash
echo "$(date +"%F %T.%N") Script started"
export PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome
echo "$(date +"%F %T.%N") cd weather; node index.js city; cd ..;"
cd weather
node index.js city # This script creates screenshots in the `city` directory.
cd ..
echo "$(date +"%F %T.%N") cd tianqi; node index.js city; cd ..;"
cd tianqi
node index.js city # This script creates screenshots in the `city` directory.
cd ..
echo "$(date +"%F %T.%N") cd weather; node index.js county; cd ..;"
cd weather
node index.js county # This script creates screenshots in the `county` directory.
cd ..
echo "$(date +"%F %T.%N") cd tianqi; node index.js county; cd ..;"
cd tianqi
node index.js county # This script creates screenshots in the `county` directory.
cd ..
echo "$(date +"%F %T.%N") Script completed"
