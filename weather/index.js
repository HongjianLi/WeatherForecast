#!/usr/bin/env node
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 1.025 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const cityDir = process.argv.length > 2 ? process.argv[2] : 'city';
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const uncomfortableDaysArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	const { parent, city, code } = codeArr[i]; // parent is undefined if cityDir === 'city'. parent is the prefecture-level city if cityDir === 'county'.
	bar.tick({ city });
	let response;
	try {
		response = await page.goto(`http://www.weather.com.cn/weather/${code}.shtml`, { // Updates occur at 5:30, 7:30, 11:30, 18:00 everyday.
			waitUntil: 'load', // Wait for the images and stylesheets to be loaded.
		});
	} catch (error) { // In case of error, e.g. TimeoutError, continue to goto the next city.
		console.error(`${city}: page.goto() error ${error}`);
		continue;
	}
	if (response.ok()) {
		const levelArr = (await page.$eval('div.crumbs.fl', el => el.innerText)).replaceAll('\n', '').split('>');
		console.assert([3, 4].includes(levelArr.length));
		if (cityDir === 'city') {
			const cityFromPage = ['香港', '澳门', '重庆', '上海'].includes(levelArr[1]) ? levelArr[1] : levelArr[2]; // cityFromPage is always in short form, i.e. not ending with '市', '区', '县'.
			if (levelArr.length === 4) console.assert(levelArr[3] === '城区');
			console.assert(city === cityFromPage, `${city} !== ${cityFromPage}`);
		} else {
			const cityFromPage = levelArr[levelArr.length - 1];
			console.assert(
				(cityFromPage.startsWith(city)) || // This is the majority case.
				(cityFromPage === '城区' && ['香港', '澳门', '东莞', '中山', '湘潭', '岳阳', '楚雄', '大理', '红河', '文山', '阿坝', '甘孜', '广安', '恩施', '荆州', '潜江', '天门', '神农架', '仙桃'].includes(city)) || // These counties are not found in www.weather.com.cn, therefore their parent city's code are used instead.
				(cityFromPage === '宜宾县' && city === '叙州') || // 宜宾县 was renamed to 叙州区
				(cityFromPage === '芜湖县' && city === '湾沚')    // 芜湖县 was renamed to 湾沚区
			, `${city} !== ${cityFromPage}`);
		}
		const c7dul = await page.$('.c7d ul');
		if (await c7dul.isHidden()) {
			console.assert(parent === '株洲' && city === '渌口', `c7dul.isHidden() returned true for ${city}`); // The page for county-level city 渌口, http://www.weather.com.cn/weather/101250310.shtml, does not contain 7-day weather forecast, so c7dul is hidden.
			continue;
		}
		await c7dul.evaluate(ul => {
			$('li:first-of-type', ul).removeClass('on'); // jQuery is used by www.weather.com.cn
		}, c7dul);
		const uncomfortableDays = await c7dul.$$eval('li', liArr => liArr.map(li => { // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 10, the high temperature is below 18 or above 24.
			if (li.classList.contains('lv4')) return 1; // lv1: 天空蔚蓝, lv2: 天空淡蓝, lv3: 天空阴沉, lv4: 天空灰霾
			const [ date, weather, temperature ] = li.innerText.split('\n\n'); // The li.innerText looks like '30日（今天）\n\n多云\n\n12℃\n\n<3级' or '1日（明天）\n\n晴\n\n24℃/14℃\n\n \n<3级'
			if (weather.includes('雨')) return 1;
			const temperatureArr = temperature.replaceAll('℃', '').split('/'); // The temperatures are strings, not numbers.
			if (temperatureArr.length === 1) {
				const [ lowTemperature ] = temperatureArr;
				if (lowTemperature < 10) return 1;
			} else {
				const [ highTemperature, lowTemperature ] = temperatureArr;
				if (lowTemperature < 10 || highTemperature < 18 || highTemperature > 24) return 1; // When comparing a string with a number, JavaScript will convert the string to a number when doing the comparison.
			}
			return 0;
		}));
		uncomfortableDaysArr.push({ city: `${parent ?? ''}${city}`, uncomfortableDays });
		await c7dul.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp`, clip: { x: 0, y: 0, width: 656, height: 254 } });
		await c7dul.dispose();
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
}
await browser.close();
console.assert(uncomfortableDaysArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${uncomfortableDaysArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/uncomfortableDays.json`, JSON.stringify(uncomfortableDaysArr, null, '	'));
