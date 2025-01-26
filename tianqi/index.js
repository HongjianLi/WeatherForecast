#!/usr/bin/env node
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 1.0141 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
const cityDir = process.argv.length > 2 ? process.argv[2] : 'city';
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const uncomfortableDaysArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	if (i) await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds between requests.
	const { parent, city, code } = codeArr[i];
	bar.tick({ city });
	if (!code) continue; // Skip the city if it has no code.
	let response;
	try {
		response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
			waitUntil: 'load',
		});
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		const cityFromPage = (await page.$eval('div.inleft_place>a.place_b', el => el.innerText)).split(' ')[0];
		console.assert(city.startsWith(cityFromPage), `${city} != ${cityFromPage}`); // In most cases city === cityFromPage, the only exception is city === 湘西土家族苗族自治州 and cityFromPage === 湘西
		const c7dul = await page.$('ul.weaul');
		const uncomfortableDays = await c7dul.$$eval('li', liArr => liArr.map(li => { // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 10, the high temperature is below 18 or above 24.
			const [ date, day, weather, temperature ] = li.innerText.split('\n'); // The li.innerText looks like '11-30\n今天\n多云\n7~17℃' or '12-01\n明天\n晴\n9~22℃'
			if (['雨', '雾', '霾'].some(keyword => weather.includes(keyword))) return 1;
			const [ lowTemperature, highTemperature ] = temperature.replaceAll('℃', '').split('~'); // The temperatures are strings, not numbers.
			if (lowTemperature < 10 || highTemperature < 18 || highTemperature > 24) return 1; // When comparing a string with a number, JavaScript will convert the string to a number when doing the comparison.
			return 0;
		}).reduce((acc, cur) => { // Sum the number of uncomfortable days.
			return acc + cur;
		}, 0));
		console.assert(uncomfortableDays >= 0 && uncomfortableDays <= 7); // It falls within [0, 7]. A value of 0 means no days are uncomfortable. A value of 7 means all days are uncomfortable.
		uncomfortableDaysArr.push({ city: `${parent ?? ''}${city}`, uncomfortableDays });
		await c7dul.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp` });
		await c7dul.dispose();
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`); // Status code 403 is usually returned.
	}
};
await browser.close();
console.assert(uncomfortableDaysArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${uncomfortableDaysArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/uncomfortableDays.json`, JSON.stringify(uncomfortableDaysArr, null, '	'));
