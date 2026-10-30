/* リンク・エアホッケー：一度開いたら、電波が弱い・つながらないときでも端末に保存した版で開けるようにする */
const V='ah-v20';
const CDN=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['./','./index.html']).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(r.mode==='navigate'||(u.origin===location.origin&&/(\/|index\.html)$/.test(u.pathname))){e.respondWith(page(r));return}
  if(u.origin===location.origin&&/\.(png|webmanifest)$/.test(u.pathname)){e.respondWith(fromCache(r));return}
  if(CDN.test(r.url)){e.respondWith(fromCache(r));return}
});
// ページ本体：新しい版を取りにいき、3.5秒で返ってこなければ保存してある版を出す
async function page(r){
  const c=await caches.open(V);
  try{
    const res=await Promise.race([fetch(r.url,{cache:'no-cache',credentials:'same-origin'}),new Promise((_,no)=>setTimeout(()=>no(new Error('slow')),3500))]); // 新しい版を確実に取りにいく（端末に残った古い版を使わない）
    if(res&&res.ok){c.put('./',res.clone()).catch(()=>{})}
    return res;
  }catch(err){
    const hit=await c.match('./')||await c.match('./index.html')||await c.match(r,{ignoreSearch:true});
    if(hit) return hit;
    throw err;
  }
}
// ライブラリ・文字・アイコン：保存してあればそれを使う（版が固定のURLなので古くならない）
async function fromCache(r){
  const hit=await caches.match(r); if(hit) return hit;
  const res=await fetch(r);
  if(res&&(res.ok||res.type==='opaque')){const c=await caches.open(V);c.put(r,res.clone()).catch(()=>{})}
  return res;
}
