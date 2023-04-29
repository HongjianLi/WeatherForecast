#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import * as tf from '@tensorflow/tfjs-node';
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
	args: ['--no-sandbox', '--disable-setuid-sandbox'],
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	defaultViewport: {
		deviceScaleFactor: 3,
		width: 3840,
		height: 2160,
	},
});
const tensorArr = await Promise.all(cityArr.map(async (city) => {
	const page = await browser.newPage();
	const response = await page.goto(`http://www.weather.com.cn/weather/${city}.shtml`, {
		waitUntil: 'domcontentloaded',
		timeout: 12000,
	});
	if (response.ok()) {
		return tf.node.decodePng(await page.screenshot({
//			path: `${city}.png`,
			clip: {
				x: 1431,
				y: 242,
				width: 657,
				height: 320,
			},
		}));
	} else {
		console.error(`${city}: ${response.status()} ${response.statusText()}`);
	}
	await page.close();
}));
await browser.close();

const outputTensor = tf.concat(tensorArr);
const outputBuffer = await tf.node.encodePng(outputTensor);
await fs.writeFile('output.png', outputBuffer);
tf.dispose([outputTensor, tensorArr]);
