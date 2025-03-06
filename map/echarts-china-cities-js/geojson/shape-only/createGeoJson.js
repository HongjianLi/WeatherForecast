#!/usr/bin/env node
// This script creates city.json and 广东广西湖南江西福建.geojson. It has to be run once only.
import fs from 'fs/promises';
const minorities = JSON.parse(await fs.readFile('../../../minorities.json'));
const features = [].concat(...await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
	const provinceIndex = ['xianggang', 'aomen', 'guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4', 'hai3_nan2', 'gui4_zhou1', 'yun2_nan2', 'chongqing', 'si4_chuan1', 'hu2_bei3'].findIndex(province => city.startsWith(province));
	if (provinceIndex > -1 && !['guang3_dong1_dong1_sha1_qun2_dao3.geojson', 'hai3_nan2_san1_sha1.geojson'].includes(city)) cityArr.push({ city, provinceIndex }); // Filter out 东沙群岛
	return cityArr;
}, []).sort((city0, city1) => (city0.provinceIndex - city1.provinceIndex)).map(async city => {
	const { features } = JSON.parse(await fs.readFile(city.city));
	features.forEach(feature => {
		const { properties } = feature;
		let { name } = properties;
		['自治州', '自治县', '林区', '市', '县'].forEach(c => {
			if (name.endsWith(c)) name = name.slice(0, -c.length);
		});
		minorities.forEach(minority => {
			name = name.replace(minority, '');
		});
		properties.name = name;
	});
	return features;
})));
console.assert(features.length === 153, features.length); // 合共153市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市 + 海南18市 + 贵州9市 + 云南16市 + 重庆1市 + 四川21市 + 湖北17市
await fs.writeFile('city.json', JSON.stringify(features.map(feature => ({ city: feature.properties.name })), null, '	'));
await fs.writeFile(`map.geojson`, JSON.stringify({ type: "FeatureCollection", features }));
