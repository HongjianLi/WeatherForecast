#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-only/city.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-only/city.json'));
console.assert(cityArr.length === 71); // 合共71市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: cityArr.length });
for (let i = 0; i < cityArr.length; ++i) {
	const city = cityArr[i];
	bar.tick({ city: city.city });
	if (city.code) continue; // Skip cities that already have their codes.
	const code = pinyin(city.city.length <= 4 ? city.city : city.city.slice(0, 2), { toneType: 'none', separator: '' }); // The only city whose length > 4 is 湘西土家族苗族自治州.
	for (var parentIndex = 0; !(i < [1, 2, 23, 37, 51, 62, 71][parentIndex]); ++parentIndex);
	const parentCode = pinyin(['香港', '澳门', '广东', '广西', '湖南', '江西', '福建'][parentIndex], { pattern: 'first', toneType: 'none', separator: '' }).toUpperCase();
	const response = await page.goto(`http://www.nmc.cn/publish/forecast/A${parentCode}/${code}.html`, { // Only two exceptions are 东莞 and 深圳, whose codes are dongzuo and shenzuo.
		waitUntil: 'domcontentloaded',
		timeout: 6000,
	});
	if (response.ok()) {
		const cityFromPage = (await page.$eval('head>title', el => el.innerText)).split('-')[0]; // City's short name, e.g. 广州, 湘西
		if (city.city.startsWith(cityFromPage)) {
			city.code = code;
			city.parentCode = parentCode;
		}
	} else {
		console.error(`${code}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
cityArr.forEach(city => console.assert(city.code && city.parentCode, `${city.city}: code or parentCode is undefined`));
await fs.promises.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
