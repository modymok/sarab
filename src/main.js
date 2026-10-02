// Sarab POC — pre-rendered video explorer.
// One <video> per clip, stacked; moving between views = crossfade into a transition clip,
// then crossfade into the target's idle loop just before the transition ends.

const $ = (id) => document.getElementById(id);
const load = (url) => fetch(url).then((r) => r.json());
const [scenes, content] = await Promise.all([load('config/scenes.json'), load('config/content.json')]);

const FADE = scenes.fadeMs;
document.documentElement.style.setProperty('--fade', `${FADE}ms`);
const EDIT = new URLSearchParams(location.search).has('edit');

let lang = 'ar';
try { lang = localStorage.getItem('sarab.lang') || 'ar'; } catch {}
let current = scenes.start;
let activeInfo = null;
let busy = false;

const t = (v) => (v && typeof v === 'object' && 'ar' in v ? v[lang] : v);
const ui = (k) => t(content.ui[k]);
const num = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US').format(n);
const unit = (u) => (u ? ` <bdi>${ui(u)}</bdi>` : '');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- clips ----------
const stage = $('stage');
const idles = new Set(Object.values(scenes.views).map((v) => v.idle));
const clips = {};
for (const name of new Set([...idles, ...Object.values(scenes.transitions)])) {
  const v = document.createElement('video');
  Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src: `videos/${name}.mp4` });
  if (idles.has(name)) v.poster = `videos/${name}.jpg`;
  v.className = 'clip';
  $('clips').append(v);
  clips[name] = v;
}

// Loader: wait until every clip can play through (local/LAN this is instant).
// ponytail: blocks on all clips; on a slow network wait only for the current view + its outgoing transitions.
await new Promise((done) => {
  const all = Object.values(clips);
  let ready = 0;
  const tick = () => {
    ready++;
    $('loaderBar').style.width = `${(ready / all.length) * 100}%`;
    if (ready === all.length) done();
  };
  all.forEach((v) => (v.readyState >= 4 ? tick() : v.addEventListener('canplaythrough', tick, { once: true })));
});

let z = 1;
let shown = null;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Capped: frame callbacks never fire in a hidden tab, and the app must not hang there.
const nextFrame = (v) => Promise.race([wait(250), new Promise((r) => ('requestVideoFrameCallback' in v ? v.requestVideoFrameCallback(() => r()) : r()))]);

async function crossTo(v, loop) {
  v.loop = loop;
  v.currentTime = 0;
  await v.play().catch(() => {});
  await nextFrame(v); // first decoded frame is on screen before we fade, so no black flash
  v.style.zIndex = ++z;
  v.classList.add('on');
  const prev = shown;
  shown = v;
  await wait(FADE);
  if (prev && prev !== v) { prev.classList.remove('on'); prev.pause(); }
}

// Resolve when the clip is FADE ms from its end, so the idle fade overlaps the last frames.
const nearEnd = (v) => new Promise((r) => {
  const check = () => {
    if (v.ended || v.duration - v.currentTime <= FADE / 1000) { v.removeEventListener('timeupdate', check); r(); }
    else if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(check);
  };
  v.addEventListener('timeupdate', check);
  v.addEventListener('ended', check, { once: true });
  check();
});

async function step(to) {
  const via = clips[scenes.transitions[`${current}>${to}`]];
  if (via) { await crossTo(via, false); await nearEnd(via); }
  await crossTo(clips[scenes.views[to].idle], true);
  current = to;
}

const chain = (id) => { const out = []; for (let v = id; v; v = scenes.views[v].parent) out.unshift(v); return out; };

// Walk up to the common ancestor, then down — each hop plays its own transition.
async function navigate(target) {
  if (busy || target === current) return;
  busy = true;
  activeInfo = null;
  document.body.dataset.moving = '1';
  const down = chain(target);
  while (!down.includes(current)) await step(scenes.views[current].parent);
  for (const v of down.slice(down.indexOf(current) + 1)) await step(v);
  render();
  document.body.dataset.moving = '';
  busy = false;
}

