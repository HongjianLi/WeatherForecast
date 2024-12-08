#!/usr/bin/env node
import fs from 'fs';
import { Readable } from 'stream';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const today = new Date();
const localeDateString = [ today.getFullYear(), today.getMonth() + 1, today.getDate() ].map((component) => {
	return component.toString().padStart(2, '0');
}).join("");
const hours = today.getHours();
for (var hourIndex = 0; !(hours < [18, 24][hourIndex]); ++hourIndex);
const urlReplaceValue = localeDateString + ['08','20'][hourIndex];
await Promise.all([
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_00000-02400_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_02400-04800_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_04800-07200_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_04800-07200_1920.png',
].map(async (url, urlIndex) => {
	const response = await fetch(url.replace('{}', urlReplaceValue));
	if (!response.ok) return;
	Readable.fromWeb(response.body).pipe(fs.createWriteStream(url.split('/').pop()));
}));
await fs.promises.writeFile('index.html', [
	'<!DOCTYPE html>',
	'<html>',
	'<body>',
	'<img src="cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_00000-02400_1920.jpg" width="671">',
	'<img src="cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_02400-04800_1920.jpg" width="671">',
	'<img src="cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_04800-07200_1920.jpg" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_00000-02400_1920.png" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_02400-04800_1920.png" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_04800-07200_1920.png" width="671">',
	'</body>',
	'</html>',
].join('\n'));
const browser = await puppeteer.launch({
	headless: 'new',
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 1.2 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const cityDir = process.argv.length > 2 ? process.argv[2] : 'city';
const citySelector = `.left-div .ctop ${cityDir === 'city' ? 'a:last-of-type' : 'span:not(:contains(>)):not(:contains(|))'}` // The prefecture-level city is located in the last <a>, whereas the count-level city is located in the <span> whose content is not > and |.
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const uncomfortableDaysArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	const { parent, city, code } = codeArr[i]; // parent is undefined if cityDir === 'city'. parent is the prefecture-level city if cityDir === 'county'.
	bar.tick({ city });
	let response;
	try {
		response = await page.goto(`http://www.weather.com.cn/weather/${code}.shtml`, { // Updates occur at 5:30, 7:30, 11:30, 18:00 everyday.
			waitUntil: 'load', // Wait for the images and stylesheets to be loaded.
			timeout: 9000,
		});
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		const cityFromPage = await page.evaluate((selector) => ($(selector).text()), citySelector); // cityFromPage is always in short form, i.e. not ending with '市', '区', '县'. The only exception is '城区'.
		if (!city.startsWith(cityFromPage)) { // In most cases city === cityFromPage. An exception is city === 湘西土家族苗族自治州 and cityFromPage === 湘西. Another exceptions are city === ['东莞市', '中山市', '湘潭县', '岳阳县'] and cityFromPage === '城区'.
			if (cityDir === 'city') {
				console.error(`${city} !== ${cityFromPage}`);
				continue;
			} else {
				console.assert(cityFromPage === '城区');
				console.assert(['东莞市', '中山市', '湘潭县', '岳阳县'].includes(city)); // These counties are not found in www.weather.com.cn, therefore their parent city's code are used instead.
			}
		}
		const c7dul = await page.$('.c7d ul');
		if (await c7dul.isHidden()) {
			console.assert(parent === '株洲' && city === '渌口区'); // The page for 渌口, http://www.weather.com.cn/weather/101250310.shtml, does not contain 7-day weather forecast, so c7dul is hidden.
			continue;
		}
		await c7dul.evaluate(ul => {
			$('li:first-of-type', ul).removeClass('on'); // jQuery is used by www.weather.com.cn
		}, c7dul);
		const uncomfortableDays = await c7dul.$$eval('li', liArr => liArr.map(li => { // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 10, the high temperature is below 18 or above 24.
			console.log(li.innerText);
			const [ date, weather, temperature ] = li.innerText.split('\n\n'); // The li.innerText looks like '30日（今天）\n\n多云\n\n12℃\n\n<3级' or '1日（明天）\n\n晴\n\n24℃/14℃\n\n \n<3级'
			if (weather.includes('雨')) return 1;
			const temperatureArr = temperature.replaceAll('℃', '').split('/'); // The temperatures are strings, not numbers.
			if (temperatureArr.length === 1) {
				const [ lowTemperature ] = temperatureArr;
				if (lowTemperature < 10) return 1;
			} else {
				const [ highTemperature, lowTemperature ] = temperatureArr;
				if (lowTemperature < 10 || highTemperature < 18 || highTemperature > 24) return 1; // When comparing a string with a number, JavaScript will convert the string to a number when doing the comparison.
			}
			return 0;
		}).reduce((acc, cur) => { // Sum the number of uncomfortable days.
			return acc + cur;
		}, 0));
		console.assert(uncomfortableDays >= 0 && uncomfortableDays <= 7); // It falls within [0, 7]. A value of 0 means no days are uncomfortable. A value of 7 means all days are uncomfortable.
		uncomfortableDaysArr.push({ city: `${parent ?? ''}${city}`, uncomfortableDays });
		await c7dul.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp`, clip: { x: 0, y: 0, width: 656, height: 254 } });
		await c7dul.dispose();
/*		await fs.promises.writeFile(`${cityDir}/${parent ?? ''}${city}.html`, [
			'<!DOCTYPE html>',
			'<html>',
			'<body>',
			'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2017/headStyle_1.css">',
			'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2015/common.css">',
			'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2015/bluesky/c_7d.css">',
			'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2019/weather1d.css">',
			'<div class="con today clearfix">',
			'<div class="left fl">',
			'<div class="left-div">',
			await page.$eval('.left-div .ctop', el => el.outerHTML),
			'<div id="7d" class="c7d">',
			await page.$eval('.left-div .c7d .t', el => el.outerHTML),
			'</div>',
			'</div>',
			'</div>',
			'</div>',
			'</body>',
			'</html>',
		].join('\n'));*/
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
console.assert(uncomfortableDaysArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${uncomfortableDaysArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/uncomfortableDays.json`, JSON.stringify(uncomfortableDaysArr, null, '	'));
