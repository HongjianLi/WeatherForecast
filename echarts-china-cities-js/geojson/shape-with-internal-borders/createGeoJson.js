#!/usr/bin/env node
// This script creates city.json and map.geojson. It has to be run once only, after ../shape-only/createGeoJson.js.
import fs from 'fs/promises';
const cityArr0 = JSON.parse(await fs.readFile('../shape-only/city.json'));
console.assert(cityArr0.length === 213); // 合共213市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市 + 海南18市 + 贵州9市 + 云南16市 + 重庆1市 + 四川21市 + 湖北17市 + 安徽16市 + 浙江11市 + 上海1市 + 江苏13市 + 河南12市(部分) + 陕西5市(部分) + 甘肃2市(部分)
const featuresArr = await Promise.all([].concat(
	['xianggang', 'aomen'].map(city => `../shape-only/${city}.geojson`), // Since Hong Kong and Macao are small cities, treat them as a whole and substitute their shape-only version.
	(await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
		const provinceIndex = ['guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4', 'hai3_nan2', 'gui4_zhou1', 'yun2_nan2', 'chongqing', 'si4_chuan1', 'hu2_bei3', 'an1_hui1', 'zhe4_jiang1', 'shanghai', 'jiang1_su1', 'he2_nan2_xin4_yang2', 'he2_nan2_zhu4_ma3_dian4', 'he2_nan2_nan2_yang2', 'he2_nan2_zhou1_kou3', 'he2_nan2_ta4_he2', 'he2_nan2_xu3_chang1', 'he2_nan2_ping2_ding3_shan1', 'he2_nan2_luo4_yang2', 'he2_nan2_san1_men2_xia2', 'he2_nan2_shang1_qiu1', 'he2_nan2_kai1_feng1', 'he2_nan2_zheng4_zhou1', 'shan3_xi1_an1_kang1', 'shan3_xi1_han4_zhong1', 'shan3_xi1_shang1_luo4', 'shan3_xi1_xi1_an1', 'shan3_xi1_bao3_ji1', 'gan1_su4_long3_nan2', 'gan1_su4_tian1_shui3'].findIndex(province => city.startsWith(province));
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
	{ parent: '芜湖', city0: '芜湖县', city1: '湾沚区' },
];
const cityArr = featuresArr.reduce((cityArr, features, index) => {
	features.forEach(feature => {
		const parent = cityArr0[index].city;
		let city = feature.properties.name;
		const rename = renameArr.find(rename => rename.parent === parent && rename.city0 === city);
		if (rename) city = rename.city1;
		['自治县', '特区', '林区', '新区', '市', '县', '区'].forEach(c => { // Note the order of 县 and 区 in order to correctly shorten 梅州梅县区, 赣州赣县区, 攀枝花东区, 攀枝花西区
			if (city.length >= 2 + c.length && city.endsWith(c)) city = city.slice(0, -c.length); // Avoid 城区,东区,西区 being shortened to just 城,东,西
		});
		minorities.forEach(minority => {
			city = city.replace(minority, '');
		});
		feature.properties.name = `${parent}${city}`;
		cityArr.push({ parent, city, feature });
	});
	return cityArr;
}, []);
console.assert(cityArr.length === 1596); // 合共1596县 = 香港1市 + 澳门1市 + 广东123县 + 广西111县 + 湖南122县 + 江西100县 + 福建84县 + 海南24县 + 贵州88县 + 云南129县 + 重庆38县 + 四川183县 + 湖北103县 + 安徽105县 + 浙江90县 + 上海16县 + 江苏95县 + 河南114县(部分) + 陕西53县(部分) + 甘肃16县(部分)
await fs.writeFile('map.geojson', [ '{"type":"FeatureCollection","features":[', ...cityArr.map((city, i) => `${JSON.stringify(city.feature)}${i + 1 < cityArr.length ? ',' : ''}`), ']}' ].join('\n')); // Output each feature at a separate line, for easy update in the future.
cityArr.forEach(city => delete city.feature);
await fs.writeFile('city.json', JSON.stringify(cityArr, null, '	')); // Both 张家界 and 龙岩 have 永定区. Both 广州 and 贵阳 have 白云区. Both 福州 and 黔东南 have 台江. Both 乐山 and 内江 have 市中区. Both 重庆 and 宁波 have 江北区. 福州、南京、徐州、开封 have 鼓楼区.
