#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const [ forecastArr, city2code/*, code2city*/ ] = await Promise.all(['../weather/city/forecast.json', 'airportsCityCode.json'/*, 'airportsCodeCity.json'*/].map(p => fs.readFile(p).then(JSON.parse))); // Prefer weather to nmc because weather provides the sky key 晴天预报, which indicates whether 灰霾 occurs.
const browser = await puppeteer.launch({
	defaultViewport: { width: 1280, height: 2160 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
//	headless: false,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
await page.setExtraHTTPHeaders({
	'accept-language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh;q=0.6',
	'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Linux"',
});
const srcArr = ['CAN', 'SZX'];
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: forecastArr.length });
for (const fc of forecastArr) {
	const { city, forecast } = fc;
	bar.tick({ city });
	if (bar.curr <= 23) continue; // curr starts from one. The first 23 cities are 香港, 澳门 and 广东21市. 无须飞机航班，乘坐高铁即可。
	const dstArr = city2code[city];
	if (!dstArr) continue; // Skip cities without airports.
	const dst = dstArr[0]; // It's sufficient to get just the first code for the city, e.g. CTU for 成都, because ly will return the flights for all airports of the same city, e.g. including TFU.
	const departDate = new Date();
	for (let i = 1; i < 5; ++i) {
		departDate.setDate(departDate.getDate() + 1);
		const f = forecast[i];
		if (f.uncomfortable) continue;
		const n = Math.min(6 - i, 4); // The number of days ahead to check.
		if ([...Array(n).keys()].reduce((acc, cur) => { // In the following n days, the number of uncomfortable days must be less than half.
			return acc + forecast[i + 1 + cur].uncomfortable;
		}, 0) >= n / 2) continue;
		const departDateString = departDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'});
		for (const src of srcArr) {
			let response;
			try {
				response = await page.goto(`https://www.ly.com/flights/itinerary/oneway/${src}-${dst}?date=${departDateString}`, { waitUntil: 'networkidle0'} );
			} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next dst.
				console.error(`${departDateString}: ${src}-${dst}: page.goto() error ${error}`);
				continue;
			}
			if (response.ok()) {
				const noFlights = await page.$('div.flight-no-data');
				if (noFlights !== null) { await noFlights.dispose(); continue }; // If no flights from src to dst, skip it.
				for (let prevHeight = 0; true;) {
					await page.evaluate(() => {
						window.scrollTo(0, document.body.scrollHeight);
					});
					await new Promise(resolve => setTimeout(resolve, 2120)); // Wait for some seconds for new contents to load.
//					await page.waitForNetworkIdle({ idleTime: 2000 }); // Time (in milliseconds) the network should be idle.
					const newHeight = await page.evaluate(() => document.body.scrollHeight);
					if (newHeight === prevHeight) break; // Break the loop if no new content is loaded.
					prevHeight = newHeight;
				}
				const flightList = await page.$$('div.flight-lists-container>div.flight-item');
				for (const flight of flightList) {
					const price = parseInt((await flight.$eval('div.head-prices>strong>em', el => el.innerText)).slice(1)); // .slice(1) to filter out the currency symbol ￥.
					const departTime = await flight.$eval('div.f-startTime>strong', el => el.innerText); // e.g. 08:35
					await flight.dispose();
					const departHour = departTime.slice(0, 2); // e.g. 08
					if (10 <= departHour && departHour <= 16) {
//						console.log(`${code2city[src]}-${code2city[dst]} ${src}-${dst} ${departDateString} ${departTime} ￥${price}`);
						if (!f.flight || f.flight.price > price) {
							f.flight = { src, departTime, price };
						}
						break; // The flightList is sorted by price ascendingly, so skip processing if the current flight is satisfactory.
					}
				}
			} else {
				console.error(`${departDateString}: ${src}-${dst}: HTTP response status code ${response.status()}`);
			}
		}
	}
}
await browser.close();
await fs.writeFile('../weather/city/forecast.json', JSON.stringify(forecastArr, null, '	'));
