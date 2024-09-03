#!/usr/bin/env node
import fs from 'fs';
import { Readable } from 'stream';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
await Promise.all([
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui1.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui2.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui3.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen24.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen48.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen72.jpg',
	'https://content.pic.tianqistatic.com/kongqiwuran/static/images/jiaotongkongqiwuran.jpg',
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaiwu.jpg',
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaimai.jpg',
].map(async (url) => {
	const response = await fetch(url);
	Readable.fromWeb(response.body).pipe(fs.createWriteStream(url.split('/').pop()));
}));
const cityArr = [
	'gangbei', // 贵港港北
	'tengxian', // 梧州藤县
	'longweiqu', // 梧州龙圩
	'yunchengqu', // 云浮云城
	'gaoyao', // 肇庆高要
	'xinhui', // 江门新会
	'jianghai', // 江门江海
	'xiangzhouqu', // 珠海香洲
	'chanchengqu', // 佛山禅城
	'nanhai', // 佛山南海
	'baiyun', // 广州白云
	'huangpuqu', // 广州黄埔
	'panyu', // 广州番禺
	'nanshaqu', // 广州南沙
	'dongguan', // 东莞
	'huidong1', // 惠州惠东
	'chaoyang2', // 汕头潮阳
	'jinpingqu', // 汕头金平
	'qingchengqu', // 清远清城
	'wujiang1', // 韶关武江
	'beihuqu', // 郴州北湖
	'zhuhuiqu', // 衡阳珠晖
	'hetangqu', // 株洲荷塘
	'furongqu', // 长沙芙蓉
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
await fs.promises.writeFile('tianqi.html', [
	'<!DOCTYPE html>',
	'<html>',
	'<head>',
	'<link href="tianqi.css" rel="stylesheet">',
	'<link href="tianyubao.css" rel="stylesheet">',
	'</head>',
	'<body>',
	'<img src="jiangshui1.jpg" width="671">',
	'<img src="jiangshui2.jpg" width="671">',
	'<img src="jiangshui3.jpg" width="671">',
	'<img src="gaowen24.jpg" width="671">',
	'<img src="gaowen48.jpg" width="671">',
	'<img src="gaowen72.jpg" width="671">',
	'<img src="jiaotongkongqiwuran.jpg" width="671">',
	'<img src="wumaiwu.jpg" width="671">',
	'<img src="wumaimai.jpg" width="671">',
	'<div class="w1100 newday40_top">',
	'<div class="inleft">',
	...cityDivArr,
	'</div>',
	'</div>',
	'</body>',
	'</html>',
].join('\n'));
