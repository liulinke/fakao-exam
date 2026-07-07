// 法考模拟 · 全局配置（科目配额、题型配额、时长、合格线）
window.FK_CONFIG = {
  version: "2026-07",
  passLinePerPaper: 90, // 单卷达标参考线（全国合格线为两卷合计180）
  subjects: {
    xingfa:        { name: "刑法",                 paper: "j1" },
    xingsu:        { name: "刑事诉讼法",           paper: "j1" },
    xingzheng:     { name: "行政法与行政诉讼法",   paper: "j1" },
    falixue:       { name: "法理学（含法治思想）", paper: "j1" },
    xianfa:        { name: "宪法",                 paper: "j1" },
    guojifa:       { name: "国际法",               paper: "j1" },
    sifazhidu:     { name: "司法制度与职业道德",   paper: "j1" },
    falvshi:       { name: "中国法律史",           paper: "j1" },
    minfa:         { name: "民法",                 paper: "j2" },
    minsu:         { name: "民事诉讼法（含仲裁）", paper: "j2" },
    shangfa:       { name: "商法",                 paper: "j2" },
    jingjifa:      { name: "经济法",               paper: "j2" },
    zhishichanquan:{ name: "知识产权法",           paper: "j2" },
    guojisifa:     { name: "国际私法",             paper: "j2" },
    guojijingjifa: { name: "国际经济法",           paper: "j2" },
    huanjing:      { name: "环境资源法",           paper: "j2" },
    laodong:       { name: "劳动与社会保障法",     paper: "j2" }
  },
  papers: {
    j1: {
      name: "试卷一",
      quotas: { // 整卷100题配额
        full: { xingfa: 22, xingsu: 22, xingzheng: 20, falixue: 12, xianfa: 8, guojifa: 5, sifazhidu: 6, falvshi: 5 },
        half: { xingfa: 11, xingsu: 11, xingzheng: 10, falixue: 6, xianfa: 4, guojifa: 3, sifazhidu: 3, falvshi: 2 }
      }
    },
    j2: {
      name: "试卷二",
      quotas: {
        full: { minfa: 28, minsu: 24, shangfa: 18, jingjifa: 8, zhishichanquan: 6, guojisifa: 5, guojijingjifa: 5, huanjing: 3, laodong: 3 },
        half: { minfa: 14, minsu: 12, shangfa: 9, jingjifa: 4, zhishichanquan: 3, guojisifa: 2, guojijingjifa: 2, huanjing: 2, laodong: 2 }
      }
    }
  },
  scales: {
    full: { label: "整卷（100题 / 180分钟）", count: 100, minutes: 180, typeTargets: { single: 50, multi: 35, indeterminate: 15 } },
    half: { label: "半卷（50题 / 90分钟）",   count: 50,  minutes: 90,  typeTargets: { single: 25, multi: 17, indeterminate: 8 } }
  },
  typeNames: { single: "单项选择题", multi: "多项选择题", indeterminate: "不定项选择题" },
  typeScore: { single: 1, multi: 2, indeterminate: 2 }
};
