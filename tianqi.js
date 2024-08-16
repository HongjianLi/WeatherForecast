#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const cityArr = [
	'gangbei', // 港北
	'tengxian', // 藤县
	'longweiqu', // 龙圩
	'yunchengqu', // 云城
	'gaoyao', // 高要
	'kaiping', // 开平
	'xinhui', // 新会
	'jianghai', // 江海
	'xiangzhouqu', // 香洲
	'chanchengqu', // 禅城
	'nanhai', // 南海
	'baiyun', // 白云
	'haizhuqu', // 海珠
	'huangpuqu', // 黄埔
	'panyu', // 番禺
	'nanshaqu', // 南沙
	'dongguan', // 东莞
	'huidong1', // 惠东
	'chaoyang2', // 潮阳
	'jinpingqu', // 金平
	'qingchengqu', // 清城
	'wujiang1', // 武江
	'beihuqu', // 北湖
	'zhuhuiqu', // 珠晖
	'hetangqu', // 荷塘
	'furongqu', // 芙蓉
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
	const response = await page.goto(`https://www.tianqi.com/${city}/7/`, {
		waitUntil: 'domcontentloaded',
		timeout: 12000,
	});
	if (response.ok()) {
		cityDivArr.push([
			await page.$eval('div.inleft_place a.place_b', el => el.innerHTML),
			(await page.$eval('ul.weaul', el => el.outerHTML)).replace(/\/\/static.tianqistatic.com\/static\/tianqi2018\/ico2\//g, '').replace(/\<\!\-\- /g, '').replace(/ \-\-\>/g, ''),
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
	'<head>',
	'<link href="tianqi.css" rel="stylesheet">',
	'<link href="tianyubao.css" rel="stylesheet">',
	'</head>',
	'<body>',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui1.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui2.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui3.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen24.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen48.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/gaowen/static/images/gaowen72.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/kongqiwuran/static/images/jiaotongkongqiwuran.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/wumai/static/images/wumaiwu.jpg" width="671">',
	'<img src="https://content.pic.tianqistatic.com/wumai/static/images/wumaimai.jpg" width="671">',
	'<div class="w1100 newday40_top">',
	'<div class="inleft">',
	...cityDivArr,
	'</div>',
	'</div>',
	'</body>',
	'</html>',
].join('\n'));
