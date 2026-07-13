/* あそびのくに offline cache */
var CACHE = 'asobi-v9';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './audio/playlist.json',
  './audio/きらきら星.mp3',
  './audio/エリーゼのために.mp3',
  './audio/トルコ行進曲.mp3',
  './audio/ハッピーバースデートゥユー.mp3',
  './audio/パターン1.mp3',
  './audio/パターン2.mp3',
  './audio/パターン3.mp3',
  './audio/パターン4.mp3',
  './audio/パターン5.mp3',
  './audio/喜びの歌.mp3',
  './audio/夜の女王のアリア.mp3'
];
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS.map(function(u){return encodeURI(u);})); })
      .then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      if (r) return r;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }).catch(function () { return caches.match('./index.html'); })
  );
});
