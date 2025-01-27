#!/usr/bin/env bash

cd map/echarts-china-cities-js/geojson/shape-only
node createGeoJson.js # This script creates `city.json` and `广东广西湖南江西福建.geojson`.
cd ../../../..

cd map/echarts-china-cities-js/geojson/shape-with-internal-borders
node createGeoJson.js # This script creates `city.json` and `广东广西湖南江西福建.geojson`.
cd ../../../..

cd nmc/city
node createCode.js # This script creates `code.json`.
cd ../..

cd weather/city
node createCode.js # This script creates `code.json`.
cd ../..

cd weather/county
node createCode.js # This script creates `code.json`.
cd ../..

cd tianqi/city
node createCode.js # This script creates `code.json`.
cd ../..

cd tianqi/county
node createCode.js # This script creates `code.json`.
cd ../..
