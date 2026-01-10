#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-only/city.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import { pinyin } from 'pinyin-pro';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-only/city.json'));
console.assert(cityArr.length === 367); // 合共367市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市 + 海南18市 + 贵州9市 + 云南16市 + 重庆1市 + 四川21市 + 湖北17市 + 安徽16市 + 浙江11市 + 上海1市 + 江苏13市 + 河南18市 + 陕西10市 + 甘肃14市 + 山西11市 + 山东16市 + 河北11市 + 天津1市 + 北京1市 + 宁夏5市 + 青海8市 + 西藏7市 + 内蒙古12市 + 新疆23市 + 辽宁14市 + 吉林9市 + 黑龙江13市
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
	const code = pinyin(city.city, { toneType: 'none', separator: '' });
	for (var parentIndex = 0; !(i < [1, 2, 23, 37, 51, 62, 71, 89, 98, 114, 115, 136, 153, 169, 180, 181, 194, 212, 222, 236, 247, 263, 274, 275, 276, 281, 289, 296, 308, 331, 345, 354, 367][parentIndex]); ++parentIndex);
	const parentCode = ['XG', 'AM', 'GD', 'GX', 'HN', 'JX', 'FJ', 'HI', 'GZ', 'YN', 'CQ', 'SC', 'HB', 'AH', 'ZJ', 'SH', 'JS', 'HA', 'SN', 'GS', 'SX', 'SD', 'HE', 'TJ', 'BJ', 'NX', 'QH', 'XZ', 'NM', 'XJ', 'LN', 'JL', 'HL'][parentIndex]; // The pinyin initials of 湖南, 海南, 河南 are HN. To distinguish, their codes are HN, HI, HA. The pinyin initials of 山西, 陕西 are SX. To distinguish, their codes are SX, SN.
	const response = await page.goto(`http://www.nmc.cn/publish/forecast/A${parentCode}/${code}.html`, { // Exceptions are ['东莞', '深圳', '儋州', '重庆', '泸州'], whose codes are ['dongzuo', 'shenzuo', 'zuozhou', 'zhongqing', 'zuozhou'].
		waitUntil: 'domcontentloaded',
		timeout: 6000,
	});
	if (response.ok()) {
		const cityFromPage = (await page.$eval('head>title', el => el.innerText)).split('-')[0]; // City's short name, e.g. 广州, 湘西
		if (city.city === cityFromPage) {
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
