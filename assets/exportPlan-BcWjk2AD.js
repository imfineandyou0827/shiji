import{u as e}from"./index-BwHhHdM2.js";function t(e,t=640,n=240){let r=e.filter(e=>e.length>0),i=r.flat();if(i.length<2)return``;let a=i.map(e=>e.lat),o=i.map(e=>e.lon),s=Math.min(...a),c=Math.max(...a),l=Math.min(...o),u=Math.max(...o),d=c-s||1e-6,f=u-l||1e-6,p=e=>[16+(e.lon-l)/f*(t-32),16+(c-e.lat)/d*(n-32)],m=r.map(e=>`<polyline points="${e.map(p).map(([e,t])=>`${e.toFixed(1)},${t.toFixed(1)}`).join(` `)}" fill="none" stroke="#3f7d5c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`).join(``),[h,g]=p(r[0][0]),_=r[r.length-1],[v,y]=p(_[_.length-1]);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${n}" width="100%" preserveAspectRatio="xMidYMid meet" style="background:#f5f4f1;border-radius:10px">${m}<circle cx="${h.toFixed(1)}" cy="${g.toFixed(1)}" r="5" fill="#fff" stroke="#3f7d5c" stroke-width="3"/><circle cx="${v.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#b5453a" stroke="#fff" stroke-width="2"/></svg>`}var n=256,r=40,i={osm:{url:(e,t,n)=>`https://a.tile.openstreetmap.org/${n}/${e}/${t}.png`,maxZoom:18},topo:{url:(e,t,n)=>`https://a.tile.opentopomap.org/${n}/${e}/${t}.png`,maxZoom:16},satellite:{url:(e,t,n)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${n}/${t}/${e}`,maxZoom:18}};function a(e,t){return(e+180)/360*2**t*n}function o(e,t){let r=Math.sin(e*Math.PI/180);return(.5-Math.log((1+r)/(1-r))/(4*Math.PI))*2**t*n}function s(e){return new Promise(t=>{let n=new Image;n.crossOrigin=`anonymous`,n.onload=()=>t(n),n.onerror=()=>t(null),n.src=e})}async function c(e,t=`osm`,c=680,l=400){if(typeof document>`u`)return null;let u=e.filter(e=>e.length>0).flat();if(u.length<2)return null;let d=i[t]??i.osm,f=u.map(e=>e.lat),p=u.map(e=>e.lon),m=Math.min(...f),h=Math.max(...f),g=Math.min(...p),_=Math.max(...p),v=d.maxZoom,y=0,b=0,x=0,S=0,C=1/0;for(;v>=1;--v){y=a(g,v),x=a(_,v),b=o(h,v),S=o(m,v);let e=x-y,t=S-b,i=Math.floor(y/n),s=Math.floor(x/n),u=Math.floor(b/n),d=Math.floor(S/n);if(C=(s-i+1)*(d-u+1),e<=c-52&&t<=l-52&&C<=r)break}v=Math.max(1,v);let w=y-26,T=b-26,E=Math.min(c,Math.round(x-y+52)),D=Math.min(l,Math.round(S-b+52)),O=document.createElement(`canvas`);O.width=E,O.height=D;let k=O.getContext(`2d`);if(!k)return null;k.fillStyle=`#e9e7e0`,k.fillRect(0,0,E,D);let A=Math.floor(y/n),j=Math.floor(x/n),M=Math.floor(b/n),N=Math.floor(S/n),P=await Promise.all(Array.from({length:(j-A+1)*(N-M+1)},(e,t)=>{let n=j-A+1,r=A+t%n,i=M+Math.floor(t/n);return s(d.url(r,i,v)).then(e=>({img:e,tx:r,ty:i}))})),F=0;for(let{img:e,tx:t,ty:r}of P)e&&(F+=1,k.drawImage(e,t*n-w,r*n-T,n,n));if(F===0)return null;let I=e=>[a(e.lon,v)-w,o(e.lat,v)-T],L=e.filter(e=>e.length>0);k.lineJoin=`round`,k.lineCap=`round`,k.strokeStyle=`#3f7d5c`,k.lineWidth=4;for(let e of L)e.length<2||(k.beginPath(),e.forEach((e,t)=>{let[n,r]=I(e);t===0?k.moveTo(n,r):k.lineTo(n,r)}),k.stroke());let R=(e,t)=>{let[n,r]=I(e);k.beginPath(),k.arc(n,r,6,0,Math.PI*2),k.fillStyle=t,k.fill(),k.lineWidth=2,k.strokeStyle=`#fff`,k.stroke()};R(L[0][0],`#3f7d5c`);let z=L[L.length-1];R(z[z.length-1],`#b5453a`);try{return O.toDataURL(`image/png`)}catch{return null}}var l={"":``,easy:`轻松`,moderate:`中等`,hard:`困难`,expert:`挑战`};function u(e,t){return!e&&!t?`未设日期`:e&&t?`${e} → ${t}`:e??t??``}function d(e){if(!e)return``;let t=Math.floor(e/60),n=e%60;return t===0?`${n} 分钟`:n===0?`${t} 小时`:`${t} 小时 ${n} 分`}function f(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function p(e,t){let n=new Map(t.objects.map(e=>[e.id,e]));return{schedules:e.scheduleIds.map(e=>t.schedules.find(t=>t.id===e)).filter(e=>e!==void 0),lists:e.listIds.map(e=>t.lists.find(t=>t.id===e)).filter(e=>e!==void 0),tracks:e.tracks,objectById:n}}function m(t,n){let{schedules:r,lists:i,tracks:a,objectById:o}=p(t,n),s=[];if(s.push(`# ${t.icon} ${t.title}`,``),s.push(`- 日期：${u(t.startDate,t.endDate)}`),t.tags.length>0&&s.push(`- 标签：${t.tags.join(`、`)}`),s.push(``),t.description&&s.push(t.description,``),s.push(`## 日程`,``),r.length===0)s.push(`_无_`,``);else{for(let t of r){let n=[e({recurrence:t.recurrence})];t.time&&n.push(t.time),s.push(`- **${t.title}** — ${n.join(` · `)}`),t.notes&&s.push(`  - ${t.notes.replace(/\n/g,` `)}`)}s.push(``)}for(let e of i){s.push(`## 清单：${e.title}`,``),e.description&&s.push(e.description,``);let t=e.sectionIds.map(e=>o.get(e)).filter(e=>e!==void 0),n=(e,t,n,r)=>{let i=o.get(e),a=i?i.name:`（对象已删除）`,s=t>1?` ×${t}`:``,c=r?` — ${r}`:``;return`- [${n?`x`:` `}] ${a}${s}${c}`};for(let r of t){let t=e.items.filter(e=>e.sectionId===r.id);s.push(`### ${r.icon} ${r.name}`),t.length===0?s.push(`_无_`):t.forEach(e=>s.push(n(e.objectId,e.quantity,e.checked,e.note))),s.push(``)}let r=e.items.filter(t=>!t.sectionId||!e.sectionIds.includes(t.sectionId));r.length>0&&(s.push(`### 未分区`),r.forEach(e=>s.push(n(e.objectId,e.quantity,e.checked,e.note))),s.push(``))}if(s.push(`## 轨迹`,``),a.length===0)s.push(`_无_`);else for(let e of a){s.push(`### ${e.name}`,``);let t=[];e.distanceKm!==null&&t.push(`距离：${e.distanceKm} km`),e.elevationGainM!==null&&t.push(`累计爬升：${e.elevationGainM} m`),e.difficulty&&t.push(`难度：${l[e.difficulty]}`),e.durationMin!==null&&t.push(`预计时长：${d(e.durationMin)}`),t.length>0&&s.push(`- ${t.join(` · `)}`),e.link&&s.push(`- 链接：${e.link}`),e.notes&&s.push(``,e.notes),s.push(``)}return s.join(`
`)}async function h(n,r){let{schedules:i,lists:a,tracks:o,objectById:s}=p(n,r),m=i.length===0?`<p class="empty">暂无日程</p>`:`<ul class="timeline">${i.map(t=>{let n=e({recurrence:t.recurrence}),r=t.time?`<span class="time">${f(t.time)}</span>`:`<span class="time muted">--:--</span>`,i=t.notes?`<div class="note">${f(t.notes)}</div>`:``;return`<li>${r}<div class="tl-body"><div class="tl-title">${f(t.title)}</div><div class="sub">${f(n)}</div>${i}</div></li>`}).join(``)}</ul>`,h=a.map(e=>{let t=e.sectionIds.map(e=>s.get(e)).filter(e=>e!==void 0),n=e.items.length,r=e.items.filter(e=>e.checked).length,i=(e,t,n,r)=>{let i=s.get(e),a=i?f(i.name):`（对象已删除）`,o=t>1?`<span class="qty">×${t}</span>`:``,c=r?`<span class="note-inline">${f(r)}</span>`:``;return`<li class="${n?`done`:``}"><span class="box">${n?`✓`:``}</span><span class="item">${a}${o}${c}</span></li>`},a=[];for(let n of t){let t=e.items.filter(e=>e.sectionId===n.id);a.push(`<div class="subhead">${n.icon} ${f(n.name)}<span class="cnt">${t.length}</span></div>`),a.push(t.length===0?`<p class="empty">无</p>`:`<ul class="items">${t.map(e=>i(e.objectId,e.quantity,e.checked,e.note)).join(``)}</ul>`)}let o=e.items.filter(t=>!t.sectionId||!e.sectionIds.includes(t.sectionId));o.length>0&&(a.push(`<div class="subhead">未分区<span class="cnt">${o.length}</span></div>`),a.push(`<ul class="items">${o.map(e=>i(e.objectId,e.quantity,e.checked,e.note)).join(``)}</ul>`));let c=e.description?`<p class="card-desc">${f(e.description)}</p>`:``;return`<article class="card"><div class="card-head"><h3>${e.cover||`📋`} ${f(e.title)}</h3><span class="progress">${r}/${n} 已备</span></div>${c}${a.join(``)}</article>`}).join(``),g=[];for(let e of o){let n=[];e.distanceKm!==null&&n.push(`距离 ${e.distanceKm} km`),e.elevationGainM!==null&&n.push(`爬升 ${e.elevationGainM} m`),e.difficulty&&n.push(`难度 ${l[e.difficulty]}`),e.durationMin!==null&&n.push(`时长 ${d(e.durationMin)}`);let r=n.length?`<div class="chips">${n.map(e=>`<span>${f(e)}</span>`).join(``)}</div>`:``,i=await c(e.segments,e.baseLayer),a=i?``:t(e.segments),o=i?`<div class="map"><img src="${i}" alt="轨迹地图" /></div>`:a?`<div class="map">${a}</div>`:``,s=e.link?`<p class="link"><a href="${f(e.link)}">${f(e.link)}</a></p>`:``,u=e.notes?`<p class="note">${f(e.notes)}</p>`:``;g.push(`<article class="card"><div class="card-head"><h3>🗺️ ${f(e.name)}</h3></div>${r}${o}${s}${u}</article>`)}let _=o.length===0?`<p class="empty">暂无轨迹</p>`:g.join(``),v=u(n.startDate,n.endDate),y=new Date().toISOString().slice(0,10);return`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${f(n.title)}</title>
<style>
  :root {
    --bg:#f5f4f0; --card:#ffffff; --ink:#26241f; --muted:#7c7970;
    --line:#e7e4dc; --accent:#3f7d5c; --accent-dark:#2f6249; --accent-soft:#e9f1ec;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: var(--bg); color: var(--ink); line-height: 1.7;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { max-width: 860px; margin: 0 auto; padding: 28px 22px 48px; }
  .hero {
    display: flex; align-items: center; gap: 16px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    color: #fff; border-radius: 18px; padding: 22px 24px;
    box-shadow: 0 12px 30px rgba(47,98,73,.28);
  }
  .hero .icon { font-size: 46px; line-height: 1; }
  .hero h1 { font-size: 25px; margin: 0 0 6px; letter-spacing: .2px; }
  .hero .range { font-size: 13px; opacity: .92; }
  .hero .tags { margin-top: 10px; }
  .hero .tag { display: inline-block; background: rgba(255,255,255,.2); border-radius: 999px;
    padding: 2px 11px; font-size: 12px; margin: 0 6px 6px 0; }
  .desc { margin: 16px 4px 0; color: #3d3b35; }
  .block { margin-top: 30px; }
  .block > h2 { display: flex; align-items: center; gap: 9px; font-size: 16px; margin: 0 0 14px; color: var(--accent-dark); }
  .block > h2::before { content: ''; width: 5px; height: 18px; border-radius: 3px; background: var(--accent); display: inline-block; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 16px 18px; box-shadow: 0 2px 10px rgba(30,28,22,.05); margin-bottom: 14px; break-inside: avoid; }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .card-head h3 { font-size: 16px; margin: 0; }
  .progress { flex-shrink: 0; font-size: 12px; color: var(--muted); background: var(--bg); border-radius: 999px; padding: 2px 10px; }
  .card-desc { color: var(--muted); font-size: 13px; margin: 0 0 10px; }
  .subhead { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
    color: var(--accent-dark); margin: 14px 0 6px; }
  .subhead .cnt { margin-left: auto; color: var(--muted); font-weight: 400; font-size: 12px; }
  ul.items { list-style: none; margin: 0; padding: 0; }
  ul.items li { display: flex; gap: 10px; align-items: baseline; padding: 5px 0; border-bottom: 1px dashed var(--line); }
  ul.items li:last-child { border-bottom: none; }
  .box { width: 17px; height: 17px; border: 1.6px solid #cdcabf; border-radius: 5px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; transform: translateY(1px); }
  .done .box { background: var(--accent); border-color: var(--accent); }
  .done .item { color: var(--muted); text-decoration: line-through; }
  .qty { color: var(--muted); margin-left: 6px; font-size: 13px; }
  .note-inline { color: var(--muted); margin-left: 8px; font-size: 12px; }
  .timeline { list-style: none; margin: 0; padding: 0; background: var(--card); border: 1px solid var(--line);
    border-radius: 14px; padding: 6px 18px; box-shadow: 0 2px 10px rgba(30,28,22,.05); }
  .timeline li { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .timeline li:last-child { border-bottom: none; }
  .time { flex-shrink: 0; width: 54px; font-variant-numeric: tabular-nums; font-weight: 600; color: var(--accent); }
  .time.muted { color: var(--muted); font-weight: 400; }
  .tl-title { font-weight: 600; }
  .sub { color: var(--muted); font-size: 13px; }
  .note { color: var(--muted); font-size: 13px; white-space: pre-wrap; margin: 4px 0 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .chips span { background: var(--accent-soft); color: var(--accent-dark); border-radius: 999px;
    padding: 3px 11px; font-size: 12px; font-weight: 500; }
  .map { margin: 8px 0; }
  .map svg { display: block; border-radius: 10px; }
  .map img { display: block; width: 100%; border-radius: 10px; border: 1px solid var(--line); }
  .link { margin: 8px 0 0; font-size: 13px; }
  a { color: var(--accent); word-break: break-all; }
  .empty { color: var(--muted); font-size: 13px; margin: 4px 0; }
  .footer { margin-top: 38px; text-align: center; color: var(--muted); font-size: 12px; }
  @media print {
    body { background: #fff; }
    .page { max-width: none; padding: 0; }
    .hero, .card, .timeline { box-shadow: none; }
    .card, .timeline, .map { break-inside: avoid; }
    @page { margin: 14mm; }
  }
</style>
</head>
<body>
<div class="page">
  <header class="hero">
    <div class="icon">${f(n.icon)}</div>
    <div>
      <h1>${f(n.title)}</h1>
      <div class="range">${f(v)}</div>
      ${n.tags.length?`<div class="tags">${n.tags.map(e=>`<span class="tag">${f(e)}</span>`).join(``)}</div>`:``}
    </div>
  </header>
  ${n.description?`<p class="desc">${f(n.description)}</p>`:``}
  <section class="block"><h2>日程</h2>${m}</section>
  <section class="block"><h2>清单</h2>${h||`<p class="empty">暂无清单</p>`}</section>
  <section class="block"><h2>轨迹</h2>${_}</section>
  <footer class="footer">由「拾集」生成 · ${y}</footer>
</div>
</body>
</html>`}function g(e,t,n){let r=new Blob([t],{type:`${n};charset=utf-8`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function _(e){let t=window.open(``,`_blank`);if(!t){window.alert(`浏览器拦截了弹出窗口，请允许后重试，或改用「导出 HTML」。`);return}t.document.open(),t.document.write(e),t.document.close(),t.focus(),window.setTimeout(()=>t.print(),350)}function v(e){return e.replace(/[\\/:*?"<>|]+/g,`_`).trim()||`计划`}export{v as a,_ as i,h as n,m as r,g as t};