#!/usr/bin/env node
// This script only supports prefecture-level cities, because nmc does not provide forecast for every county.
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const monday = new Date();
for (var nDaysAhead = 0; monday.getDay() !== 1; ++nDaysAhead) monday.setDate(monday.getDate() + 1); // Find the nearest Monday.
const depDate = monday.toISOString().slice(0, 10);
console.log(`Departing on ${depDate}, i.e. ${nDaysAhead} days ahead`);
const airports = JSON.parse(await fs.readFile('../airports.json'));
const dstArr = [].concat(...JSON.parse(await fs.readFile(`../../weather/city/uncomfortableDays.json`))/*.slice(23)*/.filter(city => { // The first 23 cities are 香港, 澳门 and 广东21市. 无须飞机航班，乘坐高铁即可。
	const uncomfortableDays = city.uncomfortableDays.slice(nDaysAhead); // Skip dates before departure.
	if (uncomfortableDays[0]) return false; // If the departure date is uncomfortable, skip it.
	return uncomfortableDays.slice(1).reduce((acc, cur) => { // Sum the number of uncomfortable days after departure, and restrict the sum equal to or below 1.
		return acc + cur;
	}, 0) <= 2;
}).map(city => airports[city.city]).filter(airport => airport));
console.log(dstArr);
const browser = await puppeteer.launch({
	defaultViewport: { width: 1280, height: 2160 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
});
await browser.setCookie({
	name: 'cticket',
	value: '2AC336C073459412D0F080D3B34F23B65F26C7C97FBEAEF7C375E41E3A10CCC6',
	domain: '.ctrip.com',
	expires: 2147483647,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
await page.setExtraHTTPHeaders({
	'referer': 'https://flights.ctrip.com/',
	'accept-language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh;q=0.6',
	'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Linux"',
});
const srcArr = ['CAN', 'SZX'/*, 'CTU', 'TFU'*/];
const bar = new ProgressBar('[:bar] :dst :current/:total=:percent :elapseds :etas', { total: dstArr.length });
for (let dstIdx = 0; dstIdx < dstArr.length; ++dstIdx) {
	const dst = dstArr[dstIdx];
	bar.tick({ dst });
	for (let srcIdx = 0; srcIdx < srcArr.length; ++srcIdx) {
		const src = srcArr[srcIdx];
		console.log(`${src}-${dst}`);
		let response;
		try {
			response = await page.goto(`https://flights.ctrip.com/online/list/oneway-${src}-${dst}?depdate=${depDate}`);
			// https://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=海口&searchArrivalAirport=广州&searchDepartureTime=2025-02-21
			//https://www.ly.com/flights/itinerary/oneway/CAN-SYX?date=2025-02-05
		} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
			console.error(`${src}-${dst}: page.goto() error ${error}`);
			continue;
		}
		if (response.ok()) {
			if (await page.$('div.no-flights') !== null) continue; // If no flights from src to dst, skip it.
			await page.waitForSelector('span.price');
			let prevHeight = 0;
			while (true) {
				await page.evaluate(() => {
					window.scrollTo(0, document.body.scrollHeight);
				});
				await new Promise(resolve => setTimeout(resolve, 2120)); // Wait for some seconds for new contents to load.
//				await page.waitForNetworkIdle({ idleTime: 2000 }); // Time (in milliseconds) the network should be idle.
				const newHeight = await page.evaluate(() => document.body.scrollHeight);
				if (newHeight === prevHeight) break; // Breaking the loop if no new content is loaded.
				prevHeight = newHeight;
			}
			const flightArr = await page.$$('div.flight-list>span>div');
			console.assert(!(await page.evaluate(el => el.innerText, flightArr[flightArr.length - 1])).length); // The last <div></div> is always empty.
			for (const flight of flightArr.slice(0, -1)) {
				if (await flight.$('div.flight-segment-type-group') !== null) {
					console.assert(await flight.$eval('h3', el => el.innerText) === '中转组合');
					break; // 不考虑中转组合
				}
				const price = (await flight.$eval('span.price', el => el.innerText)).slice(1);
				const departTime = await flight.$eval('div.depart-box>div.time', el => el.innerText); // e.g. 08:35
				const departHour = departTime.slice(0, 2); // e.g. 08
				console.log(price, price < 500, departTime, 10 <= departHour && departHour <= 16);
			}
			for (const flight of flightArr) {
				await flight.dispose();
			}
		} else {
			console.error(`${city}: HTTP response status code ${response.status()}`);
		}
	}		
}
await browser.close();
