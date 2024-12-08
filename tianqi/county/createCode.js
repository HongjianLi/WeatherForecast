#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json. It has to be run once only.
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.readFile('../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json'));
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
	const code0 = pinyin(city.city.length <= 4 ? city.city : city.city.slice(0, 2), { toneType: 'none', type: 'array' }).join(''); // e.g. 湘桥区, 西乡塘区, 连山壮族瑶族自治县
	for (let i = 0; i < code1Arr.length; ++i) {
		if (i) await new Promise(resolve => setTimeout(resolve, 1200)); // Wait for 1.2 seconds.
		const code1 = code1Arr[i];
		const code = `${code0}${code1}`;
		const response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
			waitUntil: 'domcontentloaded',
			timeout: 6000,
		});
		if (response.ok()) {
			const parentSNFromPage = (await page.$eval('head>meta[name="keywords"]', el => el.content)).split(',')[2].slice(0, -(city.city.length + 6)); // e.g. el.content returns 潮州湘桥区天气预报一周, 湘西吉首市天气预报一周
			const citySNFromPage = (await page.$eval('div.inleft_place>a.place_a[title]', el => el.innerText)).slice(0, -3); // City's short name, e.g. 湘桥, 连南. Do not use 'div.weaone h1' or 'div.inleft_place>a.place_b' because they are sometimes prepended with the parent city name.
			const cityLNFromPage = (await page.$eval('div.weaone div.weaone_ba', el => el.innerText)).split('，')[0].split('：')[1]; // City's long name, e.g. 湘桥区, 连南瑶族自治县
			console.log(city.parent, parentSNFromPage, city.parent.startsWith(parentSNFromPage), citySNFromPage, city.city.startsWith(citySNFromPage), cityLNFromPage, cityLNFromPage.startsWith(city.city), cityLNFromPage === city.city);
			if (city.parent.startsWith(parentSNFromPage) && city.city.startsWith(citySNFromPage)) { // In most cases city === cityFromPage, the only exception is city === 湘西土家族苗族自治州 and cityFromPage === 湘西
				city.code = code;
				break;
			}
		} else {
			console.error(`${code}: HTTP response status code ${response.status()}`);
		}
	}
}
await browser.close();
cityArr.forEach(city => console.assert(city.code, `${city.parent}/${city.city}: code is undefined`));
await fs.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
