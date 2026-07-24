/* あそびのくに offline cache */
var CACHE = 'asobi-v80-quality17-piano-tone';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './home-world.webp',
  './home-mode-icons-v1.png',
  './mode-math.webp',
  './mode-motion.webp',
  './mode-learning.webp',
  './mode-creative.webp',
  './piano-stage-art.webp',
  './kanji-studio-art.webp',
  './coloring-atlas-v1.png',
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
  './mofu-wars/',
  './mofu-wars/index.html',
  './mofu-wars/battle-worlds.webp',
  './mofu-wars/battle-worlds-2.webp',
  './mofu-wars/battle-impact-v12.webp',
  './mofu-wars/battle-bases-v13.webp',
  './mofu-wars/mofu-new-heroes.webp',
  './mofu-wars/mofu-war-v5-hero.webp',
  './mofu-wars/mofu-base-v5.webp',
  './mofu-wars/mofu-gacha-v5.webp',
  './mofu-wars/mofu-sprite-mofu.webp',
  './mofu-wars/mofu-sprite-tama.webp',
  './mofu-wars/mofu-sprite-usa.webp',
  './mofu-wars/mofu-sprite-buta.webp',
  './mofu-wars/mofu-sprite-nezu.webp',
  './mofu-wars/mofu-sprite-hachi.webp',
  './mofu-wars/mofu-sprite-hebi.webp',
  './mofu-wars/mofu-sprite-doron.webp',
  './mofu-wars/mofu-sprite-kyojin.webp',
  './mofu-wars/mofu-sprite-dragon.webp',
  './mofu-wars/mofu-sprite-oni.webp',
  './mofu-wars/mofu-sprite-majin.webp',
  './mofu-wars/mofu-sprite-gearboss.webp',
  './mofu-wars/mofu-sprite-whale.webp',
  './mofu-wars/mofu-sprite-ryu.webp',
  './mofu-wars/mofu-sprite-uni.webp',
  './mofu-wars/mofu-sprite-lion.webp',
  './mofu-wars/mofu-sprite-majo.webp',
  './mofu-wars/mofu-sprite-hoshi.webp',
  './mofu-wars/mofu-sprite-niji.webp',
  './mofu-wars/mofu-sprite-fenix.webp',
  './mofu-wars/mofu-sprite-lumina.webp',
  './mofu-wars/mofu-sprite-sol.webp',
  './mofu-wars/mofu-sprite-tanuki.webp',
  './mofu-wars/mofu-sprite-haku.webp',
  './mofu-wars/mofu-sprite-komet.webp',
  './mofu-wars/mofu-sprite-tako.webp',
  './mofu-wars/mofu-sprite-same.webp',
  './mofu-wars/mofu-sprite-robo.webp',
  './mofu-wars/mofu-sprite-fuku.webp',
  './mofu-wars/mofu-sprite-panda.webp',
  './mofu-wars/mofu-sprite-hari.webp',
  './mofu-wars/mofu-sprite-kame.webp',
  './mofu-wars/mofu-sprite-kuma.webp',
  './mofu-wars/mofu-sprite-tori.webp',
  './mofu-wars/mofu-sprite-kaeru.webp',
  './mofu-wars/mofu-sprite-pen.webp',
  './mofu-wars/mofu-sprite-kitsu.webp',
  './mofu-wars/mofu-sprite-risu.webp',
  './mofu-wars/mofu-sprite-kapu.webp',
  './mofu-wars/mofu-sprite-luna.webp',
  './mofu-wars/mofu-sprite-mogu.webp',
  './mofu-wars/mofu-sprite-goat.webp',
  './mofu-wars/mofu-sprite-otter.webp',
  './mofu-wars/mofu-sprite-koala.webp',
  './mofu-wars/mofu-sprite-shika.webp',
  './mofu-wars/mofu-sprite-hamu.webp',
  './mofu-wars/mofu-sprite-kani.webp',
  './mofu-wars/mofu-sprite-obake.webp',
  './mofu-wars/mofu-sprite-karasu.webp',
  './mofu-wars/mofu-sprite-dokuro.webp',
  './mofu-wars/mofu-sprite-gaki.webp',
  './mofu-wars/mofu-sprite-drill.webp',
  './mofu-wars/mofu-sprite-haguru.webp',
  './mofu-wars/mofu-sprite-batto.webp',
  './mofu-wars/mofu-sprite-shell.webp',
  './mofu-wars/mofu-sprite-moon.webp',
  './mofu-wars/mofu-sprite-coral.webp',
  './mofu-wars/mofu-sprite-jelly.webp',
  './mofu-wars/mofu-sprite-abyss.webp',
  './mofu-wars/manifest.webmanifest',
  './mofu-wars/sw.js',
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
  var url = new URL(e.request.url);
  var isPage = e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    /\/index\.html$/.test(url.pathname);
  if (isPage) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) {
          return r || caches.match('./');
        });
      })
    );
    return;
  }
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
