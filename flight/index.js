#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const monday = new Date();
for (var nDaysAhead = 0; monday.getDay() !== 1; ++nDaysAhead) monday.setDate(monday.getDate() + 1); // Find the nearest Monday.
const depDate = monday.toISOString().slice(0, 10);
console.log(`Departing on ${depDate}, i.e. ${nDaysAhead} days ahead`);
const airports = await Promise.all(['CityCode', 'CodeCity'].map(m => fs.readFile(`airports${m}.json`).then(JSON.parse)));
const dstArr = [].concat(...JSON.parse(await fs.readFile(`../weather/city/uncomfortableDays.json`)).slice(23).filter(city => { // The first 23 cities are 香港, 澳门 and 广东21市. 无须飞机航班，乘坐高铁即可。
	const uncomfortableDays = city.uncomfortableDays.slice(nDaysAhead); // Skip dates before departure.
	if (uncomfortableDays[0]) return false; // If the departure date is uncomfortable, skip it.
	return uncomfortableDays.slice(1).reduce((acc, cur) => { // Sum the number of uncomfortable days after departure, and restrict the sum equal to or below 1.
		return acc + cur;
	}, 0) <= 2;
}).map(city => airports[0][city.city]).filter(airport => airport).map(codeArr => codeArr.slice(0, 1))).reduce((acc, cur) => { if (!acc.includes(cur)) acc.push(cur); return acc; }, []); // codeArr.slice(0, 1) retains the first code for the same city, e.g. CTU for 成都, because ly will return the flights for all airports of the same city, e.g. including TFU.
console.log(dstArr);
const browser = await puppeteer.launch({
	defaultViewport: { width: 1280, height: 2160 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
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
const bar = new ProgressBar('[:bar] :dst :current/:total=:percent :elapseds :etas', { total: dstArr.length });
for (const dst of dstArr) {
	bar.tick({ dst });
	for (const src of srcArr) {
		console.log(`${depDate}: ${src}-${dst} ${airports[1][src]}-${airports[1][dst]}`);
		let response;
		try {
			response = await page.goto(`https://www.ly.com/flights/itinerary/oneway/${src}-${dst}?date=${depDate}`, { waitUntil: 'networkidle0'} );
		} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next dst.
			console.error(`${depDate}: ${src}-${dst}: page.goto() error ${error}`);
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
//				await page.waitForNetworkIdle({ idleTime: 2000 }); // Time (in milliseconds) the network should be idle.
				const newHeight = await page.evaluate(() => document.body.scrollHeight);
				if (newHeight === prevHeight) break; // Break the loop if no new content is loaded.
				prevHeight = newHeight;
			}
			const flightList = await page.$$('div.flight-lists-container>div.flight-item');
			for (const flight of flightList) {
				const price = (await flight.$eval('div.head-prices>strong>em', el => el.innerText)).slice(1); // .slice(1) to filter out the currency symbol ￥.
				const departTime = await flight.$eval('div.f-startTime>strong', el => el.innerText); // e.g. 08:35
				const departHour = departTime.slice(0, 2); // e.g. 08
				console.log(price, price < 500, departTime, 10 <= departHour && departHour <= 16);
				await flight.dispose();
			}
		} else {
			console.error(`${depDate}: ${src}-${dst}: HTTP response status code ${response.status()}`);
		}
	}		
}
await browser.close();
