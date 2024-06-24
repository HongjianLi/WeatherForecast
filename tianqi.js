#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = [
/*	'101300602', // 藤县
	'101300608', // 龙圩
	'101281405', // 云城
	'101281103', // 开平
	'101281104', // 新会
	'101281109', // 江海
	'101280704', // 香洲
	'101280908', // 高要
	'101280805', // 禅城
	'101280803', // 南海
	'101280110', // 白云
	'101280108', // 海珠
	'101280111', // 黄埔
	'101280102', // 番禺
	'101280112', // 南沙
	'101281601', // 东莞
	'101280304', // 惠东
	'101281309', // 清城
	'101280211', // 武江
	'101280502', // 潮阳
	'101280506', // 金平
	'101250304', // 荷塘
	'101250107', // 芙蓉*/
];
const browser = await puppeteer.launch({
	headless: 'new',
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const cityDivArr = [];
const bar = new ProgressBar('[:bar] :code :current/:total=:percent :elapseds :etas', { total: cityArr.length });
for (let i = 0; i < cityArr.length; ++i) {
	const city = cityArr[i];
	bar.tick({ code: city });
	const page = await browser.newPage();
	const response = await page.goto(`https://m.tianqi.com/${city}/?tq`, {
		waitUntil: 'domcontentloaded',
		timeout: 12000,
	});
	if (response.ok()) {
		cityDivArr.push([

		].join('\n'));
	} else {
		console.error(`${city}: HTTP response status code ${response.status()}`);
	}
	await page.close();
};
await browser.close();
await fs.writeFile('tianqi.html', [
	'<!DOCTYPE html>',
	'<html>',
	'<body>',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui1.jpg">',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui2.jpg">',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui3.jpg">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen24.jpg">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen48.jpg">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen72.jpg">',
	'<img src="https://content.pic.tianqistatic.com/kongqiwuran/static/images/jiaotongkongqiwuran.jpg">',
	...cityDivArr,
	'</body>',
	'</html>',
].join('\n'));
