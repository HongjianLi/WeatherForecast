#!/usr/bin/env node
// This script creates city.json and map.geojson. It has to be run once only.
import fs from 'fs/promises';
const minorities = JSON.parse(await fs.readFile('../../minorities.json'));
const features = [].concat(...await Promise.all((await fs.readdir('.')).reduce((cityArr, city) => { // The geojson files were downloaded from https://www.poi86.com/
	const provinceIndex = ['香港', '澳门', '广东', '广西', '湖南', '江西', '福建', '海南', '贵州', '云南', '重庆', '四川', '湖北', '安徽', '浙江', '上海', '江苏'].findIndex(province => city.startsWith(province));
	if (provinceIndex > -1) cityArr.push({ city, provinceIndex });
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
await fs.writeFile('city.json', JSON.stringify(features.map(feature => ({ city: feature.properties.name })), null, '	'));
await fs.writeFile(`map.geojson`, JSON.stringify({ type: "FeatureCollection", features }));
