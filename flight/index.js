#!/usr/bin/env node
// This script only supports prefecture-level cities, because nmc does not provide forecast for every county.
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const monday = new Date();
for (var nDaysAhead = 0; monday.getDay() !== 1; ++nDaysAhead) monday.setDate(monday.getDate() + 1); // Find the nearest Monday.
const depDate = monday.toISOString().slice(0, 10);
console.log(`Departing on ${depDate}, i.e. ${nDaysAhead} days ahead`);
const airports = JSON.parse(await fs.readFile('airports.json'));
const dstArr = [].concat(...JSON.parse(await fs.readFile(`../weather/city/uncomfortableDays.json`))/*.slice(23)*/.filter(city => { // The first 23 cities are 香港, 澳门 and 广东21市. 无须飞机航班，乘坐高铁即可。
	const uncomfortableDays = city.uncomfortableDays.slice(nDaysAhead); // Skip dates before departure.
	if (uncomfortableDays[0]) return false; // If the departure date is uncomfortable, skip it.
	return uncomfortableDays.slice(1).reduce((acc, cur) => { // Sum the number of uncomfortable days after departure, and restrict the sum equal to or below 1.
		return acc + cur;
	}, 0) <= 2;
}).map(city => airports[city.city]).filter(airport => airport));
console.log(dstArr);
const siteArr = [{
	provider: 'ly',
	url: 'https://www.ly.com/flights/itinerary/oneway/{src}-{dst}?date={depDate}', // It shows direct flights only.
	selector: {
		'no-flight': 'div.flight-no-data',
		'flight-list': 'div.flight-lists-container>div.flight-item',
	},
	extract: async flightList => {
		for (const flight of flightList) {
			const price = (await flight.$eval('div.head-prices>strong>em', el => el.innerText)).slice(1); // .slice(1) to filter out the currency symbol ￥.
			const departTime = await flight.$eval('div.f-startTime>strong', el => el.innerText); // e.g. 08:35
			const departHour = departTime.slice(0, 2); // e.g. 08
			console.log('ly', price, price < 500, departTime, 10 <= departHour && departHour <= 16);
		}
	},
}, {
	provider: 'ctrip',
	url: 'https://flights.ctrip.com/online/list/oneway-{src}-{dst}?depdate={depDate}', // It shows transit flights too.
	selector: {
		'no-flight': 'div.no-flights',
		'flight-list': 'div.flight-list>span>div',
	},
	extract: async flightList => {
//		console.assert(!(await flightList[0].evaluate(el => el.innerText, flightList[flightList.length - 1])).length); // The last <div></div> is always empty.
		for (let i = 0; i < flightList.length - 1; ++i) {
			const flight = flightList[i];
			if (await flight.$('div.flight-segment-type-group') !== null) {
				console.assert(await flight.$eval('h3', el => el.innerText) === '中转组合');
				break; // 不考虑中转组合
			}
			const price = (await flight.$eval('span.price', el => el.innerText)).slice(1); // .slice(1) to filter out the currency symbol ￥.
			const departTime = await flight.$eval('div.depart-box>div.time', el => el.innerText); // e.g. 08:35
			const departHour = departTime.slice(0, 2); // e.g. 08
			console.log('ctrip', price, price < 500, departTime, 10 <= departHour && departHour <= 16);
		}
	},
}, {
	provider: 'qunar',
	url: 'https://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport={src}&searchArrivalAirport={dst}&searchDepartureTime={depDate}', // It shows transit flights too. It uses pagation, so scrolling down will only shows the first page.
	selector: {
		'no-flight': 'div.m-load',
		'flight-list': 'div.m-airfly-lst>div.b-airfly',
	},
	extract: async flightList => {
		for (const flight of flightList) {
			const price = (await flight.$eval('span', el => el.innerText)).slice(1); // .slice(1) to filter out the currency symbol ￥.
			const departTime = await flight.$eval('div.sep-lf>h2', el => el.innerText); // e.g. 08:35
			const departHour = departTime.slice(0, 2); // e.g. 08
			console.log('qunar', price, price < 500, departTime, 10 <= departHour && departHour <= 16);
		}
	},
}];
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
	'accept-language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh;q=0.6',
	'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Linux"',
});
const srcArr = ['CAN', 'SZX'/*, 'CTU', 'TFU'*/];
const bar = new ProgressBar('[:bar] :dst :current/:total=:percent :elapseds :etas', { total: dstArr.length });
for (const dst of dstArr) {
	bar.tick({ dst });
	for (const src of srcArr) {
		console.log(`${depDate}: ${src}-${dst}`);
		const replacements = { src, dst, depDate };
//		for (const site of siteArr) {
		const site = siteArr[0];
		let response;
		try {
			response = await page.goto(site.url.replace(/{(\w+)}/g, (match, p1) => replacements[p1] || match), { waitUntil: 'networkidle0'} );
		} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
			console.error(`${site.provider}@${depDate}: ${src}-${dst}: page.goto() error ${error}`);
			continue;
		}
		if (response.ok()) {
			const noFlights = await page.$(site.selector['no-flight']);
			if (noFlights !== null) { await noFlights.dispose(); continue }; // If no flights from src to dst, skip it.
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
			const flightList = await page.$$(site.selector['flight-list']);
			if (!flightList.length) continue;
			await site.extract(flightList);
			for (const flight of flightList) {
				await flight.dispose();
			}
		} else {
			console.error(`${city}: HTTP response status code ${response.status()}`);
		}
//		}
	}		
}
await browser.close();
