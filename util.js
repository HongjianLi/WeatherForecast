export default {
	isUncomfortable: (forecast) => +( // A day is considered to be uncomfortable if any of the following conditions occurs: it rains, the low temperature is below 10 or above 20, the high temperature is below 16 or above 24.
		forecast.sky === '天空灰霾' || forecast.night.desc.includes('雨') || forecast.night.tmp < 10 || forecast.night.tmp > 20 || // ['雨', '雾', '霾'].some(keyword => forecast.night.desc.includes(keyword))
		(forecast.day !== undefined && (forecast.day.desc.includes('雨') || forecast.day.tmp < 16 || forecast.day.tmp > 24))
	),
};
