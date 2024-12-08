#!/usr/bin/env bash
cd weather
node index.js city # This script creates screenshots in the `city` directory.
cd ..

cd weather
node index.js county # This script creates screenshots in the `county` directory.
cd ..

cd tianqi
node index.js city # This script creates screenshots in the `city` directory.
cd ..

cd tianqi
node index.js county # This script creates screenshots in the `county` directory.
cd ..