// ---------- UI ----------
function renderPins() {
  const view = scenes.views[current];
  const copy = content.views[current];
  $('pins').innerHTML = view.hotspots.map((h) => {
    const p = h.info ? copy.rooms[h.info] : copy.pins[h.id];
    const note = h.info ? `${num(p.area)}${unit('sqm')}` : esc(t(p.note));
    return `<button class="pin ${h.info ? 'pin-info' : 'pin-go'} ${activeInfo === h.info && h.info ? 'is-active' : ''}"
      style="--x:${h.x};--y:${h.y}" data-go="${h.go || ''}" data-info="${h.info || ''}" type="button">
      <span class="dot"></span>
      <span class="glass tag"><b>${esc(t(p.title))}</b><small>${note}</small></span>
    </button>`;
  }).join('');
}

function renderPanel() {
  const c = content.views[current];
  const stats = c.stats.map((s) => `<div><dt>${esc(t(s.label))}</dt><dd>${esc(t(s.value))}${unit(s.unit)}</dd></div>`).join('');
  const features = c.features ? `<ul class="features">${c.features.map((f) => `<li>${esc(t(f))}</li>`).join('')}</ul>` : '';
  const units = c.units ? `<ul class="units">${c.units.map((u) => `
      <li class="unit ${u.go ? 'is-link' : ''}" ${u.go ? `data-go="${u.go}" tabindex="0" role="button"` : ''}>
        <span class="u-id">${esc(u.id)}</span>
        <span class="u-meta">${esc(t(u.floor))}, ${num(u.area)}${unit('sqm')}</span>
        <span class="u-price">${num(u.price)}${unit('sar')}</span>
        <span class="chip s-${u.status}">${esc(t(content.ui.status[u.status]))}</span>
      </li>`).join('')}</ul>` : '';
  const room = activeInfo && c.rooms?.[activeInfo];
  const roomCard = room ? `<div class="room"><h3>${esc(t(room.title))}</h3><p><b>${num(room.area)}${unit('sqm')}</b> ${esc(t(room.note))}</p></div>` : '';
  const priceRow = c.price ? `<p class="price"><span class="chip s-${c.status}">${esc(t(content.ui.status[c.status]))}</span><strong>${num(c.price)}${unit('sar')}</strong></p>` : '';
  const cta = c.price ? `<button class="cta" type="button" data-demo>${esc(ui('bookVisit'))}</button>` : '';

  $('panel').innerHTML = `${priceRow}<p class="lead">${esc(t(c.lead))}</p><dl class="stats">${stats}</dl>${roomCard}${units}${features}${cta}`;
}

function render() {
  const c = content.views[current];
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = ui('brand');
  $('brand').textContent = ui('brand');
  $('lang').textContent = ui('langSwitch');
  $('title').textContent = t(c.title);
  $('subtitle').textContent = t(c.subtitle);
  $('loaderText').textContent = ui('loading');
  const parent = scenes.views[current].parent;
  const back = $('back');
  back.hidden = !parent;
  back.textContent = ui('back');
  $('crumbs').hidden = !parent;
  $('crumbs').innerHTML = chain(current)
    .map((id) => (id === current ? `<span aria-current="page">${esc(t(content.views[id].title))}</span>` : `<button type="button" data-go="${id}">${esc(t(content.views[id].title))}</button>`))
    .join('<i aria-hidden="true">/</i>');
  renderPins();
  renderPanel();
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2600);
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]')?.dataset.go;
  const info = e.target.closest('[data-info]')?.dataset.info;
  if (go) return navigate(go);
  if (info) { activeInfo = activeInfo === info ? null : info; renderPins(); renderPanel(); return; }
  if (e.target.closest('[data-demo]')) return toast(ui('demoOnly'));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && scenes.views[current].parent) navigate(scenes.views[current].parent);
  if (e.key === 'Enter' && e.target.dataset?.go) navigate(e.target.dataset.go);
});
$('back').addEventListener('click', () => navigate(scenes.views[current].parent));
$('lang').addEventListener('click', () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('sarab.lang', lang); } catch {}
  render();
});

// ?edit — click the video to read hotspot coordinates for scenes.json
if (EDIT) {
  toast(ui('editHint'));
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.pin')) return;
    const r = stage.getBoundingClientRect();
    const xy = `"x": ${((e.clientX - r.left) / r.width).toFixed(3)}, "y": ${((e.clientY - r.top) / r.height).toFixed(3)}`;
    navigator.clipboard?.writeText(xy).catch(() => {});
    console.log(`[${current}]`, xy);
    toast(`${current}: ${xy}`);
  });
  document.body.classList.add('edit');
}

// ---------- start ----------
render();
await crossTo(clips[scenes.views[current].idle], true);
$('loader').classList.add('done');
document.body.dataset.moving = '';
