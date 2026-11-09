const fs=require('fs');
const path=require('path');

const assetRoot=path.resolve(process.argv[2]||__dirname);
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.webmanifest'),'utf8'));
const errors=[],warnings=[];
const markup=html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi,'');

function uniq(a){return [...new Set(a)];}
function cleanRef(s){
  s=String(s||'').trim().replace(/^['"]|['"]$/g,'').split(/[?#]/)[0];
  if(!s||s==='.'||s==='/'||/^(data:|blob:|https?:|#)/i.test(s))return '';
  return decodeURI(s.replace(/^\.\//,'').replace(/^\//,''));
}
function resolveRef(ref){
  const staged=path.join(__dirname,ref);
  return fs.existsSync(staged)?staged:path.join(assetRoot,ref);
}
function exists(ref){return fs.existsSync(resolveRef(ref));}

const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const allIds=uniq([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const idCounts={};for(const id of ids)idCounts[id]=(idCounts[id]||0)+1;
const duplicateIds=Object.keys(idCounts).filter(id=>idCounts[id]>1);
if(duplicateIds.length)errors.push('duplicate ids: '+duplicateIds.join(', '));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(let i=0;i<scripts.length;i++){
  try{new Function(scripts[i]);}catch(e){errors.push(`script ${i+1} syntax: ${e.message}`);}
}

const screens=uniq([...markup.matchAll(/\bid="scr-([^"]+)"/g)].map(m=>m[1]));
const goTargets=uniq([...markup.matchAll(/\bdata-go="([^"]+)"/g)].map(m=>m[1]));
const missingScreens=goTargets.filter(x=>!screens.includes(x));
if(missingScreens.length)errors.push('data-go without screen: '+missingScreens.join(', '));

const hookNames=uniq([...html.matchAll(/\bhooks\.([a-zA-Z0-9_-]+)\s*=/g)].map(m=>m[1]));
const missingHooks=screens.filter(x=>x!=='home'&&!hookNames.includes(x));
if(missingHooks.length)warnings.push('screens without explicit hook: '+missingHooks.join(', '));

const selectorIds=uniq([...html.matchAll(/\$\(\s*['"]#([a-zA-Z0-9_-]+)['"]\s*\)/g)].map(m=>m[1]));
const missingSelectorIds=selectorIds.filter(id=>!allIds.includes(id));
if(missingSelectorIds.length)errors.push('script selectors without element: '+missingSelectorIds.join(', '));

// Creative-mode safety and clarity regressions.
for(const id of ['gallery-count','gallery-view','gallery-view-img','gallery-view-close','gallery-view-photo','gallery-view-delete','save-help']){
  if(!allIds.includes(id))errors.push('creative UI control missing: '+id);
}
if(/>\s*📷\s*ARカメラ\s*</.test(markup))errors.push('3D camera overlay is mislabeled as AR');
if(!/hooks\.gallery=\{enter:GALLERY\.enter,leave:GALLERY\.leave\}/.test(html))errors.push('gallery viewer is not closed when leaving');
if(!/coClear\.addEventListener[\s\S]*?もういちど おして/.test(html))errors.push('coloring clear lacks two-step confirmation');
if(!/d3Clear\.addEventListener[\s\S]*?もういちど おして/.test(html))errors.push('3D clear lacks two-step confirmation');
if(!/function askDelete\([\s\S]*?もういちどで けす/.test(html))errors.push('gallery delete lacks two-step confirmation');
for(const id of ['uta-meter','uta-meter-label','uta-now']){
  if(!allIds.includes(id))errors.push('song studio status control missing: '+id);
}
if(/function startRec\(\)\{\s*stopAll\(\)/.test(html))errors.push('recording incorrectly stops karaoke accompaniment');
if(!/function startRec\(\)\{\s*stopTake\(\)/.test(html))errors.push('recording does not stop prior take playback safely');
if(!/hooks\.uta=\{enter:UT\.enter,leave:UT\.leave\}/.test(html))errors.push('song studio does not stop microphone/audio on navigation');
if(!/function leave\(\)\{[\s\S]*?recRequest\+\+[\s\S]*?setSongRecVolume\(false\)[\s\S]*?if\(rec\)stopRec\(\);else stopMeter\(\);stopAll\(\);\}/.test(html))errors.push('song studio leave cleanup is incomplete');
if(!/requestId!==recRequest\|\|cur!=='uta'/.test(html))errors.push('pending microphone permission can start recording off-screen');
if(!/take-delete[\s\S]*?ほんとうに？/.test(html))errors.push('recorded take delete lacks clear two-step confirmation');
for(const id of ['pn-road','pn-road-cv','pn-judge']){
  if(!allIds.includes(id))errors.push('piano timing control missing: '+id);
}
if(!/performance\.now\(\)[\s\S]*?stepDue/.test(html))errors.push('piano timing does not use a monotonic clock');
if(!/delta<0[\s\S]*?もうすこし まって/.test(html))errors.push('piano early-note guidance missing');
if(!/function roadLoop\(\)[\s\S]*?requestAnimationFrame/.test(html))errors.push('piano falling-note animation loop missing');
if(!/classList\.toggle\('ready',now>=stepDue-420\)/.test(html))errors.push('piano keys do not switch from next to now at the timing line');
for(const id of ['home-net','set-backup','set-restore','set-restore-file','set-data-status','app-update','app-update-now']){
  if(!allIds.includes(id))errors.push('app continuity control missing: '+id);
}
if(!/localStorage\.setItem\('asobi-last-mode-v1',name\)/.test(html))errors.push('last home mode is not remembered');
if(!/hooks\.home=\{enter:function\(\)\{UT\.stopAll\(\);HOME\.enter\(\);PWA\.network\(\);\}\}/.test(html))errors.push('home progress is not refreshed on return');
if(!/\^\(asobi-\|mofu-wars-\)/.test(html))errors.push('backup does not include both app and mofuWar records');
if(!/もういちど押して復旧/.test(html))errors.push('backup restore lacks two-step confirmation');
if(!/navigator\.serviceWorker\.addEventListener\('controllerchange'/.test(html))errors.push('service-worker update readiness is not surfaced');
for(const id of ['kz-undo','kz-pack','kz-status','kz-win','kz-win-num','kz-win-expr']){
  if(!allIds.includes(id))errors.push('number-block quality control missing: '+id);
}
if(!/function remember\(before\)[\s\S]*?history\.push\(before\)/.test(html))errors.push('number-block undo does not preserve prior layouts');
if(!/asobi-kazu-clears-v1/.test(html))errors.push('number-block solved missions are not saved');
if(!/ここに ぺたっ/.test(html))errors.push('number-block placement preview lacks a visible cue');
for(const id of ['ks-level','ks-next-five','ks-five','ks-streak','ks-coach']){
  if(!allIds.includes(id))errors.push('calculation learning control missing: '+id);
}
if(!/asobi-keisan-level-v1/.test(html))errors.push('calculation difficulty is not saved');
if(!/function renderHint\(automatic\)[\s\S]*?ks-hint-copy/.test(html))errors.push('calculation hint lacks a plain-language explanation');
if(!/だいじょうぶ。こたえが 3つに しぼれたよ/.test(html))errors.push('calculation retry feedback is not encouraging');
for(const id of ['pn-result','pn-result-rank','pn-result-title','pn-result-song','pn-result-message','pn-result-perfect','pn-result-good','pn-result-guide','pn-result-retry','pn-result-close']){
  if(!allIds.includes(id))errors.push('piano result control missing: '+id);
}
if(!/asobi-piano-best-v1/.test(html))errors.push('piano best performances are not saved');
if(!/function rankFor\(total\)[\s\S]*?リズムの ほうせき/.test(html))errors.push('piano performance rank is missing');
if(!/function saveResult\(total,rank\)[\s\S]*?updateSongBadges/.test(html))errors.push('piano result does not update song badges');
if(!/var answerPreview=b;[\s\S]*?brain-explain-answer/.test(html))errors.push('brain explanation does not retain the correct visual answer');
if(!/sfx\('pop'\);b\.disabled=true[\s\S]*?つに しぼれたよ/.test(html))errors.push('brain retry does not narrow choices gently');
if(!/APP_VERSION='2026\.11\.09-special-star'/.test(html))errors.push('visible app version is stale');
if(!/k\.indexOf\('asobi-'\)\s*===\s*0\s*&&\s*k\s*!==\s*CACHE/.test(sw))errors.push('main service worker can delete sibling app caches');
if(/c\.put\('\.\/index\.html',\s*copy\)/.test(sw))errors.push('main service worker can overwrite the app shell with a child page');
if(!/new Response\('',\s*\{\s*status:\s*504/.test(sw))errors.push('main service worker returns HTML when an offline asset is missing');
if(!/function syncAppViewport\(\)[\s\S]*?visualViewport/.test(html))errors.push('dynamic Android viewport sizing is missing');
const homeMarkup=(markup.match(/<div id="scr-home"[\s\S]*?<\/div>\s*<\/div>\s*<div id="scr-kazu"/)||[''])[0];
if((homeMarkup.match(/class="home-card"/g)||[]).length!==15)errors.push('home screen does not contain exactly fifteen mode cards');
if(!/--home-cols:5;--home-rows:3/.test(html)||!/#scr-home\.home-portrait\{--home-cols:3;--home-rows:5\}/.test(html))errors.push('home screen does not use exact landscape and portrait tile grids');
if(!/home\.classList\.toggle\('home-portrait',h>=w\)/.test(html)||!/home\.classList\.toggle\('home-compact',h<720\)/.test(html))errors.push('home layout does not follow the live viewport');
if(!/grid-column:auto!important;min-width:0!important;min-height:0!important/.test(html))errors.push('home cards can still expand beyond their assigned tile');
if(!/brain-route-step[\s\S]*?brain-route-arrow/.test(html))errors.push('brain route uses no font-independent arrows');
if(!/function rotateQ\(\)[\s\S]*?turnArrowSvg[\s\S]*?brain-quarter-turn/.test(html))errors.push('brain rotation does not use a durable curved arrow');
if(/function rotateQ\(\)[\s\S]*?(?:90ど|90°)/.test(html))errors.push('brain rotation still uses difficult angle wording');
if(!/data-brain-level="1"[\s\S]*?data-brain-level="2"[\s\S]*?data-brain-level="3"/.test(markup))errors.push('brain lab does not expose three difficulty levels');
if(/toyCell\s*\(/.test(html))errors.push('removed Koro renderer is still called');
if(!/function raf\(ts\)[\s\S]*?finally\{[\s\S]*?requestAnimationFrame\(raf\)/.test(html))errors.push('global animation loop cannot recover after a mode error');
for(const id of ['sampler-grid','sampler-status','sampler-clear'])if(!allIds.includes(id))errors.push('sampler UI control missing: '+id);
if(!/for\(var i=0;i<10;i\+\+\)/.test(html))errors.push('sampler does not build ten pads');
if(!/hooks\.sampler=\{enter:SAMPLER\.enter,leave:SAMPLER\.leave\}/.test(html))errors.push('sampler microphone cleanup is missing');
if(!/className='take-save'[\s\S]*?saveTake\(t\)/.test(html))errors.push('recorded takes cannot be saved to the device');
if(!/function press\(id,btn,groupSize\)\{\s*try\{if\(window\.speechSynthesis&&\(window\.speechSynthesis\.speaking\|\|window\.speechSynthesis\.pending\)\)window\.speechSynthesis\.cancel\(\)/.test(html))errors.push('active piano speech does not stop on key touch');
if(/function timing\(delta\)[\s\S]*?sfx\(/.test((html.match(/function timing\(delta\)[\s\S]*?function freqFor/)||[''])[0]))errors.push('piano timing still adds a beep over played notes');
if(/function playNote\(id\)[\s\S]*?f\*2/.test((html.match(/function playNote\(id\)[\s\S]*?function clearLights/)||[''])[0]))errors.push('piano notes still include the high ping layer');
const pianoStart=(html.match(/function startSong\(song\)[\s\S]*?function makeSongs/)||[''])[0];
if(/sfx\(|speak\(/.test(pianoStart))errors.push('piano song selection still produces automatic sound or speech');
const pianoOutputBlock=(html.match(/function pianoOutput\(c\)[\s\S]*?function playNote/)||[''])[0];
if(/createDynamicsCompressor/.test(pianoOutputBlock))errors.push('piano still uses a pumping compressor');
if(!/pianoToneFilter\.frequency\.setValueAtTime\(7600/.test(pianoOutputBlock))errors.push('piano has no bright shared tone output');
const pianoNoteBlock=(html.match(/function playNote\(id,groupSize\)[\s\S]*?function clearLights/)||[''])[0];
const pianoSamplerBlock=(html.match(/var PIANO_SAMPLES=\[[\s\S]*?function playNote\(id,groupSize\)[\s\S]*?function clearLights/)||[''])[0];
if((pianoSamplerBlock.match(/audio\/piano\/[A-Za-z0-9]+\.mp3/g)||[]).length!==9)errors.push('piano sample set must contain nine lightweight anchors');
if(!/function preloadPiano\(\)[\s\S]*?Promise\.all\(PIANO_SAMPLES\.map/.test(pianoSamplerBlock))errors.push('piano samples are not preloaded as one consistent tone set');
if(!/function playSampleNote\(id,groupSize,c,t\)[\s\S]*?createBufferSource/.test(pianoSamplerBlock))errors.push('piano does not use decoded grand-piano samples');
if(!/function playFallbackNote\(id,groupSize,c,t\)[\s\S]*?createOscillator/.test(pianoSamplerBlock))errors.push('piano has no offline-safe synth fallback');
if(!/function voiceShare\(c,t,trim,groupSize,life,source\)[\s\S]*?chordScale=1\/\(1\+\.34\*\(chordSize-1\)\)/.test(pianoSamplerBlock))errors.push('piano chords have no overload-safe gain sharing');
if(!/while\(pianoVoices\.length>22\)quietPianoVoice\(pianoVoices\.shift\(\)/.test(pianoSamplerBlock))errors.push('piano glissando has no voice cap for older devices');
if(!/pianoSampleState==='loading'[\s\S]*?return false/.test(pianoNoteBlock))errors.push('piano can change timbre during initial sample loading');
if(!/var oldStep=step,nextDue=stepDue\+beatFor\(current,oldStep\)\*beatMs[\s\S]*?stepDue=Math\.max\(nextDue/.test(html))errors.push('piano advances the visual note before updating its due time');
if(!/indexedDB\.open\('asobi-uta-album-v1'/.test(html))errors.push('recording album is not persisted in app storage');
if(!/id="uta-export-album"/.test(markup)||!/function zipAlbum\(rows\)/.test(html))errors.push('recording album cannot be exported as one archive');
if(!/id="uta-clear-album"/.test(markup)||!/objectStore\('recordings'\)\.clear\(\)/.test(html))errors.push('recording album cannot be cleared in app');
if(!/delDefault=t\.savedId\?'🗑':'×'/.test(html)||!/function deleteFromAlbum\(id\)[\s\S]*?tx\.oncomplete/.test(html))errors.push('saved recordings do not have a reliable individual delete control');
if(!/albumClearAt=now;b\.textContent='ほんとうに？'/.test(html)||!/もういちど「ほんとうに？」を おすと ぜんぶ きえるよ/.test(html))errors.push('recording album clear has no clear two-step confirmation');
if(!/function playSampleNote\(id,groupSize,c,t\)[\s\S]*?source\.buffer=buffer/.test(html))errors.push('piano grand-piano main tone is missing');
if(!/createMediaElementSource\(a\)/.test(html)||!/function releaseSongAfterMic\(\)/.test(html))errors.push('karaoke volume is not controlled through a dedicated gain stage');
if(!/function foldMirror\(arr\)[\s\S]*?function symmetry\(\)/.test(html))errors.push('brain folding task is not a mirror-fold problem');
if(!/function orderSize\(\)[\s\S]*?shuf\(sizes\)[\s\S]*?v===mid/.test(html))errors.push('brain size task has no unique median');
if(/koro-toy-parts-v1\.png|krToyArt|drawToyPart/.test(html+sw))errors.push('Koro Koro still uses pseudo-3D toy art');
const d3Shapes=uniq([...markup.matchAll(/\bdata-shape="([^"]+)"/g)].map(m=>m[1]));
if(d3Shapes.length<6)errors.push('3D drawing has too few genuine surface choices: '+d3Shapes.length);
if(/pendingShape|resetShapeConfirm/.test(html))errors.push('3D model switching still requires a confusing second tap');
for(const primitive of ['sphere','cube','cylinder','cone','donut','egg']){
  if(!d3Shapes.includes(primitive))errors.push('3D primitive missing: '+primitive);
}
for(const builder of ['sphereGeom','cubeGeom','cylinderGeom','coneGeom','torusGeom']){
  if(!new RegExp('function '+builder+'\\(').test(html))errors.push('3D surface builder missing: '+builder);
}
const d3Render=(html.match(/function render\(\)\{if\(!W\)return;var c=center\(\),base=surfaceColors[\s\S]*?\n  function pos/)||[''])[0];
if(!/geometry\(\)\.map[\s\S]*?views\.sort/.test(d3Render))errors.push('3D renderer is not depth-sorting real surface triangles');
if(/drawModel\(c,m\)/.test(d3Render))errors.push('3D renderer still uses the old pseudo-3D illustration');
const d3Pick=(html.match(/function surface\(p\)\{var c=center\(\),best=null[\s\S]*?\n  cv\.addEventListener/)||[''])[0];
if(!/w1[\s\S]*?w2[\s\S]*?w3[\s\S]*?nn\[2\]/.test(d3Pick))errors.push('3D drawing does not pick and store a point plus surface normal');

const refs=[];
for(const m of html.matchAll(/\b(?:src|href)="([^"]+)"/gi))refs.push(cleanRef(m[1]));
for(const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi))refs.push(cleanRef(m[1]));
for(const m of html.matchAll(/['"](\.?\/?[\w\u3000-\u9fff@%+.,()・ーぁ-んァ-ヶ一-龠 -]+\.(?:png|webp|jpg|jpeg|gif|svg|mp3|m4a|wav|json|webmanifest))['"]/gi))refs.push(cleanRef(m[1]));
const staticRefs=uniq(refs.filter(Boolean).filter(x=>!x.includes('${')&&!x.includes('+')&&!x.includes('.url')&&!x.includes('.blob')&&!/^image\//i.test(x)&&x!=='blob'&&x!=='url'));
const missingRefs=staticRefs.filter(x=>!exists(x));
if(missingRefs.length)errors.push('missing referenced assets: '+missingRefs.join(', '));

const swRefs=uniq([...sw.matchAll(/['"](\.\/[^'"]+)['"]/g)].map(m=>cleanRef(m[1])).filter(Boolean));
const missingSw=swRefs.filter(x=>!exists(x));
if(missingSw.length)errors.push('missing service-worker assets: '+missingSw.join(', '));
const notOffline=staticRefs.filter(x=>!swRefs.includes(x)&&!['index.html','manifest.webmanifest'].includes(x));
if(notOffline.length)errors.push('referenced but not precached: '+notOffline.join(', '));

const childSwFile=resolveRef('mofu-wars/sw.js');
let childSwRefs=[];
if(fs.existsSync(childSwFile)){
  const childSw=fs.readFileSync(childSwFile,'utf8');
  if(!/k\.indexOf\("mofu-wars-"\)\s*===\s*0\s*&&\s*k\s*!==\s*CACHE/.test(childSw))errors.push('child service worker can delete the main app cache');
  if(!/new Response\("",\{status:504/.test(childSw))errors.push('child service worker returns HTML when an offline asset is missing');
  childSwRefs=uniq([...childSw.matchAll(/['"](\.\/[^'"]+)['"]/g)]
    .map(m=>cleanRef(m[1]))
    .filter(Boolean)
    .map(x=>'mofu-wars/'+x));
  if(/['"]\.\/['"]/.test(childSw))childSwRefs.unshift('mofu-wars/');
  childSwRefs=uniq(childSwRefs);
  const childNotInParent=childSwRefs.filter(x=>!swRefs.includes(x));
  if(childNotInParent.length)errors.push('child app assets not in parent precache: '+childNotInParent.join(', '));
}else warnings.push('mofu-wars service worker not found');

const manifestIcons=(manifest.icons||[]).map(x=>cleanRef(x.src));
const missingIcons=manifestIcons.filter(x=>!exists(x));
if(missingIcons.length)errors.push('missing manifest icons: '+missingIcons.join(', '));
if(manifest.display!=='standalone'&&manifest.display!=='fullscreen')warnings.push('manifest display is '+manifest.display);

function readLiteral(label,re){
  const m=html.match(re);
  if(!m){errors.push('content block not found: '+label);return null;}
  try{return Function('"use strict";return ('+m[1]+');')();}
  catch(e){errors.push('content block invalid: '+label+' ('+e.message+')');return null;}
}
const content={};
const grade1='一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六'.split('');
const kanjiItems=require('./world-core.js').kanji.concat([['小林 楽','こばやし らく',true]]);
const kanjiStrokes=readLiteral('kanji strokes',/var KANJI_STROKES=(\{[\s\S]*?\});\s*\/\* KANJIVG_DATA_END/);
const kanaRows=readLiteral('kana rows',/var KANA_ROWS=(\[[\s\S]*?\]);\s*function makeKanaMode/);
const kanaStrokes=readLiteral('kana strokes',/var KANA_STROKES=(\{[\s\S]*?\});\s*\/\* =+ なぞり書き/);
const latinNameStrokes=readLiteral('latin name strokes',/var LATIN_NAME_STROKES=(\{[\s\S]*?\});\s*\/\* ---- ABC/);
const pianoSongs=readLiteral('piano songs',/var SONGS=(\[[\s\S]*?\]);\s*function stepsFor/);
const brainMeta=readLiteral('brain game metadata',/var GAME_META=(\[[\s\S]*?\]);\s*var ROUTES/);
const brainRoutes=readLiteral('brain routes',/var ROUTES=(\[[\s\S]*?\]);\s*var TOP_FORMS/);
const brainTopForms=readLiteral('brain top forms',/var TOP_FORMS=(\[[\s\S]*?\]);\s*var ODD_SETS/);
const brainOddSets=readLiteral('brain odd sets',/var ODD_SETS=(\[[\s\S]*?\]);\s*var PAIR_SETS/);
const brainPairSets=readLiteral('brain pair sets',/var PAIR_SETS=(\[[\s\S]*?\]);\s*try\{/);
if(kanjiStrokes){
  for(const m of html.matchAll(/KANJI_STROKES\[['"]([^'"]+)['"]\]\s*=(\[[\s\S]*?\]);/g)){
    try{kanjiStrokes[m[1]]=Function('"use strict";return ('+m[2]+');')();}
    catch(e){errors.push('kanji stroke extension invalid: '+m[1]);}
  }
}
if(kanjiItems&&kanjiStrokes){
  const listed=kanjiItems.map(x=>x[0]);
  const single=listed.filter(x=>x.length===1);
  const missingGrade1=grade1.filter(x=>!single.includes(x));
  const extraGrade1=single.filter(x=>!grade1.includes(x)&&x!=='楽');
  const missingKanjiStrokes=single.filter(x=>!Array.isArray(kanjiStrokes[x])||!kanjiStrokes[x].length);
  if(missingGrade1.length)errors.push('grade-1 kanji missing: '+missingGrade1.join(''));
  if(extraGrade1.length)warnings.push('extra single kanji: '+extraGrade1.join(''));
  if(missingKanjiStrokes.length)errors.push('kanji without stroke data: '+missingKanjiStrokes.join(''));
  if(!listed.includes('楽')||!listed.includes('小林 楽'))errors.push('requested kanji bonus panels missing');
  content.kanjiPanels=listed.length;
  content.grade1Kanji=single.filter(x=>grade1.includes(x)).length;
}
if(kanaRows&&kanaStrokes){
  const hira=kanaRows.map(x=>x[0]),kata=kanaRows.map(x=>x[1]),kana=hira.concat(kata);
  const missingKanaStrokes=kana.filter(x=>!Array.isArray(kanaStrokes[x])||!kanaStrokes[x].length);
  if(hira.length!==46||kata.length!==46)errors.push('kana row count is not 46');
  if(missingKanaStrokes.length)errors.push('kana without stroke data: '+missingKanaStrokes.join(''));
  content.hiragana=hira.length;
  content.katakana=kata.length;
}
if(latinNameStrokes){
  const missingLuck='LUCK'.split('').filter(x=>!Array.isArray(latinNameStrokes[x])||!latinNameStrokes[x].length);
  if(missingLuck.length)errors.push('LUCK stroke data missing: '+missingLuck.join(''));
}
if(pianoSongs){
  const ids={},badNotes=[],emptySongs=[],badTempos=[];
  pianoSongs.forEach(function(song){
    if(ids[song.id])errors.push('duplicate piano song id: '+song.id);
    ids[song.id]=1;
    const steps=Array.isArray(song.steps)?song.steps:(song.notes||[]).map(x=>[x]);
    if(!steps.length)emptySongs.push(song.id);
    if(!Number.isFinite(song.tempo)||song.tempo<60||song.tempo>180)badTempos.push(song.id);
    steps.forEach(function(step){step.forEach(function(note){if(!Number.isInteger(note)||note<0||note>24)badNotes.push(song.id+':'+note);});});
  });
  if(emptySongs.length)errors.push('empty piano songs: '+emptySongs.join(', '));
  if(badNotes.length)errors.push('piano notes outside two octaves: '+badNotes.join(', '));
  if(badTempos.length)errors.push('piano practice tempo invalid: '+badTempos.join(', '));
  content.pianoSongs=pianoSongs.length;
  content.pianoTimingSongs=pianoSongs.length-badTempos.length;
}
if(brainMeta&&brainRoutes&&brainTopForms&&brainOddSets&&brainPairSets){
  const expected=['pattern','space','matrix','odd','count','mirror','route','memory','rotate','order','pair','shadow','symmetry','balance','topview','sudoku'];
  const keys=brainMeta.map(x=>x.k),missingKinds=expected.filter(x=>!keys.includes(x));
  if(brainMeta.length!==expected.length||missingKinds.length)errors.push('brain metadata mismatch: '+missingKinds.join(', '));
  brainMeta.forEach(function(x,i){if(!x.i||!x.n||!x.d)errors.push('brain metadata incomplete: '+i);});
  brainRoutes.forEach(function(route,i){
    let p=4;
    for(const move of route.m){
      const x=p%3,y=Math.floor(p/3);
      if(move==='→'&&x<2)p++;else if(move==='←'&&x>0)p--;else if(move==='↑'&&y>0)p-=3;else if(move==='↓'&&y<2)p+=3;else errors.push('brain route leaves grid: '+i);
    }
    if(p!==route.e)errors.push('brain route endpoint mismatch: '+i);
  });
  brainTopForms.forEach(function(form,i){
    const cubes=new Set(form.map(p=>p.join(',')));
    if(cubes.size!==form.length)errors.push('brain top duplicate cube: '+i);
    form.forEach(function(p){if(p[1]>0&&!cubes.has(p[0]+','+(p[1]-1)+','+p[2]))errors.push('brain top unsupported cube: '+i);});
    const floor=new Set(form.map(p=>p[0]+','+p[2]));
    if(floor.size<2||floor.size>9)errors.push('brain top invalid footprint: '+i);
    const normalized=[...floor].map(s=>s.split(',').map(Number));
    const minX=Math.min(...normalized.map(p=>p[0])),minZ=Math.min(...normalized.map(p=>p[1]));
    const footprint=normalized.map(p=>[p[0]-minX,p[1]-minZ]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]).map(p=>p.join(',')).join('|');
    const expectedFootprints=['0,0|1,0|0,1','0,0|1,0|2,0|1,1','0,0|1,0|1,1|2,1'];
    if(footprint!==expectedFootprints[i])errors.push('brain top footprint changed: '+i+' '+footprint);
  });
  brainOddSets.forEach(function(set,i){
    if(set.a.length!==4||new Set(set.a).size!==4||set.bad<0||set.bad>3||!set.why)errors.push('brain odd set invalid: '+i);
  });
  const pairAnswers=new Set();
  brainPairSets.forEach(function(set,i){
    if(!set.l||!set.r||!set.ask||!set.why)errors.push('brain pair set incomplete: '+i);
    if(pairAnswers.has(set.r))errors.push('brain pair answer duplicate: '+i);
    pairAnswers.add(set.r);
  });
  content.brainKinds=brainMeta.length;
  content.brainRoutes=brainRoutes.length;
  content.brainTopForms=brainTopForms.length;
  content.brainOddSets=brainOddSets.length;
  content.brainPairSets=brainPairSets.length;
}

let offlineBytes=0;
for(const ref of swRefs){
  const file=resolveRef(ref);
  if(fs.existsSync(file)&&fs.statSync(file).isFile())offlineBytes+=fs.statSync(file).size;
}

const report={
  ok:errors.length===0,
  assetRoot,
  screens:screens.length,
  screenNames:screens,
  navigationTargets:goTargets.length,
  hooks:hookNames.length,
  ids:ids.length,
  duplicateIds,
  selectorIds:selectorIds.length,
  staticReferences:staticRefs.length,
  precacheEntries:swRefs.length,
  childPrecacheEntries:childSwRefs.length,
  content,
  offlineMiB:Math.round(offlineBytes/1024/1024*10)/10,
  errors,
  warnings
};
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
