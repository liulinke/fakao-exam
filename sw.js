// Service Worker：离线缓存（新增题库/脚本后记得把版本号 +1，触发缓存更新）
const CACHE_VERSION = "fk-v2";

// 需要预缓存的静态资源（相对当前 sw.js 所在目录，兼容部署在子路径下的情况）
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./exam.html",
  "./practice.html",
  "./result.html",
  "./review.html",
  "./stats.html",
  "./manifest.json",
  "./css/main.css",
  "./js/app.js",
  "./js/bank.js",
  "./js/exam.js",
  "./js/grader.js",
  "./js/paper.js",
  "./js/practice.js",
  "./js/qrender.js",
  "./js/result.js",
  "./js/review.js",
  "./js/stats.js",
  "./data/config.js",
  "./data/bank/_all.js",
  "./data/bank/falixue.js",
  "./data/bank/falvshi.js",
  "./data/bank/guojifa.js",
  "./data/bank/guojijingjifa.js",
  "./data/bank/guojisifa.js",
  "./data/bank/huanjing.js",
  "./data/bank/jingjifa.js",
  "./data/bank/laodong.js",
  "./data/bank/minfa.js",
  "./data/bank/minsu.js",
  "./data/bank/shangfa.js",
  "./data/bank/sifazhidu.js",
  "./data/bank/xianfa.js",
  "./data/bank/xingfa.js",
  "./data/bank/xingsu.js",
  "./data/bank/xingzheng.js",
  "./data/bank/zhishichanquan.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-180.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 策略：命中缓存直接返回并在后台静默更新（stale-while-revalidate）；未命中则回落网络，
// 网络也失败时（例如离线状态下的未知页面）用首页兜底，保证「打开即用」。
// 页面路由参数（如 exam.html?paper=j1、result.html?rec=2）不影响静态资源本身，
// 缓存时统一去掉查询串作为 key，避免离线时命中不到而误回退到首页。
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  const cacheKey = req.url.split("?")[0];

  event.respondWith(
    caches.match(cacheKey).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(cacheKey, copy));
        }
        return res;
      }).catch(() => cached || caches.match("./index.html"));
      return cached || network;
    })
  );
});
