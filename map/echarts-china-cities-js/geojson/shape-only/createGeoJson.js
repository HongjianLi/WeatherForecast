#!/usr/bin/env node
// This script creates city.json and map.geojson. It has to be run once only.
import fs from 'fs/promises';
const minorities = JSON.parse(await fs.readFile('../../../minorities.json'));
const features = [].concat(...await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The current directory was cloned from https://github.com/echarts-maps/echarts-china-cityArr-js/tree/master/geojson
	const provinceIndex = ['xianggang', 'aomen', 'guang3_dong1', 'guang3_xi1', 'hu2_nan2', 'jiang1_xi1', 'fu2_jian4', 'hai3_nan2', 'gui4_zhou1', 'yun2_nan2', 'chongqing', 'si4_chuan1', 'hu2_bei3', 'an1_hui1', 'zhe4_jiang1', 'shanghai', 'jiang1_su1', 'he2_nan2_xin4_yang2', 'he2_nan2_zhu4_ma3_dian4', 'he2_nan2_nan2_yang2', 'he2_nan2_zhou1_kou3', 'he2_nan2_ta4_he2', 'he2_nan2_xu3_chang1', 'he2_nan2_ping2_ding3_shan1', 'he2_nan2_luo4_yang2', 'he2_nan2_san1_men2_xia2', 'he2_nan2_shang1_qiu1', 'he2_nan2_kai1_feng1', 'he2_nan2_zheng4_zhou1', 'shan3_xi1_an1_kang1', 'shan3_xi1_han4_zhong1', 'shan3_xi1_shang1_luo4', 'shan3_xi1_xi1_an1', 'shan3_xi1_bao3_ji1', 'gan1_su4_long3_nan2', 'gan1_su4_tian1_shui3'].findIndex(province => city.startsWith(province));
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
console.assert(features.length === 213, features.length); // 合共213市 = 香港1市 + 澳门1市 + 广东21市 + 广西14市 + 湖南14市 + 江西11市 + 福建9市 + 海南18市 + 贵州9市 + 云南16市 + 重庆1市 + 四川21市 + 湖北17市 + 安徽16市 + 浙江11市 + 上海1市 + 江苏13市 + 河南12市(部分) + 陕西5市(部分) + 甘肃2市(部分)
await fs.writeFile('city.json', JSON.stringify(features.map(feature => ({ city: feature.properties.name })), null, '	'));
await fs.writeFile(`map.geojson`, JSON.stringify({ type: "FeatureCollection", features }));
