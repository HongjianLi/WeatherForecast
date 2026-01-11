# weather-forecast

Retrieve 7-day weather forecast for Chinese cities.

Data come from three sources:
* [nmc](http://www.nmc.cn/) Pros: official, accurate, updated regularly. Cons: IP blacklist enforced, lacking city downtown districts.
* [weather](http://www.weather.com.cn/) Pros: robot friendly， sky level. Cons: delayed update occasionally, lacking splitted counties.
* [tianqi](https://www.tianqi.com/) Cons: IP blacklist enforced.

## Initialization (`init.sh`)

* `cd nmc/city; node createCode.js; cd ../..`
* `cd weather/city; node createCode.js; cd ../..`
* `cd weather/county; node createCode.js; cd ../..`
* `cd tianqi/city; node createCode.js; cd ../..`
* `cd tianqi/county; node createCode.js; cd ../..`

## Usage (`start.sh`)

* `cd nmc; node index.js city; cd ..`
* `cd weather; node index.js city; cd ..`
* `cd weather; node index.js county; cd ..`
* `cd tianqi; node index.js city; cd ..`
* `cd tianqi; node index.js county; cd ..`
