#!/usr/bin/env node
// This script creates code.json from ../city/code.json. It has to be run once only.
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = JSON.parse(await fs.readFile('../../map/echarts-china-cities-js/geojson/shape-with-internal-borders/city.json'));
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const parentCodeArr = JSON.parse(await fs.readFile(`../city/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: parentCodeArr.length });
for (let j = 0; j < parentCodeArr.length; ++j) {
	const parent = parentCodeArr[j];
	bar.tick({ city: parent.city });
	if (!cityArr.some(city => city.parent === parent.city)) continue;
	const sign = parent.code.endsWith('09') ? -1 : 1; // All parent city codes end with either 01, 00 or 09. Most codes end with 01. Two codes end with 00 (佛山,益阳). One code ends with 09 (湘西).
	let i = parent.city === '江门' ? 2 : parent.city === '汕尾' ? 0 : 1; // 江门的县号02为空页，从03开始。汕尾的县号从01开始。其余都从02开始。
	for (; i < 26; ++i) { // Assuming each parent city has at most 26 county-level cities. 拥有最多区县的地级市是河北保定，辖5个区、15个县，代管4个县级市。 Its county codes start at 02 and end at 26. The iterator starts from 0 instead 1 in order to cover { "parent": "汕尾", "city": "城区" }.
		const code = `${parseInt(parent.code) + sign * i}`;
		const response = await page.goto(`http://www.weather.com.cn/weather/${code}.shtml`, {
			waitUntil: 'domcontentloaded',
			timeout: 6000,
		});
		if (response.ok()) {
			if ((await page.content()).length === 53) break; // When the code becomes invalid, the returned page content becomes '<!-- empty --><html><head></head><body></body></html>', whose length is 53.
			const ctop = await page.$('.left-div .ctop');
			const parentCityFromPage = await ctop.$eval('a:last-of-type', el => el.innerText);
			if (!parent.city.startsWith(parentCityFromPage)) { // In most cases they are equal. The only exception is 湘西土家族苗族自治州 versus 湘西.
				console.error(`${parent.city} does not start with ${parentCityFromPage}`);
				continue;
			}
			const cityFromPage = await ctop.evaluate(ctop => ($('span:not(:contains(>)):not(:contains(|))', ctop).text()), ctop);// The :contains selector is available in jQuery but not in puppeteer's querySelectorAll().
//			const [ cityFromPage ] = await ctop.$$eval('span', spans => spans.map(span => span.innerText).filter(text => !['>', '|'].includes(text))); // Use this alternative statement if jQuery is unavailable.
			await ctop.dispose();
			const city = cityArr.find(city => city.parent === parent.city && city.city.startsWith(cityFromPage)); // In most cases they are equal. The only exception is 湘西土家族苗族自治州 versus 湘西.
//			console.log(parentCityFromPage, cityFromPage, code);
			if (!city) continue; // An example is { "parent": "深圳", "city": "光明", "code": "101280610" }, which is not found in cityArr.
			city.code = code;
		} else {
			console.error(`${parent.city}/${code}: HTTP response status code ${response.status()}`);
		}
	}
};
await browser.close();
['东莞市', '中山市', '湘潭县', '岳阳县'].forEach(county => { // These counties are not found in www.weather.com.cn. Use their parent city's code instead.
	const city = cityArr.find(city => city.city === county);
	console.assert(!city.code); // Code not found.
	city.code = parentCodeArr.find(parent => parent.city === county.slice(0, -1)).code; // Use their parent city's code instead.
});
cityArr.forEach(city => console.assert(city.code, `${city.parent}/${city.city}: code is undefined`));
await fs.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
