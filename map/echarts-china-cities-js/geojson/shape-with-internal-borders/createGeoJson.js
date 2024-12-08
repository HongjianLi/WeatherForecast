#!/usr/bin/env node
// This script creates city.json and provinces.geojson. It has to be run once only, after ../shape-only/createGeoJson.js.
import fs from 'fs/promises';
const cityArr0 = JSON.parse(await fs.readFile('../shape-only/city.json'));
console.assert(cityArr0.length === 69); // 合共69市 = 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市
const featuresArr = await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
	const provinceIndex = ['guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4'].findIndex(province => city.startsWith(province));
	if (provinceIndex > -1 && city !== 'guang3_dong1_dong1_sha1_qun2_dao3.geojson') cityArr.push({ city, provinceIndex }); // Filter out 东沙群岛
	return cityArr;
}, []).sort((city0, city1) => (city0.provinceIndex - city1.provinceIndex)).map(async city => (JSON.parse(await fs.readFile(city.city)).features)));
console.assert(featuresArr.length === cityArr0.length);
const renameArr = [ // Some counties have been renamed, from city0 to city1.
	{ parent: '南宁', city0: '横县', city1: '横州市' },
	{ parent: '株洲', city0: '株洲县', city1: '渌口区' },
	{ parent: '九江', city0: '九江县', city1: '柴桑区' },
	{ parent: '上饶', city0: '上饶县', city1: '广信区' },
];
const cityArr = featuresArr.reduce((cityArr, features, index) => {
	features.forEach(feature => {
		const parent = cityArr0[index].city;
		let city = feature.properties.name;
		const rename = renameArr.find(rename => rename.parent === parent && rename.city0 === city);
		if (rename) city = rename.city1;
		feature.properties.name = `${parent}${city}`;
		cityArr.push({ parent, city, feature });
	});
	return cityArr;
}, []);
console.assert(cityArr.length === 541); // 合共541县 = 广东123县 + 广西111县 + 湖南122县 + 江西100县 + 福建85县
await fs.writeFile(`广东广西湖南江西福建.geojson`, JSON.stringify({	type: "FeatureCollection", features: cityArr.map(city => city.feature) }));
cityArr.forEach(city => delete city.feature);
await fs.writeFile('city.json', JSON.stringify(cityArr, null, '	')); // Both 张家界 and 龙岩 have 永定区
