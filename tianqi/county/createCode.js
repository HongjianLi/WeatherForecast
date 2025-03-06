#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json'));
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: cityArr.length });
const code1Arr = ['', 'xian', 'qu', 'shi', '1', '2', '3'];
for (let k = 0; k < cityArr.length; ++k) {
	const city = cityArr[k];
	bar.tick({ city: city.city });
	if (city.code) continue; // Skip cities that already have their codes.
	const city0Arr = [''/*, '市', '区', '县'*/].map(suffix => `${city.city}${suffix}`);
	for (let j = 0, found = false; j < city0Arr.length && !found; ++j) {
		const city0 = city0Arr[j];
		const code0 = pinyin(city0, { toneType: 'none', separator: '' }).replaceAll('dou', 'du'); // When the city name contains 都, e.g. 花都,都安,于都,宁都,都昌,都匀,三都,成都,丰都,曾都,宜都, its pinyin is always du, but pinyin() always returns dou.
		for (let i = 0; i < code1Arr.length; ++i) {
			await new Promise(resolve => setTimeout(resolve, 2100)); // Wait for some seconds.
			const code1 = code1Arr[i];
			const code = `${code0}${code1}`;
			const response = await page.goto(`https://www.tianqi.com/${code}/7/`, {
				waitUntil: 'domcontentloaded'
			});
			if (response.ok()) {
				let matched = false;
				const place_a = await page.$('div.inleft_place>a.place_a[title]');
				if (place_a) {
					const citySNFromPage = (await place_a.evaluate(el => el.innerText)).slice(0, -3); // City's short name, e.g. 湘桥, 连南. Do not use 'div.weaone h1' or 'div.inleft_place>a.place_b' because they are sometimes prepended with the parent city name.
					await place_a.dispose();
					const parentSNFromPage = (await page.$eval('head>meta[name="keywords"]', el => el.content)).split(',')[2].slice(0, -(city.city.length + 6)); // e.g. el.content returns 潮州湘桥区天气预报一周, 湘西吉首市天气预报一周. Do not use page.title() or <meta name="description"> because they are sometimes not prepended with the parent city name.
//					const cityLNFromPage = (await page.$eval('div.weaone div.weaone_ba', el => el.innerText)).split('，')[0].split('：')[1]; // City's long name, e.g. 湘桥区, 连南瑶族自治县
//					console.log(code, city.parent, parentSNFromPage, parentSNFromPage.startsWith(city.parent), city.city, citySNFromPage, citySNFromPage.startsWith(city.city));
					matched = citySNFromPage.startsWith(city.city) && parentSNFromPage.startsWith(city.parent);
				} else { // The page was redirected.
					const citySNFromPage = await page.$eval('dd.name>h2', el => el.innerText); // For some counties, e.g. 象山, 津市, 盘州, the page will be redirected, where the city name has to be retrieved from another selector.
					const culture = await page.$eval('div.city_culture', el => el.innerText); // 城市文化，多次出现地级市名
					const parentCityOccurenceCount = (culture.length - culture.replaceAll(city.parent, '').length) / city.parent.length; // 计算出现次数
					matched = citySNFromPage.startsWith(city.city) && parentCityOccurenceCount >= 6;
				}
				if (matched) {
					city.code = code;
					found = true;
					break;
				}
			} else {
				console.error(`${code}: HTTP response status code ${response.status()}`);
			}
		}
	}
}
await browser.close();
cityArr.forEach(city => console.assert(city.code, `${city.parent}/${city.city}: code is undefined`)); // 福州/鼓楼 is undefined. Use 福州 instead.
await fs.promises.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
