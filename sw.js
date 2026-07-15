/* あそびのくに offline cache */
var CACHE = 'asobi-v25';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './home-world.webp',
  './mode-math.webp',
  './mode-motion.webp',
  './mode-learning.webp',
  './mode-creative.webp',
  './piano-stage-art.webp',
  './kanji-studio-art.webp',
  './rush-world.webp',
  './rush-world-candy.webp',
  './rush-world-space.webp',
  './rush-animals.webp',
  './rush-objects-a.webp',
  './rush-objects-b.webp',
  './rush-props.webp',
  './rush-success.png',
  './rush-paper.png',
  './rush-bin.png',
  './rush-art/apple.webp',
  './rush-art/baby-chick.webp',
  './rush-art/ball.webp',
  './rush-art/balloon.webp',
  './rush-art/basket.webp',
  './rush-art/bear.webp',
  './rush-art/box.webp',
  './rush-art/butterfly.webp',
  './rush-art/cake.webp',
  './rush-art/candle.webp',
  './rush-art/car.webp',
  './rush-art/cat.webp',
  './rush-art/chest.webp',
  './rush-art/chick.webp',
  './rush-art/child.webp',
  './rush-art/cow.webp',
  './rush-art/dog.webp',
  './rush-art/egg.webp',
  './rush-art/elephant.webp',
  './rush-art/fish.webp',
  './rush-art/flag.webp',
  './rush-art/flower.webp',
  './rush-art/fly.webp',
  './rush-art/frog.webp',
  './rush-art/hole.webp',
  './rush-art/lion.webp',
  './rush-art/mole.webp',
  './rush-art/net.webp',
  './rush-art/panda.webp',
  './rush-art/pig.webp',
  './rush-art/rabbit.webp',
  './rush-art/rocket.webp',
  './rush-art/sprout.webp',
  './rush-art/star.webp',
  './rush-art/umbrella.webp',
  './rush-art/key.webp',
  './rush-art/drum.webp',
  './rush-art/bell.webp',
  './rush-art/crown.webp',
  './rush-art/wand.webp',
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
