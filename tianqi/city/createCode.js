#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-only/city.json. It has to be run once only.
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.readFile('../../map/echarts-china-cities-js/geojson/shape-only/city.json'));
const browser = await puppeteer.launch({
	headless: 'new',
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: cityArr.length });
const code1Arr = ['', '1', '2', '3'];
for (let j = 0; j < cityArr.length; ++j) {
	const city = cityArr[j];
	bar.tick({ city: city.city });
	const code0 = pinyin(city.city.length <= 4 ? city.city : city.city.slice(0, 2), { toneType: 'none', type: 'array' }).join(''); // The only city whose length > 4 is 湘西土家族苗族自治州.
	for (let i = 0; i < code1Arr.length; ++i) {
		if (i) await new Promise(resolve => setTimeout(resolve, 1200)); // Wait for 1.2 seconds.
		const code1 = code1Arr[i];
		const code = `${code0}${code1}`;
		const response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
			waitUntil: 'domcontentloaded',
			timeout: 6000,
		});
		if (response.ok()) {
			const weaone = await page.$('div.weaone');
			const citySNFromPage = (await weaone.$eval('h1', el => el.innerText)).split(' ')[0]; // City's short name, e.g. 广州, 湘西
//			const cityLNFromPage = (await weaone.$eval('div.weaone_ba', el => el.innerText)).split('，')[0].split('：')[1]; // City's long name, e.g. 广州市, 湘西土家苗族自治州, which is wrong because it lacks a 族 and should be 湘西土家族苗族自治州. The city's long name retrieved from the page is not reliable.
			await weaone.dispose();
			if (city.city.startsWith(citySNFromPage)/* && cityLNFromPage.startsWith(city.city)*/) {
				city.code = code;
				break;
			}
		} else {
			console.error(`${code}: HTTP response status code ${response.status()}`);
		}
	}
}
await browser.close();
cityArr.forEach(city => console.assert(city.code, `${city.city}: code is undefined`));
await fs.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
