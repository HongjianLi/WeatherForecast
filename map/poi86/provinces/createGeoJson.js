#!/usr/bin/env node
// This script creates city.json and 广东广西湖南江西福建.geojson. It has to be run once only.
import fs from 'fs/promises';
const features = [].concat(...await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The geojson files were downloaded from https://www.poi86.com/
	const provinceIndex = ['广东省', '广西壮族自治区', '湖南省', '江西省', '福建省'].findIndex(province => city.startsWith(province));
	if (provinceIndex > -1) cityArr.push({ city, provinceIndex });
	return cityArr;
}, []).sort((city0, city1) => (city0.provinceIndex - city1.provinceIndex)).map(async city => (JSON.parse(await fs.readFile(city.city)).features)))); // pinyin: city.city.split('.')[0].split('_').slice(2).join(' ')
console.assert(features.length === 69); // 合共69市 = 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市
await fs.writeFile('city.json', JSON.stringify(features.map(feature => ({ city: feature.properties.name })), null, '	'));
await fs.writeFile(`map.geojson`, JSON.stringify({ type: "FeatureCollection", features }));
