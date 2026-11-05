var CACHE="mofu-wars-v23-redesign-20261105";
var ASSETS=["./redesign.css","./","./index.html","./battle-worlds.webp","./battle-worlds-2.webp","./mofu-new-heroes.webp","./mofu-war-v5-hero.webp","./mofu-base-v5.webp","./mofu-gacha-v5.webp","./mofu-sprite-mofu.webp","./mofu-sprite-tama.webp","./mofu-sprite-usa.webp","./mofu-sprite-buta.webp","./mofu-sprite-nezu.webp","./mofu-sprite-hachi.webp","./mofu-sprite-hebi.webp","./mofu-sprite-doron.webp","./mofu-sprite-kyojin.webp","./mofu-sprite-dragon.webp","./mofu-sprite-oni.webp","./mofu-sprite-majin.webp","./mofu-sprite-gearboss.webp","./mofu-sprite-whale.webp","./mofu-sprite-ryu.webp","./mofu-sprite-uni.webp","./mofu-sprite-lion.webp","./mofu-sprite-majo.webp","./mofu-sprite-hoshi.webp","./mofu-sprite-niji.webp","./mofu-sprite-fenix.webp","./mofu-sprite-lumina.webp","./mofu-sprite-sol.webp","./mofu-sprite-tanuki.webp","./mofu-sprite-haku.webp","./mofu-sprite-komet.webp","./mofu-sprite-tako.webp","./mofu-sprite-same.webp","./mofu-sprite-robo.webp","./mofu-sprite-fuku.webp","./mofu-sprite-panda.webp","./mofu-sprite-hari.webp","./mofu-sprite-kame.webp","./mofu-sprite-kuma.webp","./mofu-sprite-tori.webp","./mofu-sprite-kaeru.webp","./mofu-sprite-pen.webp","./mofu-sprite-kitsu.webp","./mofu-sprite-risu.webp","./mofu-sprite-kapu.webp","./mofu-sprite-luna.webp","./mofu-sprite-mogu.webp","./mofu-sprite-goat.webp","./mofu-sprite-otter.webp","./mofu-sprite-koala.webp","./mofu-sprite-shika.webp","./mofu-sprite-hamu.webp","./manifest.webmanifest"];
ASSETS.push("./battle-impact-v12.webp");
ASSETS.push("./battle-bases-v13.webp");
ASSETS.push("./mofu-sprite-kani.webp");
ASSETS.push("./mofu-sprite-obake.webp");
ASSETS.push("./mofu-sprite-karasu.webp");
ASSETS.push("./mofu-sprite-dokuro.webp");
ASSETS.push("./mofu-sprite-gaki.webp");
ASSETS.push("./mofu-sprite-drill.webp");
ASSETS.push("./mofu-sprite-haguru.webp");
ASSETS.push("./mofu-sprite-batto.webp");
ASSETS.push("./mofu-sprite-shell.webp");
ASSETS.push("./mofu-sprite-moon.webp");
ASSETS.push("./mofu-sprite-coral.webp");
ASSETS.push("./mofu-sprite-jelly.webp");
ASSETS.push("./mofu-sprite-abyss.webp");
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf("mofu-wars-")===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  var isPage=e.request.mode==="navigate"||e.request.destination==="document";
  e.respondWith(caches.open(CACHE).then(function(c){return c.match(e.request);}).then(function(hit){
    return hit||fetch(e.request).then(function(r){
      if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy);});}return r;
    }).catch(function(){return isPage?caches.match("./index.html"):new Response("",{status:504,statusText:"Offline"});});
  }));
});
