import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js'
//import util from '../util.js';
const urlParams = new URLSearchParams(window.location.search);
const cityDir = urlParams.get('cityDir') ?? 'city'; // Can be eiher 'city' or 'county'
const mapName = '中国大陆';
const geojson = await fetch(`echarts-china-cities-js/geojson/${cityDir === 'city' ? 'shape-only' : 'shape-with-internal-borders'}/map.geojson`).then(res => res.json());
echarts.registerMap(mapName, geojson);
const forecastArr = await fetch(`../weather/${cityDir}/forecast.json`).then(res => res.json()); // Prefer weather to nmc because weather provides the sky key 晴天预报, which indicates whether 灰霾 occurs.
//forecastArr.forEach(fc => fc.forecast.forEach(f => f.uncomfortable = util.isUncomfortable(f))); // Re-evaluate the conditions.
const tmpArr = [-41, -36, -31, -26, -21, -16, -11, -6, -1, 4, 10, 15, 20, 25, 30, 35, 40, 45];
function getTmpClass(tmp) {
	for (var tmpIndex = 0; !(tmp <= tmpArr[tmpIndex]) && tmpIndex + 1 < tmpArr.length; ++tmpIndex);
	return tmpArr[tmpIndex];
}
echarts.init(document.getElementById('mainChart'), 'dark').setOption({
	tooltip: {
		backgroundColor: 'rgba(50,50,50,0.8)',
		textStyle: {
			color: '#fff',
		},
		formatter: (params) => {
			const { name, value } = params;
			const city = forecastArr.find(city => city.city === name);
			if (!city) return `${name} unknown`; // value is NaN
			const { forecast } = city;
			return [
				`${name} 不舒适天数 ${value}`,
				'<br>',
				'<table width="672px">',
				'<tr>',
				forecast.map(f => [
					'<th width="14.3%">',
					f.date.substring(5),
					'</th>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.weekday,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.day ? f.day.desc : '',
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.day ? f.day.windd : '',
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.day ? f.day.winds : '',
					'</td>',
				].join('')).join(''),
				'</tr>',
				forecast.map(f => [
					f.day ? `<td class="tmp_lte_${getTmpClass(f.day.tmp)}">` : '<td>',
					f.day ? f.day.tmp : '',
					'</td>',
				].join('')).join(''),
				'</tr>',
				'</tr>',
				forecast.map(f => [
					`<td class="tmp_lte_${getTmpClass(f.night.tmp)}">`,
					f.night.tmp,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.night.desc,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.night.windd,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					'<td>',
					f.night.winds,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					`<td class="sky lv${1 + [ '天空蔚蓝', '天空淡蓝', '天空阴沉', '天空灰霾' ].indexOf(f.sky)}">`,
					f.sky,
					'</td>',
				].join('')).join(''),
				'</tr>',
				'<tr>',
				forecast.map(f => [
					`<td style="background-color: ${['green', 'orangered'][f.uncomfortable]}">`,
					f.flight ? `${f.flight.src.city[0]}${f.flight.src.time} ${f.flight.price}` : '&nbsp;',
					'</td>',
				].join('')).join(''),
				'</tr>',
				'</table>',
			].join('');
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
