#!/usr/bin/env node
// This script only supports prefecture-level cities, because nmc does not provide forecast for every county.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import util from '../util.js';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 0.85 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const cityDir = 'city';
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const forecastArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	const { city, parentCode, code } = codeArr[i];
	bar.tick({ city });
	if (!code) continue; // 新疆双河 is not found in nmc.
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
		console.assert(city === cityFromPage || (city === '锡林郭勒盟' && cityFromPage === '锡林郭勒') || (city === '克孜勒苏' && cityFromPage === '克州') || (city === '吉林' && cityFromPage === '吉林乌拉'));
		const day7div = await page.$('div#day7');
		await day7div.evaluate(div => {
			$('div:first-of-type', div).removeClass('selected'); // jQuery is used by www.nmc.cn
		}, day7div);
		const forecast = await day7div.$$eval('div.weather', divArr => divArr.map(div => {
			const parts = div.innerText.split('\n').filter(part => part.trim()); // The li.innerText looks like '01/26\n周日\n阴\n东北风\n3~4级\n20℃\n12℃\n晴\n东北风\n3~4级' or '01/20\n周一\n \n \n \n \n \n16℃\n晴\n无持续风向\n微风'
			const n = parts.length;
			console.assert(n === 10 || n === 6);
			return {
				date: parts[0],
				weekday: parts[1],
				day: n === 10 ? { // 08:00~20:00
					desc: parts[2],
					windd: parts[3],
					winds: parts[4],
					tmp: parseInt(parts[5]/*.replace('℃', '')*/), // parseInt() will automatically discard the '℃' symbol.
				} : undefined,
				night: { // 20:00~08:00
					tmp: parseInt(parts[n - 4]/*.replace('℃', '')*/),
					desc: parts[n - 3],
					windd: parts[n - 2],
					winds: parts[n - 1],
				},
			};
		}));
		const date = new Date();
		forecast.forEach(f => {
			const dateStr = date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'});
			console.assert(f.date === dateStr.slice(5).replace('-', '/'));
			f.date = dateStr;
			console.assert(f.weekday === `周${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`);
			date.setDate(date.getDate() + 1);
			f.uncomfortable = util.isUncomfortable(f);
		});
		forecastArr.push({ city, forecast });
		await day7div.screenshot({ path: `${cityDir}/${city}.webp`, clip: { x: 0, y: 8, width: 791, height: 374 } });
		await day7div.dispose();
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
console.assert(forecastArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${forecastArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/forecast.json`, JSON.stringify(forecastArr, null, '	'));
