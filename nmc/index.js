#!/usr/bin/env node
// This script only supports prefecture-level cities, because nmc does not provide forecast for every county.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 0.85 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const cityDir = 'city';
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const uncomfortableDaysArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	const { city, parentCode, code } = codeArr[i];
	bar.tick({ city });
	let response;
	try {
		response = await page.goto(`http://www.nmc.cn/publish/forecast/A${parentCode}/${code}.html`, {
			waitUntil: 'load', // Wait for the images and stylesheets to be loaded.
		});
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		const cityFromPage = (await page.$eval('head>title', el => el.innerText)).split('-')[0]; // City's short name, e.g. 广州, 湘西
		console.assert(city === cityFromPage);
		const day7div = await page.$('div#day7');
		await day7div.evaluate(div => {
			$('div:first-of-type', div).removeClass('selected'); // jQuery is used by www.nmc.cn
		}, day7div);
		const uncomfortableDays = await day7div.$$eval('div.weather', divArr => divArr.map(div => { // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 10, the high temperature is below 18 or above 24.
			const parts = div.innerText.split('\n'); // The li.innerText looks like '01/20\n周一\n \n \n \n \n \n16℃\n晴\n无持续风向\n微风' or '01/26\n周日\n阴\n东北风\n3~4级\n20℃\n12℃\n晴\n东北风\n3~4级'
			console.assert([10, 11].includes(parts.length));
			if ([2, parts.length - 3].some(index => parts[index].includes('雨'))) return 1;
			const lowTemperature = parts[parts.length - 4].replace('℃', ''); // The temperatures are strings, not numbers.
			if (lowTemperature < 10) return 1; // When comparing a string with a number, JavaScript will convert the string to a number when doing the comparison.
			if (parts.length === 10) {
				const highTemperature = parts[5].replace('℃', '');
				if (highTemperature < 18 || highTemperature > 24) return 1;
			}
			return 0;
		}).reduce((acc, cur) => { // Sum the number of uncomfortable days.
			return acc + cur;
		}, 0));
		console.assert(uncomfortableDays >= 0 && uncomfortableDays <= 7); // It falls within [0, 7]. A value of 0 means no days are uncomfortable. A value of 7 means all days are uncomfortable.
		uncomfortableDaysArr.push({ city: `${city}`, uncomfortableDays });
		await day7div.screenshot({ path: `${cityDir}/${city}.webp`, clip: { x: 0, y: 8, width: 791, height: 374 } });
		await day7div.dispose();
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
console.assert(uncomfortableDaysArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${uncomfortableDaysArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/uncomfortableDays.json`, JSON.stringify(uncomfortableDaysArr, null, '	'));
