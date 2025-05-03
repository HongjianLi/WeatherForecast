import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js'
//import util from '/util.js';
const urlParams = new URLSearchParams(window.location.search);
const cityDir = urlParams.get('cityDir') ?? 'city'; // Can be eiher 'city' or 'county'
const mapName = '香港澳门广东广西湖南江西福建海南贵州云南重庆四川湖北安徽浙江上海江苏河南陕西甘肃';
const geojson = await fetch(`echarts-china-cities-js/geojson/${cityDir === 'city' ? 'shape-only' : 'shape-with-internal-borders'}/map.geojson`).then(res => res.json());
echarts.registerMap(mapName, geojson);
const forecastArr = await fetch(`../weather/${cityDir}/forecast.json`).then(res => res.json()); // Prefer weather to nmc because weather provides the sky key 晴天预报, which indicates whether 灰霾 occurs.
//forecastArr.forEach(fc => fc.forecast.forEach(f => f.uncomfortable = util.isUncomfortable(f))); // Re-evaluate the conditions.
echarts.init(document.getElementById('mainChart'), 'dark').setOption({
	tooltip: {
		formatter: (params) => {
			const { name, value } = params;
			const { forecast } = forecastArr.find(city => city.city === name);
			return `${name} 不舒适天数 ${value}${cityDir === 'city' ? `<br><img src="../nmc/${cityDir}/${name}.webp">` : ''}<br><table width="100%" height="16px" style="color: white"><tr>${forecast.map(f => `<td style="width: 14%; background-color: ${['green', 'orangered'][f.uncomfortable]}">${f.flight ? `${f.flight.src.city[0]}${f.flight.src.time} ${f.flight.price}` : '&nbsp;'}</td>`).join('')}</tr></table><img src="../weather/${cityDir}/${name}.webp">`;
		},
	},
	visualMap: {
		min: 0,
		max: 7,
		text: ['不舒适', '舒适'],
		calculable: true,
		inRange: {
			color: ['green', 'lightgreen', 'lightskyblue', 'yellow', 'orangered']
		},
		left: '40%',
	},
	series: {
		type: 'map',
		map: mapName, // Map name registered in echarts.registerMap().
		roam: true,
		zoom: 1.2,
		label: {
			show: cityDir === 'city',
//			fontSize: 7, // Default is 12
		},
		data: forecastArr.map(fc => ({
			name: `${fc.parent ?? ''}${fc.city}`,
			value: fc.forecast.reduce((acc, cur) => { // Sum the number of uncomfortable days.
				return acc + cur.uncomfortable;
			}, 0),
		})),
	},
});
