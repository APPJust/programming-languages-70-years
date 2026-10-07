// Player engine. Every visible state is a pure function of (frame, locale, caption toggle).
(() => {
const $ = id => document.getElementById(id), params = new URLSearchParams(location.search);
const exporting = params.get('export') === '1'; if (exporting) document.body.classList.add('export');
const D = window.LESSON_DATA, S = window.SCENES;
const XF = 0.5; // crossfade seconds between scenes
// where project.json, audio/ and fonts/ live relative to the page (player/ subfolder locally; same folder when published flat)
const BASE = window.LESSON_BASE ?? '../';
let project, frame = 0, locale = params.get('locale') || 'zh-TW', playing = false, captionOn = true, last = 0, subs = 'base';
let audio = new Audio(), audioReady = false, lastBoxes = [];
const clamp = x => Math.min(1, Math.max(0, x)), ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lang = () => locale.startsWith('zh') ? 'zh' : 'en';
const EYEBROW = {
  hook: {zh: '開場', en: 'INTRO'}, origin: {zh: '起源', en: 'ORIGINS'}, principle: {zh: '原理', en: 'HOW IT WORKS'},
  history: {zh: '演進', en: 'EVOLUTION'}, comparison: {zh: '比較', en: 'COMPARISON'}, application: {zh: '應用案例', en: 'CASE STUDY'},
  ai: {zh: 'AI 時代', en: 'THE AI ERA'}, outlook: {zh: '展望', en: 'OUTLOOK'}, recap: {zh: '回顧', en: 'RECAP'}
};

function scale() { if (!project) return; const cs = getComputedStyle($('shell')), inner = $('shell').clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const s = exporting ? 1 : Math.min(1, inner / project.width); $('stage').style.transform = 'scale(' + s + ')'; $('viewport').style.width = project.width * s + 'px'; $('viewport').style.height = project.height * s + 'px'; }
const scenes = () => project.variants[locale].scenes;
function sceneIndex(t) { const list = scenes(); const i = list.findIndex(s => t >= s.start && t < s.end); return i < 0 ? list.length - 1 : i; }
// Audio is loaded as a Blob so seeking works even on simple static servers without HTTP Range support
// (e.g. `python -m http.server`). Export mode never plays audio, so it skips the download.
const blobCache = {};
function setAudio() {
  audio.pause(); const mix = project.variants[locale].mix; audioReady = !!mix && !exporting;
  if (!audioReady) { audio.removeAttribute('src'); audio.load(); return; }
  const url = new URL(BASE + mix, location.href).href, want = locale;
  blobCache[url] = blobCache[url] || fetch(url).then(r => { if (!r.ok) throw Error('audio ' + r.status); return r.blob(); }).then(b => URL.createObjectURL(b));
  audioLoading = blobCache[url].then(src => { if (want === locale) { audio.src = src; audio.load(); } })
    .catch(() => { audioReady = false; $('quizFeedback').textContent = '音軌載入失敗，請確認以本機伺服器開啟。'; });
}
let audioLoading = Promise.resolve();
function chapters() { const sel = $('chapters'); sel.replaceChildren(); for (const s of scenes()) { if (s.chapter === false) continue; const o = document.createElement('option'); o.value = s.start; o.textContent = s.title || s.screen; sel.append(o); } }

async function loadFonts() {
  const assets = project.font_assets || [];
  for (const a of assets) {
    const url = new URL(BASE + a.url, location.href);
    const face = new FontFace(a.family, 'url(' + JSON.stringify(url.href) + ')', a.weight ? {weight: a.weight} : {});
    try { document.fonts.add(await face.load()); } catch { throw Error('Required font could not load: ' + a.family); }
  }
  await document.fonts.ready;
}

function makeCtx(scene, t, collect) {
  const dur = scene.end - scene.start;
  const phases = scene.phases.map(p => ({name: p.name, s: p.start - scene.start, e: p.end - scene.start}));
  const ph = name => { const p = phases.find(q => q.name === name); if (!p) throw Error('Missing phase ' + name + ' in ' + scene.id); return p; };
  return {
    t, dur, scene, lang: lang(), locale, D, phases, ph,
    // linear progress through a phase, optionally offset/duration-limited
    P: (name, delay = 0, len) => { const p = ph(name); const L = len ?? (p.e - p.s - delay); return clamp((t - p.s - delay) / Math.max(L, 1e-3)); },
    at: name => t >= ph(name).s,
    // word-level marks (scene-local seconds) measured from the narration; fallback keeps renderers total
    mark: (name, fallback = 0) => (scene.marks && name in scene.marks) ? scene.marks[name] : fallback,
    // eased 0..1 starting at local time t0
    A: (t0, len = .6, fn) => (fn || ease)((t - t0) / len),
    box: (id, x, y, w, h, overlapGroup) => { if (collect) lastBoxes.push({id, x, y, width: w, height: h, container: 'viz', ...(overlapGroup ? {overlapGroup} : {})}); }
  };
}

function render(scene, t, collect) {
  const fn = S[scene.kind]; if (!fn) throw Error('Unknown scene kind ' + scene.kind);
  return fn(makeCtx(scene, t, collect));
}

function draw() {
  const t = frame / project.fps, list = scenes(), i = sceneIndex(t), s = list[i], local = t - s.start, credit = s.section === 'credit';
  lastBoxes = [];
  const prev = list[i - 1];
  let fade = 1, svg;
  if (prev && local < XF && !s.cut) {
    fade = ease(local / XF);
    svg = '<g opacity="' + (1 - fade).toFixed(3) + '">' + render(prev, prev.end - prev.start - 1 / project.fps, false) + '</g>'
        + '<g opacity="' + fade.toFixed(3) + '">' + render(s, local, true) + '</g>';
  } else svg = '<g>' + render(s, local, true) + '</g>';
  $('viz').innerHTML = svg;
  // header (fades in with the scene unless it keeps the previous title)
  const sameHeader = prev && prev.title === s.title && !s.cut;
  const hFade = sameHeader ? 1 : (prev && !s.cut ? fade : ease(local / XF));
  $('header').style.display = credit || s.hide_header ? 'none' : 'block';
  $('eyebrow').textContent = (EYEBROW[s.eyebrow || s.section] || {})[lang()] || '';
  $('heading').textContent = s.title || '';
  $('subheading').textContent = s.screen || '';
  $('header').style.opacity = hFade.toFixed(3);
  $('header').style.transform = 'translateY(' + ((1 - hFade) * 14).toFixed(1) + 'px)';
  // optional alternate subtitle set (HTML package): same narration, second line in another language
  const alt = subs !== 'base' && project.alt_subtitles?.[subs]?.[locale];
  const cue = (alt || project.variants[locale].subtitles.cues).find(c => t >= c.start && t < c.end);
  $('caption').style.display = cue && captionOn && !credit ? 'flex' : 'none';
  // English narration + English subtitles: the spoken language leads visually; data order stays [繁中, EN/VI]
  const swap = locale === 'en-US' && !alt && project.subtitle_languages[1] === 'en-US';
  $('caption1').textContent = cue?.text[swap ? 1 : 0] || ''; $('caption2').textContent = cue?.text[swap ? 0 : 1] || '';
  // deterministic fit: shrink a long line (never below 34/30 px) instead of letting it overflow
  for (const [id, base, min] of [['caption1', 44, 34], ['caption2', 37, 30]]) {
    const el = $(id); el.style.fontSize = base + 'px';
    if ($('caption').style.display !== 'none') { let f = base; while (el.scrollWidth > 1560 && f > min) { f -= 1; el.style.fontSize = f + 'px'; } }
  }
  $('progress-mark').style.width = (100 * t / project.duration) + '%';
  $('progress-mark').style.display = credit ? 'none' : 'block';
  $('seek').value = frame; $('time').textContent = fmt(t) + ' / ' + fmt(project.duration);
  const ch = [...list].filter(x => x.chapter !== false && x.start <= t).at(-1); if (ch) $('chapters').value = ch.start;
}
const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

async function seekToFrame(n, language = locale) {
  if (!project.variants[language]) throw Error('Unknown locale');
  if (language !== locale) { locale = language; $('locale').value = locale; chapters(); setAudio(); }
  frame = Math.max(0, Math.min(Math.round(project.duration * project.fps) - 1, Math.round(n)));
  draw();
  if (!exporting && audioReady && Math.abs(audio.currentTime - frame / project.fps) > .15) audio.currentTime = frame / project.fps;
  return frame;
}
function pause() { playing = false; audio.pause(); $('play').textContent = '播放'; }
async function play() {
  if (frame >= project.duration * project.fps - 1) await seekToFrame(0);
  playing = true; last = performance.now(); $('play').textContent = '暫停';
  if (audioReady) {
    // after a language switch the new track may not have metadata yet; seeking before that is silently ignored
    await audioLoading;
    if (audio.readyState < 1) await new Promise(r => audio.addEventListener('loadedmetadata', r, {once: true}));
    audio.currentTime = frame / project.fps; try { await audio.play(); } catch { pause(); $('quizFeedback').textContent = '音軌無法播放，請檢查音檔或瀏覽器權限。'; return; } }
  requestAnimationFrame(tick);
}
function tick(now) {
  if (!playing) return;
  const next = audioReady ? Math.floor(audio.currentTime * project.fps) : frame + (now - last) * project.fps / 1000; last = now;
  if (next >= project.duration * project.fps) { seekToFrame(project.duration * project.fps - 1); pause(); return; }
  frame = next; draw(); requestAnimationFrame(tick);
}
audio.addEventListener('ended', () => { if (playing) { seekToFrame(project.duration * project.fps - 1); pause(); } });

function domBox(el, id) { const r = el.getBoundingClientRect(), b = $('stage').getBoundingClientRect(), k = b.width / project.width; return {id, x: (r.x - b.x) / k, y: (r.y - b.y) / k, width: r.width / k, height: r.height / k, container: 'stage'}; }
function bounds() {
  const extra = [];
  if ($('header').style.display !== 'none') extra.push(domBox($('heading'), 'heading'), domBox($('subheading'), 'subheading'));
  if ($('caption').style.display !== 'none') extra.push(domBox($('caption'), 'caption'));
  return [...extra, ...lastBoxes];
}

// ---------- learning interactions (HTML only) ----------
const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2026];
function decade() {
  const i = Number($('delay').value), y = DECADES[i], zh = lang() === 'zh';
  const born = D.top10.filter(l => l.year <= (i === 8 ? 2026 : y + 9)).sort((a, b) => a.year - b.year);
  const label = i === 8 ? (zh ? '2026 年（今天）' : '2026 (today)') : (zh ? y + ' 年代' : y + 's');
  $('decadeLabel').textContent = label;
  $('decadeOut').textContent = (zh ? '刻度 ' + i + '／8：' + label + '結束前，前 10 名中已誕生 ' + born.length + ' 個'
                                   : 'Step ' + i + '/8: by the end of the ' + label + ', ' + born.length + ' of today\'s top 10 existed')
    + (born.length ? (zh ? '：' + born.map(l => l.name + '（' + l.year + '）').join('、') : ': ' + born.map(l => l.name + ' (' + l.year + ')').join(', ')) :(zh ? '。那時連 C 都還沒出現，主角是 FORTRAN、LISP、COBOL。' : '. Not even C yet; FORTRAN, LISP and COBOL ruled.'));
}
const QUIZ = [
  {zh: '撰寫作業系統核心或微控制器韌體', en: 'Write an OS kernel or microcontroller firmware', ok: ['c', 'rust', 'cpp'],
   why: {zh: '需要直接掌控記憶體與硬體：C 最傳統，Rust 多了編譯期記憶體安全檢查。', en: 'You need direct control of memory and hardware: C is traditional; Rust adds compile-time memory safety.'}},
  {zh: '分析一份問卷資料並畫出統計圖', en: 'Analyze survey data and plot statistics', ok: ['python', 'r'],
   why: {zh: 'Python 與 R 都有成熟的統計與繪圖套件，改一行就能立刻看到結果。', en: 'Python and R both have mature statistics and plotting libraries with instant feedback.'}},
  {zh: '從十萬筆訂單資料庫找出上個月的營收', en: 'Find last month\'s revenue in a database of 100,000 orders', ok: ['sql'],
   why: {zh: 'SQL 是向資料庫「描述要什麼資料」的宣告式語言，正是為此而生。', en: 'SQL declares what data you want from a database — exactly what it was made for.'}},
  {zh: '讓網頁上的按鈕按下後顯示動畫', en: 'Make a web-page button trigger an animation', ok: ['js'],
   why: {zh: '瀏覽器內建執行 JavaScript，網頁互動幾乎都靠它。', en: 'Browsers run JavaScript natively; nearly all web interactivity uses it.'}},
  {zh: '開發大型銀行後端或 Android App', en: 'Build a large bank back end or an Android app', ok: ['java', 'csharp'],
   why: {zh: 'Java 與 C# 透過虛擬機器兼顧可攜性、效能與成熟的企業生態。', en: 'Java and C# balance portability, performance and mature enterprise ecosystems via virtual machines.'}}
];
let quizIndex = 0;
function quiz() {
  const q = QUIZ[quizIndex], zh = lang() === 'zh';
  $('quizTask').textContent = (zh ? '第 ' + (quizIndex + 1) + ' 題：' : 'Task ' + (quizIndex + 1) + ': ') + q[lang()];
  $('quizFeedback').textContent = '';
  const box = $('quizChoices'); box.replaceChildren();
  for (const l of D.top10) {
    const b = document.createElement('button'); b.textContent = l.name; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => { for (const x of box.children) x.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-pressed', 'true');
      const good = q.ok.includes(l.id);
      $('quizFeedback').textContent = (good ? (zh ? '✔ 合適！' : '✔ Good fit! ') : (zh ? '✘ 可以，但不是首選。較常見的選擇：' + q.ok.map(id => D.top10.find(x => x.id === id).name).join('、') + '。' : '✘ Possible, but not the usual first choice. Common picks: ' + q.ok.map(id => D.top10.find(x => x.id === id).name).join(', ') + '. ')) + q.why[lang()];
      $('quizFeedback').style.color = good ? 'var(--good, #14532D)' : 'var(--bad, #9A3412)'; };
    box.append(b);
  }
}

window.lesson = {
  ready: async () => { await loaded; await document.fonts.ready; },
  seekToFrame, bounds, getProject: () => project
};
const loaded = (async () => {
  const res = await fetch(BASE + 'project.json'); if (!res.ok) throw Error('Cannot load project.json');
  project = await res.json(); if (!project.variants[locale]) throw Error('Unknown locale');
  await loadFonts();
  $('stage').style.width = project.width + 'px'; $('stage').style.height = project.height + 'px';
  $('seek').max = Math.round(project.duration * project.fps) - 1; $('locale').value = locale;
  if (project.alt_subtitles && !exporting) $('subs').hidden = false;
  chapters(); setAudio(); scale(); decade(); quiz(); await seekToFrame(0);
})();
$('play').onclick = () => playing ? pause() : play();
$('replay').onclick = async () => { pause(); await seekToFrame(0); await play(); };
$('seek').oninput = () => { pause(); seekToFrame(Number($('seek').value)); };
$('locale').onchange = () => { pause(); seekToFrame(frame, $('locale').value); decade(); quiz(); };
$('chapters').onchange = () => { pause(); seekToFrame(Number($('chapters').value) * project.fps); };
$('captions').onclick = () => { captionOn = !captionOn; $('captions').textContent = captionOn ? '字幕開啟' : '字幕關閉'; $('captions').setAttribute('aria-pressed', String(captionOn)); draw(); };
$('delay').oninput = decade;
$('subs').onchange = () => { subs = $('subs').value; draw(); };
$('quizNext').onclick = () => { quizIndex = (quizIndex + 1) % QUIZ.length; quiz(); };
window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { pause(); seekToFrame(frame + (e.code === 'ArrowRight' ? 5 : -5) * project.fps); } });
window.addEventListener('resize', scale);
})();
