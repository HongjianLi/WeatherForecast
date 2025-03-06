#!/usr/bin/env node
// This script creates code.json from ../city/code.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json'));
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const parentCodeArr = JSON.parse(await fs.promises.readFile(`../city/code.json`));
['东莞', '中山', '湘潭', '岳阳', '楚雄', '大理', '红河', '文山', '阿坝', '甘孜', '广安', '恩施', '荆州', '潜江', '天门', '神农架', '仙桃'].forEach(county => { // 湘潭县 and 岳阳县 are not found in www.weather.com.cn. The other counties are actually their prefecture-level cities. Use their parent city's code instead.
	const city = cityArr.find(city => city.city === county);
	city.code = parentCodeArr.find(parent => parent.city === county).code; // Use their parent city's code instead.
});
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: parentCodeArr.length });
for (let j = 0; j < parentCodeArr.length; ++j) {
	const parent = parentCodeArr[j];
	bar.tick({ city: parent.city });
	console.assert(cityArr.some(city => city.parent === parent.city), `No county has its parent city of ${parent.city}`);
	if (cityArr.every(city => city.parent === parent.city ? city.code : true)) continue; // Skip this parent city if its every county already has code.
	const prefix = parent.code.slice(0, -2);
	for (let i = 0; i < 26; ++i) { // Assuming each parent city has at most 26 county-level cities. 拥有最多区县的地级市是河北保定，辖5个区、15个县，代管4个县级市。 Its county codes start at 02 and end at 26. The iterator starts from 0 instead 1 in order to cover { "parent": "汕尾", "city": "城区" }.
		const code = `${prefix}${i.toString().padStart(2, '0')}`;
		const response = await page.goto(`http://www.weather.com.cn/weather/${code}.shtml`, {
			waitUntil: 'domcontentloaded',
			timeout: 6000,
		});
		if (response.ok()) {
			if ((await page.content()).length === 53) continue; // When the code becomes invalid, the returned page content becomes '<!-- empty --><html><head></head><body></body></html>', whose length is 53.
			const levelArr = (await page.$eval('div.crumbs.fl', el => el.innerText)).replaceAll('\n', '').split('>');
			console.assert([3, 4].includes(levelArr.length));
			const parentCityFromPage = levelArr[levelArr.length - 2];
			console.assert(parent.city === parentCityFromPage || parentCityFromPage === '海南', `${code}: ${parent.city} !== ${parentCityFromPage}`); // The parentCityFromPage is unreliable for 海南 counties, e.g. levelArr = ['全国', '海南', '崖州'] omits the real parent city of 三亚
			const cityFromPage = levelArr[levelArr.length - 1];
			const city = cityArr.find(city => city.parent === parent.city && city.city === cityFromPage);
			if (!city) continue; // An example is { "parent": "深圳", "city": "光明", "code": "101280610" }, which is not found in cityArr.
			city.code = code;
		} else {
			console.error(`${parent.city}/${code}: HTTP response status code ${response.status()}`);
		}
	}
};
await browser.close();
cityArr.forEach(city => console.assert(city.code, `${city.parent}/${city.city}: code is undefined`));
await fs.promises.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
