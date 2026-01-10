#!/usr/bin/env node
import fs from 'fs';
import { Readable } from 'stream';
function fetchImages(site, urlArr, replacements) {
	console.log(`Fetching images from ${site}`);
	return Promise.all(urlArr.map(async (url) => {
		const response = await fetch(url.replace(/{(\w+)}/g, (match, p1) => replacements[p1] || match));
		if (!response.ok) return;
		Readable.fromWeb(response.body).pipe(fs.createWriteStream(`${site}/${url.split('/').pop().replace(/{\w+}/g, '')}`));
	}));
}
/*await fetchImages('tianqi', [
	// 全国降水量预报图
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui1.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui2.jpg',
	'https://content.pic.tianqistatic.com/jiangshui/static/images/jiangshui3.jpg',
	// 全国最高气温预报
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen24.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen48.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen72.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen96.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen120.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen144.jpg',
	'https://content.pic.tianqistatic.com/gaowen/static/images/gaowen168.jpg',
	// 全国空气污染气象条件预报图
	'https://content.pic.tianqistatic.com/kongqiwuran/static/images/jiaotongkongqiwuran.jpg',
	// 全国雾预报图
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaiwu.jpg',
	// 全国霾预报图
	'https://content.pic.tianqistatic.com/wumai/static/images/wumaimai.jpg',
	// 全国公路气象预报
	'https://content.pic.tianqistatic.com/jiaotong/static/images/jiaotong0.jpg',
	// 责任海区6级以上风力预报图
	'https://content.pic.tianqistatic.com/haiyang/static/images/haiyang0.jpg',
	'https://content.pic.tianqistatic.com/haiyang/static/images/haiyang1.jpg',
	'https://content.pic.tianqistatic.com/haiyang/static/images/haiyang2.jpg',
]);*/
const today = new Date();
const [ YYYY, MM, DD ] = [ today.getFullYear(), today.getMonth() + 1, today.getDate() ].map(component => component.toString().padStart(2, '0'));
const date = [ YYYY, MM, DD ].join('');
const hours = today.getHours();
for (var hourIndex = 0; !(hours < [18, 24][hourIndex]); ++hourIndex);
const hh0820 = ['08','20'][hourIndex];
const hh0012 = ['00','12'][hourIndex];
const hh0113 = ['01','13'][hourIndex];
/*await fetchImages('weather', [
	// 全国气候舒适度预报。08时发布08
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_00000-02400.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_02400-04800.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_04800-07200.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_07200-09600.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_09600-12000.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_12000-14400.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/msp3_pmsc_tpfc_sui_l88_chn_{date}{hh0820}0000_14400-16800.jpg',
	// 全国降水量预报图。图中无标注发布时间，但文件名存在08和20
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_00000-02400_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_02400-04800_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_04800-07200_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_07200-09600_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_09600-12000_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_12000-14400_1920.jpg',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_newspure_mi_er_h000_cn_{date}{hh0820}0000_14400-16800_1920.jpg',
	// 全国最高气温预报。图中无标注发布时间，但文件名存在08和20
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_04800-07200_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_07200-09600_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_09600-12000_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_12000-14400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etm_h000_cn_{date}{hh0820}0000_14400-16800_1920.png',
	// 全国最低气温预报。图中无标注发布时间
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_04800-07200_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_07200-09600_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_09600-12000_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_12000-14400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_grid_etn_h000_cn_{date}{hh0820}0000_14400-16800_1920.png',
	// 冷空气降温预报图。图中无标注发布时间
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_mi_cold_h000_cn_{date}{hh0820}0000_00000-02400_1920.png',
	// 全国沙尘天气预报图
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_mi_dust_h000_cn_{date}{hh0820}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_wtfc_sfer_edust_achn_l88_p9_{date}{hh0012}0002400.jpg',
	// 全国雾预报图
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_wtfc_sfer_efg_achn_l88_p9_{date}{hh0012}0002412.jpg',
	// 全国霾预报图
	'https://pi.weather.com.cn/i/product/pic/l/sevp_nmc_wtfc_sfer_ehz_achn_l88_p9_{date}{hh0012}0002412.jpg',
	// 全国空气污染气象条件预报图
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_mi_kw_h000_cn_{date}{hh0820}0000_00000-02400_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_mi_kw_h000_cn_{date}{hh0820}0000_02400-04800_1920.png',
	'https://pi.weather.com.cn/i/product/pic/l/cwcc_nmc_fst_web_mi_kw_h000_cn_{date}{hh0820}0000_04800-07200_1920.png',
], { date, hh0820, hh0012 } );*/
await fetchImages('nmc', [
	// 全国降水量预报图。06时发布01和00，18时发布13和12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0113}0002400.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0113}0004800.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0113}0007200.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0012}0009600.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0012}0012000.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0012}0014400.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_{date}{hh0012}0016800.jpg',
	// 全国最高气温预报。07时发布08，21时发布20
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0002412.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0004812.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0007212.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0009612.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0012012.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0014412.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETM_ACHN_L88_P9_{date}{hh0820}0016812.jpg',
	// 全国最低气温预报。07时发布08，21时发布20
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0002412.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0004812.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0007212.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0009612.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0012012.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0014412.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/RFFC/SEVP_NMC_RFFC_SNWFD_ETN_ACHN_L88_P9_{date}{hh0820}0016812.jpg',
	// 冷空气降温预报图。06时发布00
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_ETAMIX1_ACHN_L88_P9_{date}{hh0012}0002400.JPG',
	// 全国大风预报图。06发布00
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_WIND_ACHN_L88_P9_{date}{hh0012}0002400.JPG',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_WIND_ACHN_L88_P9_{date}{hh0012}0004800.JPG',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_WIND_ACHN_L88_P9_{date}{hh0012}0007200.JPG',
	// 全国雾预报图。06时发布00，18时发布12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_EFG_ACHN_L88_P9_{date}{hh0012}0002412.jpg',
	// 全国霾预报图。06时发布00，17时发布12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_EHZ_ACHN_L88_P9_{date}{hh0012}0002412.JPG',
	// 全国沙尘天气预报图。07时发布00，17时发布12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/WTFC/SEVP_NMC_WTFC_SFER_EDUST_ACHN_L88_P9_{date}{hh0012}0002400.jpg',
	// 全国空气污染气象条件预报图。06时发布00，18时发布12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/APWF/SEVP_NMC_APWF_SFER_EAIRP_ACHN_LNO_P9_{date}{hh0012}0002424.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/APWF/SEVP_NMC_APWF_SFER_EAIRP_ACHN_LNO_P9_{date}{hh0012}0004824.jpg',
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/APWF/SEVP_NMC_APWF_SFER_EAIRP_ACHN_LNO_P9_{date}{hh0012}0007224.jpg',
	// 全国公路气象预报图。18时发布12
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/TRFC/SEVP_NMC_TRFC_SFER_EME_ACHN_L88_P9_{date}{hh0012}0002400_XML_1.jpg',
	// 全国森林火险气象预报图。18时发布20
	'http://image.nmc.cn/product/{YYYY}/{MM}/{DD}/FHLF/SEVP_NMC_FHLF_SFER_EME_ACV_L88_P9_{date}{hh0820}0002400_XML_1.gif',
], { YYYY, MM, DD, date, hh0820, hh0012, hh0113 } );
