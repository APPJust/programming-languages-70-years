// Scene renderers: each kind maps a context (local time, phases, locale) to SVG markup. No hidden state.
(() => {
const clamp = x => Math.min(1, Math.max(0, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const outCubic = x => 1 - Math.pow(1 - clamp(x), 3);
const inOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const INK = '#1E2430', MUTED = '#5B6472', RULE = '#D3CCBC', PAPER = '#F4F0E6', ACCENT = '#C2410C';
const MONO = 'Consolas,"Cascadia Mono",monospace';
// text helper: x,y baseline; opts: size, weight, fill, anchor, op, family, ls
function T(x, y, s, o = {}) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size || 28}" font-weight="${o.weight || 400}" fill="${o.fill || INK}"`
    + ` text-anchor="${o.anchor || 'start'}" opacity="${(o.op ?? 1).toFixed(3)}"${o.family ? ` font-family='${o.family}'` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
}
const L = (ctx, o) => o[ctx.lang];
// rough text width estimate used for layout boxes (CJK ≈ 1em, Latin ≈ .56em)
const textW = (s, size) => [...String(s)].reduce((w, ch) => w + (/[⺀-￿]/.test(ch) ? size : size * .58), 0);

// ---------- shared: top-10 morph geometry ----------
const YEAR0 = 1950, YEAR1 = 2030, TX0 = 400, TX1 = 1780, TL_Y = 800;
const yearX = y => TX0 + (y - YEAR0) * (TX1 - TX0) / (YEAR1 - YEAR0);
const ROW0 = 268, ROWH = 46, BAR_X = 600, BAR_K = 50;
const rowY = r => ROW0 + (r - 1) * ROWH + ROWH / 2;

function timelineAxis(ctx, op, from = YEAR0, to = YEAR1) {
  let s = `<line x1="${yearX(from)}" y1="${TL_Y}" x2="${yearX(to)}" y2="${TL_Y}" stroke="${INK}" stroke-width="3" opacity="${op}"/>`;
  for (let y = 1950; y <= 2030; y += 10) {
    if (y < from || y > to) continue;
    s += `<line x1="${yearX(y)}" y1="${TL_Y - 8}" x2="${yearX(y)}" y2="${TL_Y + 8}" stroke="${INK}" stroke-width="2" opacity="${op}"/>`;
    s += T(yearX(y), TL_Y + 38, String(y), {size: 22, fill: MUTED, anchor: 'middle', op});
    ctx.box('tick' + y, yearX(y) - 26, TL_Y + 18, 52, 26);
  }
  return s;
}

// stack dots that share a birth year, and assign label rows so timeline labels never collide
function morphLayout(langs) {
  const sorted = [...langs].sort((a, b) => a.year - b.year || a.rank - b.rank);
  const stack = {}, levels = [];
  return sorted.map(l => {
    const k = stack[l.year] = (stack[l.year] ?? -1) + 1;
    const x = yearX(l.year), w = textW(l.name, 22) + 16;
    let lv = k; while ((levels[lv] || []).some(([a, b]) => x - w / 2 < b && x + w / 2 > a)) lv++;
    (levels[lv] = levels[lv] || []).push([x - w / 2, x + w / 2]);
    return {...l, x, dotY: TL_Y - 14 - k * 26, lv, w};
  });
}

const SCENES = {};

SCENES.morph = ctx => {
  const {t, D} = ctx, zh = ctx.lang === 'zh';
  const items = morphLayout(D.top10), order = [...items].sort((a, b) => a.year - b.year);
  const pA = ctx.ph('落點'), pB = ctx.ph('變形'), pC = ctx.ph('聚焦C'), pR = ctx.ph('聚焦Rust');
  const focusC = smooth((t - pC.s) / .5) * (1 - smooth((t - pR.s) / .5));
  const focusR = smooth((t - pR.s) / .5);
  let s = timelineAxis(ctx, 1);
  // column headers appear with the morph
  const hOp = smooth((t - pB.s) / .6);
  s += T(360, 250, zh ? '排名' : 'Rank', {size: 20, fill: MUTED, anchor: 'end', op: hOp});
  s += T(570, 250, zh ? '語言' : 'Language', {size: 20, fill: MUTED, anchor: 'end', op: hOp});
  s += T(BAR_X, 250, zh ? 'TIOBE 評分（%）' : 'TIOBE rating (%)', {size: 20, fill: MUTED, op: hOp});
  s += T(1800, 250, zh ? '誕生年' : 'Born', {size: 20, fill: MUTED, anchor: 'end', op: hOp});
  const links = [];
  for (const it of items) {
    const i = order.indexOf(it);
    const drop = outCubic((t - pA.s - .25 - i * .24) / .55);            // dot falls onto its birth year
    const fly = inOut((t - pB.s - (it.rank - 1) * .07) / .8);             // dot flies to its ranking row
    const grow = outCubic((t - pB.s - (it.rank - 1) * .07 - .65) / .75);  // bar grows from the dot
    const isC = it.id === 'c', isR = it.id === 'rust';
    const focus = isC ? focusC : isR ? focusR : 0;
    const dim = 1 - .68 * Math.max(focusC * (isC ? 0 : 1), focusR * (isR ? 0 : 1));
    const ry = rowY(it.rank);
    // ghost marker stays on the timeline after the dot leaves
    if (fly > 0) s += `<circle cx="${it.x}" cy="${it.dotY}" r="8" fill="${PAPER}" stroke="${it.color}" stroke-width="3" opacity="${(.9 * dim).toFixed(3)}"/>`;
    // timeline label (phase A), fades as the dot leaves
    const labOp = smooth((t - pA.s - .45 - i * .24) / .3) * (1 - smooth(fly * 3));
    if (labOp > 0) {
      const ly = TL_Y - 52 - it.lv * 32;
      s += `<line x1="${it.x}" y1="${it.dotY - 12}" x2="${it.x}" y2="${ly + 6}" stroke="${it.color}" stroke-width="1.5" opacity="${labOp.toFixed(3)}"/>`;
      s += T(it.x, ly, it.name, {size: 22, weight: 700, fill: it.color, anchor: 'middle', op: labOp});
      ctx.box('tl-' + it.id, it.x - it.w / 2, ly - 20, it.w, 26);
    }
    // the moving dot
    const startY = lerp(170, it.dotY, drop);
    const ex = BAR_X, ey = ry, cx = lerp(it.x, ex, .5), cy = Math.min(it.dotY, ey) - 140;
    const k = fly, x = (1 - k) * (1 - k) * it.x + 2 * (1 - k) * k * cx + k * k * ex, y = (1 - k) * (1 - k) * startY + 2 * (1 - k) * k * cy + k * k * ey;
    if (drop > 0 && grow < 1) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lerp(11, 15, fly).toFixed(1)}" fill="${it.color}" opacity="${(Math.min(1, drop * 3) * (1 - grow)).toFixed(3)}"/>`;
    // ranking row
    if (grow > 0) {
      const w = it.rating * BAR_K * grow, rOp = smooth(grow * 2) * dim;
      s += `<rect x="${BAR_X}" y="${ry - 15}" width="${w.toFixed(1)}" height="30" rx="4" fill="${it.color}" opacity="${rOp.toFixed(3)}"/>`;
      s += T(360, ry + 10, String(it.rank), {size: 28, weight: 700, fill: INK, anchor: 'end', op: rOp});
      s += T(570, ry + 10, it.name, {size: 28, weight: 700, fill: it.color, anchor: 'end', op: rOp});
      s += T(BAR_X + w + 12, ry + 9, it.rating.toFixed(2), {size: focus > .01 ? 26 + 6 * focus : 26, weight: 600, fill: INK, op: rOp});
      s += T(1800, ry + 10, String(it.year), {size: 28, weight: focus > .5 ? 800 : 500, fill: focus > .5 ? it.color : MUTED, anchor: 'end', op: rOp});
      ctx.box('name-' + it.id, 570 - textW(it.name, 28), ry - 18, textW(it.name, 28), 34);
      ctx.box('bar-' + it.id, BAR_X, ry - 15, Math.max(1, it.rating * BAR_K + 12 + textW(it.rating.toFixed(2), 32)), 30);
      ctx.box('year-' + it.id, 1800 - 64, ry - 18, 64, 34);
    }
    if (focus > .01) links.push({it, focus, ry});
  }
  // focus trace: replay the dot's flight path (same arc as the morph) from its birth year to its ranking row
  for (const {it, focus, ry} of links) {
    const len = 2400, k = smooth((focus - .15) / .85);
    // connector runs in the clear corridor between the last bar row and the timeline, then up the gap left of the bars
    const CY = 742, GX = 586, r = 18;
    const d = `M ${it.x} ${it.dotY - 12} L ${it.x} ${CY + r} Q ${it.x} ${CY} ${it.x - r} ${CY} L ${GX + r} ${CY} Q ${GX} ${CY} ${GX} ${CY - r} L ${GX} ${ry}`;
    s += `<path d="${d}" fill="none" stroke="${it.color}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round" opacity="${(.9 * focus).toFixed(3)}" mask="url(#reveal-${it.id})"/>`;
    s += `<mask id="reveal-${it.id}"><path d="${d}" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="${len}" stroke-dashoffset="${(len * (1 - k)).toFixed(1)}"/></mask>`;
    if (k > .98) s += `<circle cx="${GX}" cy="${ry}" r="6" fill="${it.color}" opacity="${focus.toFixed(3)}"/>`;
    s += `<circle cx="${it.x}" cy="${it.dotY}" r="${(14 + 6 * Math.sin(Math.PI * clamp(focus))).toFixed(1)}" fill="none" stroke="${it.color}" stroke-width="3" opacity="${focus.toFixed(3)}"/>`;
    const note = it.id === 'c' ? (zh ? '1972 年誕生 → 今天第 2 名' : 'Born in 1972 → #2 today') : (zh ? '最年輕（2010）→ 第 10 名' : 'The youngest (2010) → #10');
    const nw = textW(note, 30) + 44, nx = it.id === 'c' ? 1250 : 840, ny = it.id === 'c' ? ry : rowY(10);
    s += `<rect x="${nx}" y="${ny - 26}" width="${nw.toFixed(0)}" height="52" rx="26" fill="${it.color}" opacity="${(.95 * focus).toFixed(3)}"/>`;
    s += T(nx + nw / 2, ny + 10, note, {size: 30, weight: 700, fill: '#fff', anchor: 'middle', op: focus});
    ctx.box('note-' + it.id, nx, ny - 26, nw, 52);
  }
  s += T(1824, 868, zh ? '資料：TIOBE 指數 2026 年 9 月｜誕生年＝首次公開發表／發布' : 'Data: TIOBE Index, Sep 2026 | Born = first public release/announcement', {size: 18, fill: MUTED, anchor: 'end'});
  return s;
};

SCENES.credit = ctx => {
  const k = smooth(ctx.t / .8), zh = ctx.lang === 'zh';
  return `<rect x="0" y="0" width="1920" height="1080" fill="${INK}"/>`
    + T(960, 430, zh ? '感謝觀看' : 'Thanks for watching', {size: 34, fill: '#E9DFC9', anchor: 'middle', op: k, ls: 6})
    + T(960, 560, '李振偉老師', {size: 110, weight: 800, fill: '#fff', anchor: 'middle', op: k, ls: 12})
    + `<line x1="${960 - 180 * k}" y1="610" x2="${960 + 180 * k}" y2="610" stroke="${ACCENT}" stroke-width="5"/>`;
};

window.SCENES = SCENES;
window.SCENE_UTIL = {clamp, smooth, outCubic, inOut, back, lerp, esc, T, textW, yearX, INK, MUTED, RULE, PAPER, ACCENT, MONO, TL_Y, timelineAxis, morphLayout, rowY, ROW0, ROWH, BAR_X, BAR_K};
})();
