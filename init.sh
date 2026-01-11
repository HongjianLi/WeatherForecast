#!/usr/bin/env bash

cd echarts-china-cities-js/geojson/shape-only
node createGeoJson.js # This script creates `city.json` and `map.geojson`.
cd ../../..

cd echarts-china-cities-js/geojson/shape-with-internal-borders
node createGeoJson.js # This script creates `city.json` and `map.geojson`.
cd ../../..
