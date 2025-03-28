#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-only/city.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-only/city.json'));
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: cityArr.length });
const code1Arr = ['', '1', '2', '3'];
for (let j = 0; j < cityArr.length; ++j) {
	const city = cityArr[j];
	bar.tick({ city: city.city });
	if (city.code) continue; // Skip cities that already have their codes.
	const code0 = pinyin(city.city, { toneType: 'none', separator: '' });
	for (let i = 0; i < code1Arr.length; ++i) {
		if (i) await new Promise(resolve => setTimeout(resolve, 5100)); // Wait for some seconds.
		const code1 = code1Arr[i];
		const code = `${code0}${code1}`;
		const response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
			waitUntil: 'domcontentloaded',
			timeout: 6000,
		});
		if (response.ok()) {
			const weaone = await page.$('div.weaone');
			const citySNFromPage = (await weaone.$eval('h1', el => el.innerText)).split(' ')[0]; // City's short name, e.g. 广州, 白沙黎族, 阿坝, 湘西
//			const cityLNFromPage = (await weaone.$eval('div.weaone_ba', el => el.innerText)).split('，')[0].split('：')[1]; // City's long name, e.g. 广州市, 白沙黎族自治县, 阿坝县, 湘西土家苗族自治州, which is wrong because it lacks a 族 and should be 湘西土家族苗族自治州. The city's long name retrieved from the page is not reliable.
			await weaone.dispose();
			if (citySNFromPage.startsWith(city.city)/* && cityLNFromPage.startsWith(city.city)*/) {
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
await fs.promises.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
