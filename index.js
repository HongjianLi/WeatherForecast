#!/usr/bin/env node
import fs from 'fs';
import { Readable } from 'stream';
async function fetchImages(site, urlArr, urlReplaceValue) {
	console.log(`Fetching images from ${site}`);
	await Promise.all(urlArr.map(async (url) => {
		const response = await fetch(url.replace('{}', urlReplaceValue));
		if (!response.ok) return;
		Readable.fromWeb(response.body).pipe(fs.createWriteStream(`${site}/${url.split('/').pop()}`));
	}));	
}
await fetchImages('tianqi', [
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui1.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui2.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui3.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen24.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen48.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen72.jpg',
	'https://content.pic.tianqistatic.com/kongqiwuran/static/images/jiaotongkongqiwuran.jpg',
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaiwu.jpg',
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaimai.jpg',
]);
const today = new Date();
const localeDateString = [ today.getFullYear(), today.getMonth() + 1, today.getDate() ].map((component) => {
	return component.toString().padStart(2, '0');
}).join("");
const hours = today.getHours();
for (var hourIndex = 0; !(hours < [18, 24][hourIndex]); ++hourIndex);
const urlReplaceValue = localeDateString + ['08','20'][hourIndex];
await fetchImages('weather', [
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_00000-02400_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_02400-04800_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{}0000_04800-07200_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{}0000_04800-07200_1920.png',
], urlReplaceValue);
