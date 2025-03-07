import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js'
const urlParams = new URLSearchParams(window.location.search);
const cityDir = urlParams.get('cityDir') ?? 'city'; // Can be eiher 'city' or 'county'
const mapName = '香港澳门广东广西湖南江西福建贵州云南重庆四川湖北';
const geojson = await fetch(`echarts-china-cities-js/geojson/${cityDir === 'city' ? 'shape-only' : 'shape-with-internal-borders'}/map.geojson`).then(res => res.json());
echarts.registerMap(mapName, geojson);
const uncomfortableDaysArr = await fetch(`../weather/${cityDir}/uncomfortableDays.json`).then(res => res.json());
echarts.init(document.getElementById('mainChart'), 'dark').setOption({
	tooltip: {
		formatter: (params) => {
			const { name, value } = params;
			const { uncomfortableDays } = uncomfortableDaysArr.find(city => city.city === name);
			return `${name} 不舒适天数 ${value}${cityDir === 'city' ? `<br><img src="../nmc/${cityDir}/${name}.webp">` : ''}<br><table width="100%" height="16px"><tr>${uncomfortableDays.map(b => `<td style="width: 14%; background-color: ${['green', 'orangered'][b]}"></td>`).join('')}</tr></table><img src="../weather/${cityDir}/${name}.webp">`;
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
		label: {
			show: cityDir === 'city',
		},
		data: uncomfortableDaysArr.map(city => ({
			name: `${city.parent ?? ''}${city.city}`,
			value: city.uncomfortableDays.reduce((acc, cur) => { // Sum the number of uncomfortable days.
				return acc + cur;
			}, 0),
		})),
	},
});
