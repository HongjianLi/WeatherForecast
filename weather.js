#!/usr/bin/env node
import fs from 'fs';
import { Readable } from 'stream';
import puppeteer from 'puppeteer-core';
import ProgressBar from 'progress';
const today = new Date();
const localeDateString = [ today.getFullYear(), today.getMonth() + 1, today.getDate() ].map((component) => {
	return component.toString().padStart(2, "0");
}).join("");
const hours = today.getHours();
for (var hourIndex = 0; !(hours <  [18, 24][hourIndex]); ++hourIndex);
await Promise.all([
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0002400.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0004800.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0007200.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_04800-07200_1920.png',
].map(async (url, urlIndex) => {
	const response = await fetch(url.replace('{}', localeDateString + (urlIndex < 3 ? ["00","12"] : ["08","20"])[hourIndex]));
	if (!response.ok) return;
	Readable.fromWeb(response.body).pipe(fs.createWriteStream(url.split('/').pop()));
}));
const cityArr = [
	'101300804', // 贵港港北
	'101300602', // 梧州藤县
	'101300608', // 梧州龙圩
	'101300603', // 梧州万秀
	'101281405', // 云浮云城
	'101280908', // 肇庆高要
	'101281104', // 江门新会
	'101281109', // 江门江海
	'101280704', // 珠海香洲
	'101280805', // 佛山禅城
	'101280803', // 佛山南海
	'101280110', // 广州白云
	'101280111', // 广州黄埔
	'101280102', // 广州番禺
	'101280112', // 广州南沙
	'101281601', // 东莞
	'101280304', // 惠州惠东
	'101280502', // 汕头潮阳
	'101280506', // 汕头金平
	'101281309', // 清远清城
	'101280211', // 韶关武江
	'101250506', // 郴州北湖
	'101250410', // 衡阳珠晖
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
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
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
await fs.promises.writeFile('weather.html', [
	'<!DOCTYPE html>',
	'<html>',
	'<body>',
	'<img src="sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0002400.jpg" width="671">',
	'<img src="sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0004800.jpg" width="671">',
	'<img src="sevp_nmc_stfc_sfer_er24_achn_l88_p9_{}0007200.jpg" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_00000-02400_1920.png" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_02400-04800_1920.png" width="671">',
	'<img src="cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_04800-07200_1920.png" width="671">',
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
