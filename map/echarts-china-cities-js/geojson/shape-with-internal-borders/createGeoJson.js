#!/usr/bin/env node
// This script creates city.json and map.geojson. It has to be run once only, after ../shape-only/createGeoJson.js.
import fs from 'fs/promises';
const cityArr0 = JSON.parse(await fs.readFile('../shape-only/city.json'));
console.assert(cityArr0.length === 153); // 合共71市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市 + 海南18市 + 贵州9市 + 云南16市 + 重庆1市 + 四川21市 + 湖北17市
const featuresArr = await Promise.all([].concat(
	['xianggang', 'aomen'].map(city => `../shape-only/${city}.geojson`), // Since Hong Kong and Macao are small cities, treat them as a whole and substitute their shape-only version.
	(await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
		const provinceIndex = ['guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4', 'hai3_nan2', 'gui4_zhou1', 'yun2_nan2', 'chongqing', 'si4_chuan1', 'hu2_bei3'].findIndex(province => city.startsWith(province));
		if (provinceIndex > -1 && !['guang3_dong1_dong1_sha1_qun2_dao3.geojson', 'hai3_nan2_san1_sha1.geojson'].includes(city)) cityArr.push({ city, provinceIndex }); // Filter out 东沙群岛
		return cityArr;
	}, []).sort((city0, city1) => (city0.provinceIndex - city1.provinceIndex)).map(city => city.city),
).map(async path => (JSON.parse(await fs.readFile(path)).features)));
console.assert(featuresArr.length === cityArr0.length);
const minorities = JSON.parse(await fs.readFile('../../../minorities.json'));
const renameArr = [ // Some counties have been renamed, from city0 to city1.
	{ parent: '南宁', city0: '横县', city1: '横州市' },
	{ parent: '株洲', city0: '株洲县', city1: '渌口区' },
	{ parent: '九江', city0: '九江县', city1: '柴桑区' },
	{ parent: '上饶', city0: '上饶县', city1: '广信区' },
	{ parent: '六盘水', city0: '盘县', city1: '盘州市' },
	{ parent: '宜宾', city0: '宜宾县', city1: '叙州区' },
];
const cityArr = featuresArr.reduce((cityArr, features, index) => {
	features.forEach(feature => {
		const parent = cityArr0[index].city;
		let city = feature.properties.name;
		const rename = renameArr.find(rename => rename.parent === parent && rename.city0 === city);
		if (rename) city = rename.city1;
		['自治县', '特区', '林区', '市', '县', '区'].forEach(c => { // Note the order of 县 and 区 in order to correctly shorten 梅州梅县区, 赣州赣县区, 攀枝花东区, 攀枝花西区
			if (city.length >= 3 && city.endsWith(c)) city = city.slice(0, -c.length); // Avoid 城区,东区,西区 being shortened to just 城,东,西
		});
		minorities.forEach(minority => {
			city = city.replace(minority, '');
		});
		feature.properties.name = `${parent}${city}`;
		cityArr.push({ parent, city, feature });
	});
	return cityArr;
}, []);
console.assert(cityArr.length === 1108); // 合共1108县 = 香港1市 + 澳门1市 + 广东123县 + 广西111县 + 湖南122县 + 江西100县 + 福建85县 + 海南24县 + 贵州88县 + 云南129县 + 重庆38县 + 四川183县 + 湖北103县
await fs.writeFile(`map.geojson`, JSON.stringify({ type: "FeatureCollection", features: cityArr.map(city => city.feature) }));
cityArr.forEach(city => delete city.feature);
await fs.writeFile('city.json', JSON.stringify(cityArr, null, '	')); // Both 张家界 and 龙岩 have 永定区. Both 广州 and 贵阳 have 白云区. Both 福州 and 黔东南 have 台江. Both 乐山 and 内江 have 市中区.
