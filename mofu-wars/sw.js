var CACHE="mofu-wars-v6-save-schema-20260722";
var ASSETS=["./","./index.html","./battle-worlds.webp","./battle-worlds-2.webp","./mofu-new-heroes.webp","./manifest.webmanifest"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(function(hit){
    return hit||fetch(e.request).then(function(r){
      var copy=r.clone(); caches.open(CACHE).then(function(c){c.put(e.request,copy);}); return r;
    }).catch(function(){return caches.match("./index.html");});
  }));
});
