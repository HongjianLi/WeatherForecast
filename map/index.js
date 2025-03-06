import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js'
const urlParams = new URLSearchParams(window.location.search);
const cityDir = urlParams.get('cityDir') ?? 'city'; // Can be eiher 'city' or 'county'
const mapName = '香港澳门广东广西湖南江西福建';
const geojson = await fetch(`echarts-china-cities-js/geojson/${cityDir === 'city' ? 'shape-only' : 'shape-with-internal-borders'}/map.geojson`).then(res => res.json());
echarts.registerMap(mapName, geojson);
/*const [ weather, tianqi ] = await Promise.all(['weather', 'tianqi'].map(srcDir => {
	return fetch(`../${srcDir}/${cityDir}/uncomfortableDays.json`).then(res => res.json());
}));
const cityCodeArrLength = cityDir === 'city' ? 71 : 543; // 71 and 543 are the array lengthes of city/code.json and county/code.json respectively.
console.assert(weather.length <= cityCodeArrLength); // www.weather.com.cn sometimes returns TimeoutError.
console.assert(tianqi.length <= cityCodeArrLength); // www.tianqi.com sometimes returns status code 403
const uncomfortableDaysArr = weather.map(wcity => { // Calculate the average of weather and tianqi
	const tcity = tianqi.find(tcity => tcity.city === wcity.city); // tcity could be undefined if tianqi.length <= cityCodeArrLength
	return { city: wcity.city, uncomfortableDays: tcity ? (wcity.uncomfortableDays + tcity.uncomfortableDays) * 0.5 : wcity.uncomfortableDays};
});*/
const uncomfortableDaysArr = await fetch(`../weather/${cityDir}/uncomfortableDays.json`).then(res => res.json());
echarts.init(document.getElementById('mainChart'), 'dark').setOption({
	tooltip: {
		formatter: (params) => {
			const { name, value } = params;
			return `${name}<br><img src="../nmc/${cityDir}/${name}.webp"><br><img src="../weather/${cityDir}/${name}.webp"><br><img src="../tianqi/${cityDir}/${name}.webp"><br>不舒适天数 ${value}`;
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
			value: city.uncomfortableDays,
		})),
	},
});
