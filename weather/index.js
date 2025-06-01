#!/usr/bin/env node
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
import util from '../util.js';
const browser = await puppeteer.launch({
	defaultViewport: { width: 3840, height: 2160, deviceScaleFactor: 1.025 }, // Increase the deviceScaleFactor will increase the resolution of screenshots.
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const cityDir = process.argv.length > 2 ? process.argv[2] : 'city';
const codeArr = JSON.parse(await fs.promises.readFile(`${cityDir}/code.json`));
const bar = new ProgressBar('[:bar] :city :current/:total=:percent :elapseds :etas', { total: codeArr.length });
const forecastArr = [];
for (let i = 0; i < codeArr.length; ++i) {
	const { parent, city, code } = codeArr[i]; // parent is undefined if cityDir === 'city'. parent is the prefecture-level city if cityDir === 'county'.
	bar.tick({ city });
	for (let k = 0; k < 2; ++k) { // Retry in case of TimeoutError.
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
				console.assert(levelArr[levelArr.length - 1] === '城区' || (levelArr.length === 3 && levelArr[1] === '海南'));
				const cityFromPage = levelArr.length === 3 && ['香港', '澳门', '重庆', '上海', '天津', '北京', '吉林'].includes(levelArr[1]) ? levelArr[1] : levelArr[2]; // cityFromPage is always in short form, i.e. not ending with '市', '区', '县'.
				console.assert(city === cityFromPage || (city === '锡林郭勒盟' && cityFromPage === '锡林郭勒') || (city === '克孜勒苏' && cityFromPage === '克州'), `${city} !== ${cityFromPage}`);
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
				break;
			}
			await c7dul.evaluate(ul => {
				$('li:first-of-type', ul).removeClass('on'); // jQuery is used by www.weather.com.cn
			}, c7dul);
			const forecast = await c7dul.$$eval('li', liArr => liArr.map(li => {
				const [ date, desc, tmp, wind ] = li.innerText.split('\n').filter(part => part.trim()); // The li.innerText looks like '1日（明天）\n\n晴\n\n24℃/14℃\n\n \n<3级' or '30日（今天）\n\n多云\n\n12℃\n\n<3级'
				const dateArr = date.split('（');
				const tmpArr = tmp.split('/');
				const descArr = desc.split('转');
				const windsArr = wind.split('转');
				const winddArr = [];
				li.querySelectorAll('p.win span').forEach(span => winddArr.push(span.getAttribute('title')));
				return {
					date: dateArr[0],
					weekday: dateArr[1].substring(0, 2),
					day: winddArr.length === 2 ? {
						tmp: parseInt(tmpArr[0]),
						desc: descArr[0],
						winds: windsArr[0],
						windd: winddArr[0],
					} : undefined,
					night: {
						tmp: parseInt(tmpArr[tmpArr.length - 1]),
						desc: descArr[descArr.length - 1],
						winds: windsArr[windsArr.length - 1],
						windd: winddArr[winddArr.length - 1],
					},
					sky: {
						lv1: '天空蔚蓝',
						lv2: '天空淡蓝',
						lv3: '天空阴沉',
						lv4: '天空灰霾',
					}[li.classList[2]],
				};
			}));
			const date = new Date();
			forecast.forEach((f, i) => {
				console.assert(f.date === `${date.getDate()}日`);
				f.date = date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'});
				const weekday = `周${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`;
				console.assert(f.weekday === i < 3 ? ['今天', '明天', '后天'][i] : weekday);
				f.weekday = weekday;
				date.setDate(date.getDate() + 1);
				f.uncomfortable = util.isUncomfortable(f);
			});
			forecastArr.push({ city: `${parent ?? ''}${city}`, forecast });
//			await c7dul.screenshot({ path: `${cityDir}/${parent ?? ''}${city}.webp`, clip: { x: 0, y: 0, width: 656, height: 254 } });
			await c7dul.dispose();
		} else {
			console.error(`${city}: HTTP response status code ${response.status()}`);
		}
		break;
	}
}
await browser.close();
console.assert(forecastArr.length === codeArr.length, `Of ${codeArr.length} cities, only ${forecastArr.length} were fetched.`);
await fs.promises.writeFile(`${cityDir}/forecast.json`, JSON.stringify(forecastArr, null, '	'));
