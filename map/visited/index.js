import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js'
const urlParams = new URLSearchParams(window.location.search);
const cityDir = urlParams.get('cityDir') ?? 'city'; // Can be eiher 'city' or 'county'
const mapName = '中国大陆';
const geojson = await fetch(`../echarts-china-cities-js/geojson/${cityDir === 'city' ? 'shape-only' : 'shape-with-internal-borders'}/map.geojson`).then(res => res.json());
echarts.registerMap(mapName, geojson);
const cityArr = geojson.features.map(feature => feature.properties.name);
const visitedArr = cityDir === 'city' ? [
	'香港', '澳门',
	'广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮',
	'南宁', '桂林', '梧州', '贵港', '贺州', '来宾',
	'长沙', '株洲', '衡阳',
	'九江',
	'漳州', '厦门',
	'海口', '文昌', '琼海', '万宁', '陵水', '三亚', '保亭', '东方', '儋州',
	'贵阳', '六盘水', '遵义', '安顺', '黔西南', '黔南', '黔东南',
	'昆明', '文山', '丽江', '迪庆', '大理',
	'重庆',
	'成都', '阿坝', '内江', '资阳', '眉山', '乐山', '宜宾', '泸州',
	'武汉',
	'宁波', '舟山',
	'上海',
	'南京',
	'济南', '烟台', '青岛',
	'北京',
	'日喀则', '拉萨', '山南', '林芝',
	'哈尔滨',
] : [
	'香港香港', '澳门澳门',
	'广州越秀', '广州海珠', '广州荔湾', '广州天河', '广州白云', '广州黄埔', '广州花都', '广州番禺', '广州南沙', '广州增城', '广州从化', '深圳福田', '深圳罗湖', '深圳盐田', '深圳南山', '深圳宝安', '深圳龙岗', '深圳龙华', '深圳坪山',/* '深圳光明',*/ '珠海香洲', '珠海金湾', '珠海斗门', '汕头金平', '汕头龙湖',/* '汕头澄海',*/ '汕头濠江', '汕头潮阳',/* '汕头潮南',*/ '汕头南澳', '佛山禅城', '佛山南海', '佛山顺德', '佛山高明', '佛山三水', '韶关浈江', '韶关武江', '韶关曲江',/* '韶关乐昌', '韶关南雄',*/ '韶关仁化',/* '韶关始兴', '韶关翁源', '韶关新丰',*/ '韶关乳源', '湛江赤坎', '湛江霞山', '湛江麻章',/* '湛江坡头', '湛江雷州', '湛江廉江', '湛江吴川', '湛江遂溪', '湛江徐闻'*/
];
echarts.init(document.getElementById('mainChart'), 'dark').setOption({
	visualMap: {
		min: 0,
		max: 1,
		text: ['去过', '没去过'],
		calculable: true,
		inRange: {
			color: ['green', 'orangered']
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
			color: 'white',
//			fontSize: 7, // Default is 12
		},
		data: cityArr.map(city => ({
			name: city,
			value: +visitedArr.includes(city),
		})),
	},
});
