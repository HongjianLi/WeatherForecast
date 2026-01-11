#!/usr/bin/env bash

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
