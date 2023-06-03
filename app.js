#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const cityArr = [
	'101281103', // 开平
	'101281104', // 新会
	'101281109', // 江海
	'101280704', // 香洲
	'101280805', // 禅城
	'101280111', // 黄埔
	'101281601', // 东莞
	'101280502', // 潮阳
	'101280506', // 金平
];
const browser = await puppeteer.launch({
	headless: 'new',
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const leftDivs = [];
for (let i = 0; i < cityArr.length; ++i) {
	const city = cityArr[i];
	const page = await browser.newPage();
	const response = await page.goto(`http://www.weather.com.cn/weather/${city}.shtml`, {
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
await fs.writeFile('7d.html', [
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
