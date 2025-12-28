function isUncomfortable(dn, minTmp, maxTmp, relax = 2) { // [ minTmp, maxTmp ] refers to the comfortable temperature range.
	const { desc, tmp } = dn;
	if (['雨', '沙', '尘', '雾', '霾'].some(keyword => desc.includes(keyword)) && desc !== '阵雨') return 1;
	if (minTmp <= tmp && tmp <= maxTmp) return 0; // [ minTmp, maxTmp ] is considered comfortable.
	if (tmp < minTmp - relax || tmp > maxTmp + relax) return 1; // Outside [ minTmp - relax, maxTmp + relax ] is considered uncomfortable.
	return 0.5;
}

export default {
	isUncomfortable: (forecast) => {
		const { sky, day, night } = forecast;
		if (sky === '天空灰霾') return 1;
		const nightUncomfortable = isUncomfortable(night, 16, 20); // The comfortable night temperature range is set to [16, 20].
		if (nightUncomfortable === 1) return 1;
		if (day) {
			const dayUncomfortable = isUncomfortable(day, 21, 25); // The comfortable day temperature range is set to [21, 25].
			if (dayUncomfortable === 1) return 1;
			if (dayUncomfortable === 0 && nightUncomfortable === 0) return 0;
			return 0.5;
		} else {
			return nightUncomfortable;
		}
	},
};
