#!/usr/bin/env node
// This script creates city.json and 广东广西湖南江西福建.geojson. It has to be run once only.
import fs from 'fs/promises';
const features = [].concat(...await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
	const provinceIndex = ['guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4'].findIndex(province => city.startsWith(province));
	if (provinceIndex > -1 && city !== 'guang3_dong1_dong1_sha1_qun2_dao3.geojson') cityArr.push({ city, provinceIndex }); // Filter out 东沙群岛
	return cityArr;
}, []).sort((city0, city1) => (city0.provinceIndex - city1.provinceIndex)).map(async city => (JSON.parse(await fs.readFile(city.city)).features)))); // pinyin: city.city.split('.')[0].split('_').slice(2).join(' ')
console.assert(features.length === 69); // 合共69市 = 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市
await fs.writeFile('city.json', JSON.stringify(features.map(feature => ({ city: feature.properties.name })), null, '	'));
await fs.writeFile(`广东广西湖南江西福建.geojson`, JSON.stringify({	type: "FeatureCollection", features }));
