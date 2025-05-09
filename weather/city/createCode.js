#!/usr/bin/env node
// This script creates code.json from ../../map/echarts-china-cities-js/geojson/shape-only/city.json. It has to be run once only.
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = JSON.parse(await fs.promises.readFile(fs.existsSync('code.json') ? 'code.json' : '../../map/echarts-china-cities-js/geojson/shape-only/city.json'));
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const code0Arr = ['10132', '10133', '10128', '10130', '10125', '10124', '10123', '10131', '10126', '10129', '10104', '10127', '10120', '10122', '10121', '10102', '10119', '10118', '10111', '10116', '10110', '10112', '10109', '10103', '10101', '10117', '10115', '10114', '10108', '10113', '10107', '10106', '10105' ]; // They are the codes of provinces [ '香港', '澳门', '广东', '广西', '湖南', '江西', '福建', '海南', '贵州', '云南', '重庆', '四川', '湖北', '安徽', '浙江', '上海', '江苏', '河南', '陕西', '甘肃', '山西', '山东', '河北', '天津', '北京', '宁夏', '青海', '西藏', '内蒙古', '新疆', '辽宁', '吉林', '黑龙江' ]
const maxNumCities = 21; // Assuming each province has at most 21 cities.
const bar = new ProgressBar('[:bar] :code :current/:total=:percent :elapseds :etas', { total: maxNumCities * code0Arr.length });
for (let k = 0; k < code0Arr.length; ++k) {
	const code0 = code0Arr[k]; // provincial code
	for (let j = 1; j <= maxNumCities; ++j) {
		const code1 = `${j}`.padStart(2, '0'); // city code
		bar.tick({ code: `${code0}${code1}` });
		for (let i = 0; i < 3; ++i) {
			const code2 = ['01', '00', '09', '07', '10'][i]; // All city codes end with either 01, 00, 09, 07, 10. Most codes end with 01. Three codes end with 00 (佛山,益阳,上海). One code ends with 09 (湘西). One code ends with 07 (绍兴). One code ends with 10 (陇南).
			const code = `${code0}${code1}${code2}`; // Combine the three codes to form the full code.
			const response = await page.goto(`http://www.weather.com.cn/weather/${code}.shtml`, {
				waitUntil: 'domcontentloaded',
				timeout: 16000,
			});
			if (response.ok()) {
				if ((await page.content()).length === 53) continue; // When the code becomes invalid, the returned page content becomes '<!-- empty --><html><head></head><body></body></html>', whose length is 53.
				const levelArr = (await page.$eval('div.crumbs.fl', el => el.innerText)).replaceAll('\n', '').split('>');
				if (levelArr.length === 4 && levelArr[3] !== '城区') continue;
				const cityFromPage = levelArr[2];
				const city = cityArr.find(city => city.city === cityFromPage);
				if (!city) continue; // Fetching code 101231001 returns 福建>钓鱼岛>城区, which should be skipped.
				city.code = code;
				break;
			} else {
				console.error(`${code}: HTTP response status code ${response.status()}`);
			}
		}
	}
};
await browser.close();
cityArr.forEach(city => console.assert(city.code, `${city.city}: code is undefined`));
await fs.promises.writeFile(`code.json`, JSON.stringify(cityArr, null, '	'));
