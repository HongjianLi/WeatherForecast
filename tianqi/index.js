#!/usr/bin/env node
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import util from '../util.js';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 0.862 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
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
const forecastArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	if (i) await new Promise(resolve => setTimeout(resolve, 2520)); // Wait for some seconds between requests to avoid being blocked.
	const { parent, city, code } = codeArr[i];
	bar.tick({ city });
	if (!code) continue; // Skip the city if it has no code.
	let response;
	try {
		response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
			waitUntil: 'domcontentloaded',
		});
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		if (code.includes('-')) {
			const cityFromPage = (await page.$eval('dd.name>h2', el => el.innerText));
			console.assert(cityFromPage.includes(city), `${city} != ${cityFromPage}`);
			const divday7 = await page.$('div.day7');
			const dateArr = await divday7.$$eval('ul.week>li>b', bArr => bArr.map(b => b.innerText));
			console.assert(dateArr.length === 7);
			const weekdayArr = await divday7.$$eval('ul.week>li>span', bArr => bArr.map(b => b.innerText));
			console.assert(weekdayArr.length === 7);
			const descrArr = await divday7.$$eval('ul.txt.txt2>li', liArr => liArr.map(li => li.innerText));
			console.assert(descrArr.length === 7);
			const dayTmpArr = await divday7.$$eval('div.zxt_shuju>ul>li>span', spanArr => spanArr.map(span => span.innerText));
			console.assert(dayTmpArr.length === 7);
			const nightTmpArr = await divday7.$$eval('div.zxt_shuju>ul>li>b', bArr => bArr.map(b => b.innerText));
			console.assert(nightTmpArr.length === 7);
			const forecast = [...Array(7).keys()].map(i => {
				const descArr = descrArr[i].split('转');
				return {
					date: dateArr[i],
					weekday: weekdayArr[i],
					day: {
						tmp: parseInt(dayTmpArr[i]),
						desc: descArr[0],
					},
					night: {
						tmp: parseInt(nightTmpArr[i]),
						desc: descArr[descArr.length - 1],
					},
				};
			});
			forecast.forEach(f => f.uncomfortable = util.isUncomfortable(f));
			forecastArr.push({ city: `${parent ?? ''}${city}`, forecast });
			await divday7.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp` });
			await divday7.dispose();
		} else {
			const cityFromPage = (await page.$eval('div.inleft_place>a.place_b', el => el.innerText)).split(' ')[0];
			console.assert(cityFromPage.includes(city), `${city} != ${cityFromPage}`);
			const c7dul = await page.$('ul.weaul');
			const forecast = await c7dul.$$eval('li', liArr => liArr.map(li => {
				const [ date, weekday, desc, tmp ] = li.innerText.split('\n'); // The li.innerText looks like '11-30\n今天\n多云\n7~17℃' or '12-01\n明天\n晴\n9~22℃'
				const descArr = desc.split('转');
				const tmpArr = tmp.split('~');
				return {
					date,
					weekday,
					day: {
						tmp: parseInt(tmpArr[tmpArr.length - 1]), // The high temperature comes behind the low temperature.
						desc: descArr[0],
					},
					night: {
						tmp: parseInt(tmpArr[0]),
						desc: descArr[descArr.length - 1],
					},
				};
			}));
			forecast.forEach(f => f.uncomfortable = util.isUncomfortable(f));
			forecastArr.push({ city: `${parent ?? ''}${city}`, forecast });
			await c7dul.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp` });
			await c7dul.dispose();
		}
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`); // Status code 403 is usually returned.
	}
};
await browser.close();
console.assert(forecastArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${forecastArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/forecast.json`, JSON.stringify(forecastArr, null, '	'));
