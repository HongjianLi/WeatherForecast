export default {
	isUncomfortable: (forecast) => +( // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 11 or above 20, the high temperature is below 16 or above 25.
		forecast.sky === '天空灰霾' || ['雨', '沙', '尘', '雾', '霾'].some(keyword => forecast.night.desc.includes(keyword)) || forecast.night.tmp < 11 || forecast.night.tmp > 20 ||
		(forecast.day !== undefined && (['雨', '沙', '尘', '雾', '霾'].some(keyword => forecast.day.desc.includes(keyword)) || forecast.day.tmp < 16 || forecast.day.tmp > 25))
	),
};
