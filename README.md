# WeatherForecast

* Use puppeteer to capture web page portions of 7-day weather forecast for some cities.

## Initialization (`init.sh`)

* `cd map/echarts-china-cities-js/geojson/shape-only; node createGeoJson.js; cd ../../../..` This script creates `city.json` and `广东广西湖南江西福建.geojson`.
* `cd map/echarts-china-cities-js/geojson/shape-with-internal-borders; node createGeoJson.js; cd ../../../..` This script creates `city.json` and `广东广西湖南江西福建.geojson`.
* `cd weather/city; node createCode.js; cd ../..` This script creates `code.json`.
* `cd weather/county; node createCode.js; cd ../..` This script creates `code.json`.
* `cd tianqi/city; node createCode.js; cd ../..` This script creates `code.json`.
* `cd tianqi/county; node createCode.js; cd ../..` This script creates `code.json`.

## Usage (`start.sh`)

* `cd weather; node index.js city; cd ..` This script creates screenshots in the `city` directory.
* `cd weather; node index.js county; cd ..` This script creates screenshots in the `county` directory.
* `cd tianqi; node index.js city; cd ..` This script creates screenshots in the `city` directory.
* `cd tianqi; node index.js county; cd ..` This script creates screenshots in the `county` directory.
