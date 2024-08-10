#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = [
	'101300602', // 梧州藤县
	'101300608', // 梧州龙圩
	'101281405', // 云浮云城
	'101281103', // 江门开平
	'101281104', // 江门新会
	'101281109', // 江门江海
	'101280704', // 珠海香洲
	'101280908', // 肇庆高要
	'101280805', // 佛山禅城
	'101280803', // 佛山南海
	'101280110', // 广州白云
	'101280108', // 广州海珠
	'101280111', // 广州黄埔
	'101280102', // 广州番禺
	'101280112', // 广州南沙
	'101281601', // 东莞
	'101280304', // 惠州惠东
	'101281309', // 清远清城
	'101280211', // 韶关武江
	'101280502', // 汕头潮阳
	'101280506', // 汕头金平
	'101250304', // 株洲荷塘
	'101250107', // 长沙芙蓉
];
const browser = await puppeteer.launch({
	headless: 'new',
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const leftDivs = [];
const bar = new ProgressBar('[:bar] :code :current/:total=:percent :elapseds :etas', { total: cityArr.length });
for (let i = 0; i < cityArr.length; ++i) {
	const city = cityArr[i];
	bar.tick({ code: city });
	const page = await browser.newPage();
	const response = await page.goto(`http://www.weather.com.cn/weather/${city}.shtml`, { // Updates occur at 5:30, 7:30, 11:30, 18:00 everyday.
		waitUntil: 'domcontentloaded',
		timeout: 12000,
	});
	if (response.ok()) {
		leftDivs.push([
			'<div class="left-div">',
			await page.$eval('.left-div .ctop', el => el.outerHTML),
			'<div id="7d" class="c7d">',
			await page.$eval('.left-div .c7d .t', el => el.outerHTML),
			'</div>',
			'</div>',
		].join('\n'));
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
	await page.close();
};
await browser.close();
await fs.writeFile('weather.html', [
	'<!DOCTYPE html>',
	'<html>',
	'<body>',
	'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2017/headStyle_1.css">',
	'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2015/common.css">',
	'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2015/bluesky/c_7d.css">',
	'<link rel="stylesheet" type="text/css" href="http://i.tq121.com.cn/c/weather2019/weather1d.css">',
	'<div class="con today clearfix">',
	'<div class="left fl">',
	...leftDivs,
	'</div>',
	'</div>',
	'</body>',
	'</html>',
].join('\n'));
