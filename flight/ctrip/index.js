#!/usr/bin/env node
// This script only supports prefecture-level cities, because nmc does not provide forecast for every county.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const browser = await puppeteer.launch({
	defaultViewport: { width: 1280, height: 720 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
});
//const cookies = JSON.parse(await fs.promises.readFile(`cookies.txt`));
//await browser.setCookie(...cookies);
await browser.setCookie({
	name: 'cticket',
	value: '2AC336C073459412D0F080D3B34F23B60F955729163EAADEADD1A62F4670E175',
	domain: '.ctrip.com',
	expires: 2147483647,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
await page.setExtraHTTPHeaders({
	'referer': 'https://www.tianqi.com/',
	'accept-language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh;q=0.6',
	'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Linux"',
});
const depDate = '2025-02-14';
const dstArr = ['HAK', 'SYX', 'BAR', 'JHG', 'SYM'];
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: dstArr.length });
for (let i = 0; i < dstArr.length; ++i) {
	const dst = dstArr[i];
	bar.tick({ city: dst });
	let response;
	try {
		response = await page.goto(`https://flights.ctrip.com/online/list/oneway-${dst}-CAN?depdate=${depDate}`);
		// https://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=海口&searchArrivalAirport=广州&searchDepartureTime=2025-02-21
		//https://www.ly.com/flights/itinerary/oneway/CAN-SYX?date=2025-02-05
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		await page.waitForSelector('div.flight-box');
		let prevHeight = 0;
		while (true) {
			console.log('Scrolling');
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight);
			});
			await page.waitForNetworkIdle({ idleTime: 2000 });
			const newHeight = await page.evaluate(() => document.body.scrollHeight);
			if (newHeight === prevHeight) break; // Breaking the loop if no new content is loaded.
			prevHeight = newHeight;
		}
		const boxes = await page.$$('div.flight-box');
		console.log(boxes.length);
		for(const box of boxes) {
			const price = (await box.$eval('span.price', node => node.innerHTML)).slice(12);
			const departTime = await box.$eval('div.depart-box>div.time', node => node.innerHTML);
			const departHour = departTime.slice(0, 2);
			console.log(price, price < 300, departTime, 10 <= departHour && departHour <= 16);
			await box.dispose();
		}
//		const cookies = await browser.cookies();
//		await fs.promises.writeFile(`cookies.txt`, JSON.stringify(cookies, null, '	'))
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
