// Full-film scene renderers (pure functions of ctx). Shared helpers come from scenes.js.
(() => {
const U = window.SCENE_UTIL, S = window.SCENES;
const {clamp, smooth, outCubic, inOut, back, lerp, esc, T, textW, INK, MUTED, RULE, PAPER, ACCENT, MONO} = U;
const rnd = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const f3 = v => (+v).toFixed(3), f1 = v => (+v).toFixed(1);
const Z = (ctx, zh, en) => ctx.lang === 'zh' ? zh : en;
const rect = (x, y, w, h, o = {}) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}" rx="${o.rx ?? 14}" fill="${o.fill || '#fff'}"`
  + `${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 2}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} opacity="${f3(o.op ?? 1)}"/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 3}"`
  + `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round" opacity="${f3(o.op ?? 1)}"/>`;
function arrow(x1, y1, x2, y2, o = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = o.head || 14, c = o.stroke || INK;
  const p1 = [x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45)], p2 = [x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)];
  return line(x1, y1, x2 - Math.cos(a) * h * .6, y2 - Math.sin(a) * h * .6, o)
    + `<path d="M ${f1(x2)} ${f1(y2)} L ${f1(p1[0])} ${f1(p1[1])} L ${f1(p2[0])} ${f1(p2[1])} Z" fill="${c}" opacity="${f3(o.op ?? 1)}"/>`;
}
// partially drawn arrow (k = 0..1)
const growArrow = (x1, y1, x2, y2, k, o = {}) => k <= 0 ? '' : arrow(x1, y1, lerp(x1, x2, k), lerp(y1, y2, k), o);
const typed = (s, k) => [...s].slice(0, Math.round([...s].length * clamp(k))).join('');
const pill = (cx, cy, s, o = {}) => { const size = o.size || 24, w = textW(s, size) + (o.pad ?? 36), h = size + 22;
  return rect(cx - w / 2, cy - h / 2, w, h, {rx: h / 2, fill: o.fill || INK, op: o.op ?? 1, stroke: o.stroke}) + T(cx, cy + size * .36, s, {size, weight: o.weight || 700, fill: o.color || '#fff', anchor: 'middle', op: o.op ?? 1}); };
const LANG = id => window.LESSON_DATA.top10.find(l => l.id === id);

// ======================= 0. hook =======================
const NAMES = ['FORTRAN', 'COBOL', 'LISP', 'BASIC', 'C', 'Pascal', 'Smalltalk', 'C++', 'Objective-C', 'Perl', 'Python', 'Ruby', 'Java', 'JavaScript', 'PHP', 'R',
  'C#', 'Go', 'Swift', 'Kotlin', 'Rust', 'TypeScript', 'Julia', 'Scala', 'Haskell', 'Ada', 'SQL', 'MATLAB', 'Dart', 'Mojo', 'Visual Basic', 'Lua', 'Erlang', 'Prolog'];
S.hook = ctx => {
  const {t} = ctx, p1 = ctx.ph('s0a'), p2 = ctx.ph('s0b');
  const conv = ctx.A(p2.s, 1.6, inOut);                 // digits gather into language names
  const title = ctx.A(ctx.mark('journey', p2.s + 3), .9); // title card
  let s = '';
  // binary rain (deterministic)
  const rainOp = 1 - conv * .85;
  for (let c = 0; c < 46; c++) {
    const x = 40 + c * 41.5, speed = 60 + rnd(c) * 120, off = rnd(c + 99) * 1200;
    for (let r = 0; r < 12; r++) {
      const y = ((off + r * 96 + t * speed) % 1150) - 60;
      const d = rnd(c * 31 + r * 7 + Math.floor((t * speed + off) / 400)) > .5 ? '1' : '0';
      const op = (.10 + .22 * rnd(c * 13 + r)) * rainOp * (y > 860 ? 0 : 1);
      if (op > .01) s += T(x, y, d, {size: 30, family: MONO, fill: INK, op, anchor: 'middle'});
    }
  }
  // center question during s0a
  const q = ctx.A(p1.s + .2, .7) * (1 - conv);
  s += T(960, 470, '0  1', {size: 190, weight: 800, fill: INK, anchor: 'middle', family: MONO, op: q});
  const q2 = ctx.A(ctx.mark('thousands', p1.s + 2.5), .6) * (1 - conv);
  s += T(960, 600, Z(ctx, '→ 上千種程式語言？', '→ thousands of languages?'), {size: 54, weight: 700, fill: ACCENT, anchor: 'middle', op: q2});
  // language-name cloud
  NAMES.forEach((n, i) => {
    const k = smooth((conv - i * .012) / .6);
    // jittered grid (6 columns x 6 rows) keeps names from colliding
    const gi = (i * 7) % 36, col = gi % 6, row = Math.floor(gi / 6);
    const x = 230 + col * 292 + (rnd(i * 3 + 1) - .5) * 90, y = 290 + row * 92 + (rnd(i * 5 + 2) - .5) * 26, size = 26 + rnd(i * 7) * 16;
    const op = k * (1 - title * .82) * (.55 + .45 * rnd(i));
    if (op > .01) s += T(lerp(960, x, k), lerp(540, y, k), n, {size, weight: 700, fill: i % 3 === 0 ? ACCENT : INK, anchor: 'middle', op});
  });
  // title card
  if (title > 0) {
    s += rect(360, 330 + (1 - title) * 30, 1200, 300, {rx: 28, fill: PAPER, op: .94 * title, stroke: INK, sw: 3});
    s += T(960, 455 + (1 - title) * 30, Z(ctx, '程式語言的七十年', '70 Years of Programming Languages'), {size: Z(ctx, 92, 74), weight: 800, anchor: 'middle', op: title});
    s += T(960, 545 + (1 - title) * 30, Z(ctx, '從 0 與 1，到 AI', 'From ones and zeros to AI'), {size: 44, fill: ACCENT, weight: 600, anchor: 'middle', op: title});
    ctx.box('title-card', 360, 330, 1200, 300);
  }
  return s;
};

// ======================= 1. origin =======================
const BITS = ['10110000 00000101', '00000100 00000011', '10100010 01100000', '00000000 11110100', '10001011 00000101', '01101011 11000000'];
S.origin = ctx => {
  const {t} = ctx, a = ctx.ph('s1a'), b = ctx.ph('s1b'), c = ctx.ph('s1c'), d = ctx.ph('s1d');
  let s = '';
  const panel = (x, w, title, sub, k, hi) => rect(x, 260, w, 520, {fill: '#fff', op: .9 * k, stroke: hi ? ACCENT : RULE, sw: hi ? 4 : 2})
    + T(x + 30, 312, title, {size: 34, weight: 800, op: k}) + T(x + 30, 348, sub, {size: 22, fill: MUTED, op: k});
  // panel 1: machine code
  const k1 = ctx.A(a.s, .5);
  s += panel(96, 520, Z(ctx, '機器碼', 'Machine code'), Z(ctx, '直接寫 0 與 1', 'Writing raw 0s and 1s'), k1, t < b.s);
  const flip = ctx.mark('bit', a.s + (a.e - a.s) * .55);
  BITS.forEach((row, i) => {
    const k = ctx.A(a.s + .3 + i * .28, .5);
    const shown = typed(row, k);
    s += T(130, 420 + i * 52, shown, {size: 32, family: MONO, fill: INK, op: k1});
    if (i === 2 && t >= flip) { // one wrong bit
      const e = ctx.A(flip, .3);
      s += rect(130 + 2 * 17.6 - 3, 420 + i * 52 - 28, 22, 36, {rx: 4, fill: '#DC2626', op: .9 * e});
      s += T(130 + 2 * 17.6 + 8, 420 + i * 52, '0', {size: 32, family: MONO, fill: '#fff', anchor: 'middle', op: e});
    }
  });
  s += pill(356, 740, Z(ctx, '✗ 錯一位，整個程式就出錯', '✗ One wrong bit breaks it all'), {size: 22, fill: '#DC2626', op: ctx.A(flip + .2, .4)});
  // panel 2: assembly
  const k2 = ctx.A(b.s, .5);
  s += panel(660, 560, Z(ctx, '組合語言', 'Assembly language'), Z(ctx, '用代號取代數字', 'Short codes replace numbers'), k2, t >= b.s && t < c.s);
  const ASM = ['MOV  AL, 5', 'ADD  AL, 3', 'MOV  [X], AL'];
  ASM.forEach((m, i) => {
    const k = ctx.A(b.s + .6 + i * .45, .5);
    s += T(700, 430 + i * 64, BITS[i].slice(0, 8), {size: 26, family: MONO, fill: MUTED, op: k2 * (1 - .6 * k)});
    s += arrow(880, 421 + i * 64, 930, 421 + i * 64, {stroke: MUTED, sw: 2, op: k});
    s += T(950, 430 + i * 64, m, {size: 34, family: MONO, weight: 700, fill: '#7C3AED', op: k});
  });
  const lock = ctx.A(ctx.mark('machine', b.s + (b.e - b.s) * .65), .5);
  s += rect(700, 640, 480, 100, {rx: 16, fill: '#F3E8FF', op: lock, stroke: '#7C3AED'});
  s += T(940, 682, Z(ctx, '⚠ 只能在特定機器上執行', '⚠ Tied to one specific machine'), {size: 26, weight: 700, fill: '#5B21B6', anchor: 'middle', op: lock});
  s += T(940, 720, Z(ctx, '換一種 CPU，就要重寫', 'New CPU, rewrite everything'), {size: 22, fill: '#5B21B6', anchor: 'middle', op: lock});
  // panel 3: FORTRAN 1957
  const k3 = ctx.A(c.s, .5);
  s += panel(1264, 560, 'FORTRAN', Z(ctx, 'IBM・約翰．巴克斯團隊', 'IBM · John Backus\'s team'), k3, t >= c.s);
  const stamp = ctx.A(ctx.mark('y1957', c.s + .6), .55, back);
  if (stamp > 0) {
    const sc = lerp(1.8, 1, clamp(stamp));
    s += `<g transform="translate(1690 318) scale(${f3(sc)}) rotate(-6)" opacity="${f3(clamp(stamp * 1.5))}">${rect(-92, -40, 184, 74, {rx: 10, fill: ACCENT})}${T(0, 18, '1957', {size: 52, weight: 800, fill: '#fff', anchor: 'middle'})}</g>`;
    ctx.box('stamp1957', 1590, 270, 200, 90);
  }
  const fk = ctx.A(ctx.mark('formula', c.s + (c.e - c.s) * .45), .6);
  s += rect(1300, 390, 490, 84, {rx: 12, fill: '#EFF6FF', stroke: '#2563EB', op: fk});
  s += T(1545, 445, 'Y = A*X + B', {size: 42, family: MONO, weight: 700, fill: '#1D4ED8', anchor: 'middle', op: fk});
  const ck = ctx.A(ctx.mark('compiler', c.s + (c.e - c.s) * .75), .6);
  s += `<path d="M 1400 500 L 1690 500 L 1600 590 L 1490 590 Z" fill="${INK}" opacity="${f3(ck)}"/>`;
  s += T(1545, 553, Z(ctx, '編譯器', 'Compiler'), {size: 28, weight: 700, fill: '#fff', anchor: 'middle', op: ck});
  const out = ctx.A(ctx.mark('compiler', c.s + (c.e - c.s) * .75) + .5, .9);
  // a token travels from the formula through the funnel
  if (out > 0 && out < 1) s += `<circle cx="1545" cy="${f1(lerp(480, 620, out))}" r="9" fill="${ACCENT}"/>`;
  for (let i = 0; i < 3; i++) s += T(1545, 650 + i * 40, BITS[i + 3], {size: 26, family: MONO, fill: INK, anchor: 'middle', op: ctx.A(ctx.mark('compiler', c.s + 3) + .9 + i * .25, .4)});
  // s1d: human thinking -> computer translation arrow
  const hk = ctx.A(d.s + .2, .9);
  s += growArrow(150, 830, 1770, 830, hk, {stroke: ACCENT, sw: 6, head: 22});
  s += T(150, 818, Z(ctx, '人的想法', 'Human ideas'), {size: 24, weight: 700, fill: ACCENT, op: hk});
  s += T(1770, 818, Z(ctx, '電腦執行', 'Computer runs it'), {size: 24, weight: 700, fill: ACCENT, anchor: 'end', op: ctx.A(d.s + 1, .5)});
  s += pill(960, 830, Z(ctx, '高階語言：翻譯交給電腦', 'High-level languages: the computer translates'), {size: 24, fill: INK, op: ctx.A(ctx.mark('human', d.s + 1.5), .5)});
  return s;
};

// ======================= 2. principle: abstraction ladder + three pipelines =======================
const LAYERS = [
  {zh: '高階語言', en: 'High-level', code: 'total = price * 3', c: '#2563EB'},
  {zh: '中間碼', en: 'Bytecode', code: 'LOAD price · PUSH 3 · MUL · STORE total', c: '#7C3AED'},
  {zh: '組合語言', en: 'Assembly', code: 'mov eax,[price] · imul eax,eax,3 · mov [total],eax', c: '#B45309'},
  {zh: '機器碼', en: 'Machine code', code: '8B 05 ·· ·· ·· ··  6B C0 03  89 05 ·· ·· ·· ··', c: INK}
];
S.ladder = ctx => {
  const {t} = ctx, a = ctx.ph('s2a'), b = ctx.ph('s2b'), c = ctx.ph('s2c'), d = ctx.ph('s2d'), e = ctx.ph('s2e');
  let s = '';
  // --- ladder (s2a), fades when pipelines take over
  const lad = 1 - ctx.A(b.s, .6);
  if (lad > 0.01) {
    LAYERS.forEach((L, i) => {
      const y = 280 + i * 125, k = ctx.A(a.s + .4 + i * Math.max(.6, (a.e - a.s - 1.2) / 4), .6);
      s += rect(96, y, 1728, 98, {rx: 14, fill: '#fff', stroke: L.c, sw: 3, op: k * lad});
      s += T(126, y + 46, L[ctx.lang], {size: 30, weight: 800, fill: L.c, op: k * lad});
      s += T(126, y + 80, Z(ctx, ['人最好讀', '給虛擬機器', '給特定 CPU', 'CPU 直接執行'][i], ['easiest for people', 'for a virtual machine', 'for one CPU family', 'what the CPU runs'][i]), {size: 20, fill: MUTED, op: k * lad});
      s += T(460, y + 62, L.code, {size: i === 0 ? 40 : 30, family: MONO, weight: i === 0 ? 700 : 400, fill: INK, op: k * lad});
      if (i < 3) s += growArrow(1760, y + 100, 1760, y + 124, ctx.A(a.s + .9 + i * Math.max(.6, (a.e - a.s - 1.2) / 4), .4), {stroke: MUTED, sw: 3, head: 10, op: lad});
      if (lad > .5 && k > .5) ctx.box('layer' + i, 96, y, 1728, 98);
    });
    s += T(1824, 268, Z(ctx, '示意：實際指令依語言與 CPU 而異', 'Illustrative: real instructions vary by language and CPU'), {size: 18, fill: MUTED, anchor: 'end', op: lad * ctx.A(a.s + 1, .5)});
  }
  // --- pipelines (s2b..s2d)
  const pipeOp = ctx.A(b.s + .3, .6) * (1 - ctx.A(e.s, .6));
  const COLX = i => 470 + i * 272, BW = 236, BH = 78;
  const rows = [
    {ph: b, y: 300, label: Z(ctx, '編譯', 'Compiled'), ex: 'C · Rust', c: '#DC2626',
     boxes: [[0, Z(ctx, '原始碼', 'Source')], [1, Z(ctx, '編譯器', 'Compiler')], [2, Z(ctx, '執行檔', 'Executable')], [4, 'CPU']],
     pro: Z(ctx, '✓ 執行快　✗ 每次修改都要重新編譯', '✓ Fast to run   ✗ Recompile after every change'), proMark: 'fast'},
    {ph: c, y: 480, label: Z(ctx, '直譯', 'Interpreted'), ex: 'Python', c: '#2563EB',
     boxes: [[0, Z(ctx, '原始碼', 'Source')], [1, Z(ctx, '直譯器：一邊讀、一邊執行', 'Interpreter: read & run as it goes'), 3], [4, 'CPU']],
     pro: Z(ctx, '✓ 修改後馬上看到結果　✗ 通常較慢', '✓ Instant results   ✗ Usually slower'), proMark: 'instant'},
    {ph: d, y: 660, label: Z(ctx, '虛擬機器', 'Virtual machine'), ex: 'Java · C#', c: '#7C3AED',
     boxes: [[0, Z(ctx, '原始碼', 'Source')], [1, Z(ctx, '編譯器', 'Compiler')], [2, Z(ctx, '中間碼', 'Bytecode')], [3, Z(ctx, '虛擬機器＋JIT', 'VM + JIT')], [4, 'CPU']],
     pro: Z(ctx, '✓ 可攜　✓ 常用部分即時編譯加速', '✓ Portable   ✓ Hot spots compiled on the fly'), proMark: 'jit'}
  ];
  rows.forEach((r, ri) => {
    const k = ctx.A(r.ph.s + .1, .6) * pipeOp;
    if (k < .01) return;
    s += T(96, r.y + 36, r.label, {size: 34, weight: 800, fill: r.c, op: k});
    s += T(96, r.y + 70, r.ex, {size: 24, weight: 600, fill: MUTED, op: k});
    const xs = [];
    r.boxes.forEach(([col, txt, span], bi) => {
      const bk = ctx.A(r.ph.s + .3 + bi * .25, .45) * pipeOp, x = COLX(col), w = span ? COLX(span) + BW - x : BW;
      s += rect(x, r.y, w, BH, {rx: 12, fill: col === 4 ? INK : '#fff', stroke: r.c, sw: 2.5, op: bk});
      s += T(x + w / 2, r.y + 49, txt, {size: textW(txt, 26) > w - 20 ? 22 : 26, weight: 700, fill: col === 4 ? '#fff' : INK, anchor: 'middle', op: bk});
      xs.push([x, x + w]);
      if (bk > .5) ctx.box(`pipe${ri}-${bi}`, x, r.y, w, BH);
    });
    for (let i = 0; i < xs.length - 1; i++) s += arrow(xs[i][1] + 6, r.y + BH / 2, xs[i + 1][0] - 6, r.y + BH / 2, {stroke: r.c, sw: 3, head: 12, op: ctx.A(r.ph.s + .55 + i * .25, .4) * pipeOp});
    // token travelling along the row (interpreter: stop-and-go to suggest line-by-line)
    const dur = Math.max(1.5, r.ph.e - r.ph.s - 1.2), tk = clamp((t - r.ph.s - .9) / dur);
    if (tk > 0 && tk < 1 && pipeOp > .3) {
      let x;
      if (ri === 1) { const steps = 6, st = Math.floor(tk * steps), fr = clamp((tk * steps - st) * 2.2); x = lerp(xs[0][0] + 40, xs.at(-1)[0] + 40, (st + smooth(fr)) / steps); }
      else x = lerp(xs[0][0] + 40, xs.at(-1)[0] + 40, inOut(tk));
      s += `<circle cx="${f1(x)}" cy="${r.y + BH / 2}" r="12" fill="${ACCENT}" opacity="${f3(pipeOp)}"/>`;
    }
    s += T(COLX(0), r.y + BH + 40, r.pro, {size: 24, weight: 600, fill: r.c, op: ctx.A(ctx.mark(r.proMark, r.ph.s + (r.ph.e - r.ph.s) * .55), .5) * pipeOp});
  });
  // --- trade-off spectrum (s2e)
  const sp = ctx.A(e.s + .4, .7);
  if (sp > 0.01) {
    const X0 = 300, X1 = 1620, Y = 560;
    s += `<defs><linearGradient id="spec" x1="0" x2="1"><stop offset="0" stop-color="#DC2626"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs>`;
    s += rect(X0, Y - 16, (X1 - X0) * outCubic(sp), 32, {rx: 16, fill: 'url(#spec)', op: sp});
    s += T(X0, Y + 70, Z(ctx, '接近硬體', 'Close to hardware'), {size: 32, weight: 800, fill: '#B91C1C', op: sp});
    s += T(X0, Y + 108, Z(ctx, '掌控效能，但責任也大', 'More control, more responsibility'), {size: 24, fill: '#B91C1C', op: ctx.A(ctx.mark('closer', e.s + 4), .5)});
    s += T(X1, Y + 70, Z(ctx, '高抽象', 'High abstraction'), {size: 32, weight: 800, fill: '#1D4ED8', anchor: 'end', op: sp});
    s += T(X1, Y + 108, Z(ctx, '好寫、較安全', 'Easier & safer'), {size: 24, fill: '#1D4ED8', anchor: 'end', op: ctx.A(e.s + 1.6, .5)});
    [['C', .05], ['C++', .15], ['Rust', .26], ['Java', .55], ['C#', .62], ['JavaScript', .78], ['Python', .9]].forEach(([n, p], i) => {
      const k = ctx.A(e.s + 1 + i * .18, .4, back), x = lerp(X0, X1, p), lvl = i % 2;
      s += line(x, Y - 22, x, Y - 46 - lvl * 50, {stroke: MUTED, sw: 2, op: clamp(k)});
      s += pill(x, Y - 66 - lvl * 50, n, {size: 24, fill: LANG({C: 'c', 'C++': 'cpp', Rust: 'rust', Java: 'java', 'C#': 'csharp', JavaScript: 'js', Python: 'python'}[n]).color, op: clamp(k)});
    });
    s += T(960, 350, Z(ctx, '取捨，不是好壞', 'A trade-off, not a ranking'), {size: 40, weight: 800, anchor: 'middle', op: sp});
    if (sp > .5) ctx.box('spectrum', X0, Y - 16, X1 - X0, 32);
  }
  return s;
};

// ======================= 3. history timeline with zooming year window =======================
const EVENTS = [
  {id: 'FORTRAN', y: 1957, zh: '科學計算', en: 'Science', m: 'fortran', c: '#2563EB'},
  {id: 'LISP', y: 1958, zh: 'AI 研究', en: 'AI research', m: 'lisp', c: '#0F766E'},
  {id: 'COBOL', y: 1959, zh: '商業資料', en: 'Business data', m: 'cobol', c: '#6B7280'},
  {id: 'C', y: 1972, zh: '寫 Unix', en: 'Built Unix', m: 'c', c: '#DC2626'},
  {id: 'SQL', y: 1974, zh: '資料庫查詢', en: 'Databases', m: 'sql', c: '#65A30D'},
  {id: 'C++', y: 1985, zh: '加入類別', en: 'Adds classes', m: 'cpp', c: '#7C3AED'},
  {id: 'Python', y: 1991, zh: '', en: '', m: 'python', c: '#2563EB'},
  {id: 'Visual Basic', y: 1991, zh: '', en: '', m: 'vb', c: '#0891B2'},
  {id: 'R', y: 1993, zh: '', en: '', m: 'r', c: '#0F766E'},
  {id: 'Java', y: 1995, zh: '', en: '', m: 'java', c: '#DB2777'},
  {id: 'JavaScript', y: 1995, zh: '', en: '', m: 'js', c: '#CA8A04'},
  {id: 'C#', y: 2000, zh: '微軟', en: 'Microsoft', m: 'csharp', c: '#16A34A'},
  {id: 'Rust 1.0', y: 2015, zh: '記憶體安全', en: 'Memory safety', m: 'rust', c: '#B45309'},
  {id: 'Mojo', y: 2023, zh: 'AI 語言', en: 'AI language', m: 'ai', c: ACCENT}
];
const ERAS = [
  {a: 1950, b: 1969.9, zh: '科學與商業計算', en: 'Science & business', c: '#DBEAFE', ph: 's3a'},
  {a: 1970, b: 1979.9, zh: '系統程式', en: 'Systems', c: '#FEE2E2', ph: 's3b'},
  {a: 1980, b: 1989.9, zh: '物件導向', en: 'Object-oriented', c: '#EDE9FE', ph: 's3c'},
  {a: 1990, b: 1999.9, zh: '個人電腦與網路', en: 'PCs & the web', c: '#FEF3C7', ph: 's3d'},
  {a: 2000, b: 2019.9, zh: '安全・並行・行動', en: 'Safety · concurrency · mobile', c: '#DCFCE7', ph: 's3e'},
  {a: 2020, b: 2030, zh: 'AI', en: 'AI', c: '#FFEDD5', ph: 's3e'}
];
// fixed label levels computed at the widest window so cards never jump between rows
const HX0 = 160, HX1 = 1760, HY = 700;
const hx = (y, w0, w1) => HX0 + (y - w0) * (HX1 - HX0) / (w1 - w0);
const EV_LEVEL = (() => { const lv = [], out = {};
  for (const e of EVENTS) { const x = hx(e.y, 1950, 2030), w = Math.max(textW(e.id, 26), textW(e.zh, 20), textW(e.en, 20)) + 22;
    let l = 0; while ((lv[l] || []).some(([a, b]) => x - w / 2 < b + 6 && x + w / 2 > a - 6)) l++; (lv[l] = lv[l] || []).push([x - w / 2, x + w / 2]); out[e.id] = l; }
  return out; })();
S.timeline = ctx => {
  const {t} = ctx;
  const WIN = [['s3a', 1950, 1982], ['s3b', 1955, 1990], ['s3c', 1962, 1998], ['s3d', 1975, 2005], ['s3e', 1950, 2030]];
  let w0 = WIN[0][1], w1 = WIN[0][2];
  for (let i = 1; i < WIN.length; i++) { const k = ctx.A(ctx.ph(WIN[i][0]).s - .2, 1.3, inOut); w0 = lerp(w0, WIN[i][1], k); w1 = lerp(w1, WIN[i][2], k); }
  const X = y => hx(y, w0, w1);
  let s = `<clipPath id="tlclip"><rect x="${HX0 - 60}" y="250" width="${HX1 - HX0 + 120}" height="560"/></clipPath><g clip-path="url(#tlclip)">`;
  for (const e of ERAS) {
    const k = ctx.A(ctx.ph(e.ph).s, .7), x0 = X(e.a), x1 = X(e.b);
    const glow = e.zh === 'AI' ? ctx.A(ctx.mark('aiera', ctx.ph('s3e').e - 2), .6) : 1;
    s += rect(x0, 270, x1 - x0, HY - 270, {rx: 0, fill: e.c, op: .75 * k * glow});
    const lab = e[ctx.lang], fits = textW(lab, 24) < x1 - x0 - 16;
    s += T((x0 + x1) / 2, 300, fits ? lab : '', {size: 24, weight: 700, fill: MUTED, anchor: 'middle', op: k * glow});
  }
  s += line(HX0 - 60, HY, HX1 + 60, HY, {sw: 3});
  for (let y = 1950; y <= 2030; y += (w1 - w0 > 50 ? 10 : 5)) {
    const x = X(y); if (x < HX0 - 50 || x > HX1 + 50) continue;
    const major = y % 10 === 0;
    s += line(x, HY - (major ? 10 : 6), x, HY + (major ? 10 : 6), {sw: 2});
    if (major) s += T(x, HY + 42, String(y), {size: 24, fill: MUTED, anchor: 'middle'});
  }
  // stems and dots first, then labels on a paper backing so stems never cross text
  const vis = EVENTS.map(e => { const at = ctx.mark(e.m, 0), k = ctx.A(at, .5, back), x = X(e.y);
    const edge = clamp((x - (HX0 - 50)) / 90) * clamp(((HX1 + 50) - x) / 90);
    return {e, at, k, x, kk: clamp(k) * edge, cy: HY - 62 - EV_LEVEL[e.id] * 66}; }).filter(v => v.k > 0);
  for (const {e, at, k, x, kk, cy} of vis) {
    const recent = 1 - ctx.A(at + 2.2, .8);
    s += `<circle cx="${f1(x)}" cy="${HY}" r="${f1(9 * clamp(k) + 4 * recent * clamp(k))}" fill="${e.c}" opacity="${f3(kk)}"/>`;
    s += line(x, HY - 10, x, cy + 12, {stroke: e.c, sw: 2, op: kk});
  }
  for (const {e, x, kk, cy} of vis) {
    const label = e.id + ' ' + e.y, sub = e[ctx.lang], bw = Math.max(textW(label, 26), textW(sub, 20)) + 16;
    s += rect(x - bw / 2, cy - 36, bw, sub ? 62 : 40, {rx: 8, fill: '#FFFDF8', op: .92 * kk});
    s += T(x, cy - (sub ? 8 : -4), label, {size: 26, weight: 800, fill: e.c, anchor: 'middle', op: kk});
    if (sub) s += T(x, cy + 18, sub, {size: 20, fill: INK, anchor: 'middle', op: kk * .85});
    if (kk > .5) ctx.box('ev-' + e.id, x - textW(label, 26) / 2, cy - 30, textW(label, 26), sub ? 56 : 30);
  }
  s += '</g>';
  return s;
};

// ======================= 4. TIOBE method =======================
S.tiobe = ctx => {
  const {t, D} = ctx, a = ctx.ph('s4a'), b = ctx.ph('s4b');
  let s = '';
  const fadeA = 1 - ctx.A(b.s + .2, .6);
  const SRC = ['Google', 'Bing', Z(ctx, '維基百科', 'Wikipedia'), 'Amazon', Z(ctx, '＋20 多個來源', '+20 more sources')];
  const srcAt = Math.min(ctx.mark('google', a.s + 2), ctx.mark('monthly', a.s + 1.2) + .8);
  const srcK = ctx.A(srcAt, .6);
  SRC.forEach((n, i) => {
    const k = ctx.A(srcAt + i * .2, .45) * fadeA, y = 300 + i * 92;
    s += rect(110, y, 330, 70, {rx: 35, fill: '#fff', stroke: INK, sw: 2, op: k});
    s += T(275, y + 45, n, {size: 28, weight: 700, anchor: 'middle', op: k});
    // particles flowing into the funnel
    for (let p = 0; p < 3; p++) {
      const ph = ((t * .7 + p / 3 + i * .13) % 1), px = lerp(450, 820, ph), py = lerp(y + 35, 520, smooth(ph));
      if (srcK > .5) s += `<circle cx="${f1(px)}" cy="${f1(py)}" r="6" fill="${ACCENT}" opacity="${f3(.7 * k * Math.sin(Math.PI * ph))}"/>`;
    }
    if (k > .5) ctx.box('src' + i, 110, y, 330, 70);
  });
  const fk = ctx.A(a.s + .3, .6) * fadeA;
  s += `<path d="M 830 380 L 1090 380 L 1010 660 L 910 660 Z" fill="${INK}" opacity="${f3(fk)}"/>`;
  s += T(960, 460, Z(ctx, '統計搜尋結果', 'Count results'), {size: 28, weight: 700, fill: '#fff', anchor: 'middle', op: fk});
  s += T(960, 510, '"<lang>', {size: 24, family: MONO, fill: '#FDE68A', anchor: 'middle', op: fk});
  s += T(960, 545, 'programming"', {size: 24, family: MONO, fill: '#FDE68A', anchor: 'middle', op: fk});
  s += pill(960, 330, Z(ctx, '每月更新一次', 'Updated monthly'), {size: 24, fill: ACCENT, op: ctx.A(ctx.mark('monthly', a.s + 1.2), .5) * fadeA});
  // output: share bar
  const ok = ctx.A(srcAt + 2.4, .9) * fadeA;
  s += T(1160, 430, Z(ctx, '換算成各語言所占比例（%）', 'Converted into shares (%)'), {size: 26, weight: 700, op: ok});
  let x = 1160; const W = 660;
  D.top10.forEach((l, i) => { const w = l.rating / 100 * W * outCubic(ok); s += rect(x, 460, w, 70, {rx: 0, fill: l.color, op: ok}); if (i < 3) s += T(x + w / 2, 506, l.name, {size: 20, weight: 700, fill: '#fff', anchor: 'middle', op: ok}); x += w; });
  s += rect(x, 460, Math.max(0, 1160 + W * outCubic(ok) - x), 70, {rx: 0, fill: '#CBD5E1', op: ok});
  s += T(1160 + W, 570, Z(ctx, '灰色：其他語言', 'Grey: all other languages'), {size: 20, fill: MUTED, anchor: 'end', op: ok});
  if (ok > .5) ctx.box('sharebar', 1160, 460, W, 70);
  // s4b: what it does / doesn't measure
  const CARDS = [
    {ok: true, zh: '熱門程度與學習資源', en: 'Popularity & resources', c: '#15803D', at: b.s + .9},
    {ok: false, zh: '不是語言的好壞', en: 'Not quality', c: '#B91C1C', at: ctx.mark('notq', b.s + 2)},
    {ok: false, zh: '不是程式碼的數量', en: 'Not lines of code', c: '#B91C1C', at: ctx.mark('notq', b.s + 2) + .7}
  ];
  CARDS.forEach((cd, i) => {
    const k = ctx.A(cd.at, .5), x = 120 + i * 570;
    s += rect(x, 300 + (1 - k) * 20, 520, 220, {rx: 22, fill: '#fff', stroke: cd.c, sw: 4, op: k});
    s += T(x + 260, 400 + (1 - k) * 20, cd.ok ? '✓' : '✗', {size: 72, weight: 800, fill: cd.c, anchor: 'middle', op: k});
    s += T(x + 260, 475 + (1 - k) * 20, cd[ctx.lang], {size: 34, weight: 800, fill: cd.c, anchor: 'middle', op: k});
    if (k > 0) ctx.box('mcard' + i, x, 300, 520, 220);
  });
  const dk = ctx.A(ctx.mark('sep', b.e - 2.4), .6);
  s += rect(560, 580, 800, 110, {rx: 20, fill: INK, op: dk});
  s += T(960, 648, Z(ctx, '本片資料：2026 年 9 月榜單', 'This video: September 2026 rankings'), {size: 38, weight: 800, fill: '#fff', anchor: 'middle', op: dk});
  s += T(1824, 868, Z(ctx, '來源：TIOBE 指數與其定義頁（2026-10-07 查閱）', 'Source: TIOBE Index & definition page (checked 2026-10-07)'), {size: 18, fill: MUTED, anchor: 'end'});
  return s;
};

// ======================= 5b. top-10 cards =======================
const HELLO = {
  python: 'print("Hello, world!")', c: 'printf("Hello, world!\\n");', cpp: 'std::cout << "Hello, world!";',
  java: 'System.out.println("Hello, world!");', csharp: 'Console.WriteLine("Hello, world!");', js: 'console.log("Hello, world!");',
  vb: 'MsgBox "Hello, world!"', sql: "SELECT 'Hello, world!';", r: 'print("Hello, world!")', rust: 'println!("Hello, world!");'
};
const SEG_LANG = {s5b: 'python', s5c: 'c', s5d: 'cpp', s5e: 'java', s5f: 'csharp', s5g: 'js', s5h: 'vb', s5i: 'sql', s5j: 'r', s5k: 'rust'};
function langCard(ctx, l, k, dx, tIn) {
  const D = ctx.D, zh = ctx.lang === 'zh', X = 790 + dx, op = k;
  let s = rect(X, 258, 1034, 600, {rx: 26, fill: '#fff', stroke: l.color, sw: 4, op});
  s += `<circle cx="${X + 84}" cy="342" r="52" fill="${l.color}" opacity="${f3(op)}"/>` + T(X + 84, 360, '#' + l.rank, {size: 44, weight: 800, fill: '#fff', anchor: 'middle', op});
  s += T(X + 160, 368, l.name, {size: l.name.length > 9 ? 60 : 72, weight: 800, fill: l.color, op});
  s += T(X + 1000, 345, l.rating.toFixed(2) + '%', {size: 52, weight: 800, anchor: 'end', op});
  const up = l.change >= 0;
  s += T(X + 1000, 382, (zh ? '較去年 ' : 'vs. last year ') + (up ? '+' : '−') + Math.abs(l.change).toFixed(2) + (zh ? ' 個百分點' : ' pts'), {size: 22, weight: 700, fill: up ? '#15803D' : '#B91C1C', anchor: 'end', op});
  const facts = [[zh ? '誕生' : 'Born', String(l.year)], [zh ? '設計者' : 'Created by', l.who[ctx.lang]],
    [zh ? '執行方式' : 'Runs as', D.labels.run[l.run][ctx.lang]], [zh ? '記憶體' : 'Memory', D.labels.mem[l.mem][ctx.lang]]];
  facts.forEach(([h, v], i) => {
    const fx = X + 40 + (i % 2) * 500, fy = 440 + Math.floor(i / 2) * 84, fk = op * smooth((tIn - .25 - i * .12) / .4);
    s += T(fx, fy, h, {size: 22, fill: MUTED, op: fk});
    s += T(fx, fy + 38, v, {size: textW(v, 30) > 460 ? 24 : 30, weight: 700, op: fk});
  });
  const uk = op * smooth((tIn - .8) / .4);
  s += T(X + 40, 640, zh ? '代表用途' : 'Typical uses', {size: 22, fill: MUTED, op: uk});
  s += T(X + 40, 680, l.use[ctx.lang], {size: 32, weight: 800, fill: l.color, op: uk});
  const ck = op * smooth((tIn - 1.1) / .3), code = HELLO[l.id];
  s += rect(X + 40, 716, 954, 110, {rx: 14, fill: INK, op: ck});
  s += T(X + 66, 754, 'Hello, world!', {size: 18, fill: '#94A3B8', op: ck});
  s += T(X + 66, 800, typed(code, (tIn - 1.3) / 1.4), {size: 32, family: MONO, fill: '#FDE68A', op: ck});
  return s;
}
S.cards = ctx => {
  const {t, D} = ctx;
  const segs = Object.keys(SEG_LANG), cur = segs.filter(id => t >= ctx.ph(id).s).at(-1) || segs[0];
  const ci = segs.indexOf(cur), pcur = ctx.ph(cur);
  // list compaction from the morph layout
  const cp = ctx.A(.1, 1.0, inOut);
  let s = T(lerp(360, 136, cp), 250, Z(ctx, '排名', 'Rank'), {size: 20, fill: MUTED, anchor: 'end'});
  D.top10.forEach(l => {
    const y = U.rowY(l.rank), nameX = lerp(570, 340, cp), barX = lerp(U.BAR_X, 356, cp), k = lerp(U.BAR_K, 15, cp);
    const on = l.id === SEG_LANG[cur], op = lerp(1, on ? 1 : .42, ctx.A(.6, .5));
    if (on && cp > .5) s += rect(96, y - 21, 660, 42, {rx: 10, fill: l.color, op: .14 * ctx.A(pcur.s, .3)});
    s += T(lerp(360, 136, cp), y + 10, String(l.rank), {size: 28, weight: 700, op});
    s += T(nameX, y + 9, l.name, {size: lerp(28, 24, cp), weight: 700, fill: l.color, anchor: 'end', op});
    s += rect(barX, y - 13, l.rating * k, 26, {rx: 4, fill: l.color, op});
    s += T(barX + l.rating * k + 10, y + 9, l.rating.toFixed(2), {size: 22, weight: 600, op});
    s += T(lerp(1800, 760, cp), y + 10, String(l.year), {size: 26, fill: MUTED, anchor: 'end', op: 1 - cp});
    ctx.box('row-' + l.id, 96, y - 21, 660, 42, 'list');
  });
  // detail card with slide transition between languages
  const enter = ctx.A(pcur.s, .55, outCubic);
  if (ci > 0 && enter < 1) s += langCard(ctx, LANG(SEG_LANG[segs[ci - 1]]), 1 - enter, -50 * enter, 9);
  s += langCard(ctx, LANG(SEG_LANG[cur]), enter * ctx.A(.5, .5), 60 * (1 - enter), t - pcur.s);
  return s;
};

// ======================= 5c. comparison table =======================
const CAT_C = {compiled: '#334155', interp: '#0284C7', vm: '#7C3AED', jit: '#D97706', query: '#65A30D',
  manual: '#DC2626', gc: '#2563EB', own: '#B45309', db: '#6B7280', static: '#0F766E', dynamic: '#DB2777', decl: '#6B7280'};
S.compare = ctx => {
  const {t, D} = ctx, a = ctx.ph('s5l'), b = ctx.ph('s5m');
  const COLS = [{x: 470, key: 'run', zh: '執行方式', en: 'How it runs', m: 'run'}, {x: 920, key: 'mem', zh: '記憶體管理', en: 'Memory', m: 'memory'},
    {x: 1370, key: 'typing', zh: '型別檢查', en: 'Type checking', m: 'types'}];
  const CW = 420, RY = r => 300 + (r - 1) * 50;
  let s = T(120, 284, Z(ctx, '語言', 'Language'), {size: 24, fill: MUTED, weight: 700});
  const memFocus = ctx.A(b.s, .5);
  const grp = id => ({manual: ctx.A(b.s + .2, .4), gc: ctx.A(ctx.mark('gc', b.s + 3), .4), own: ctx.A(ctx.mark('own', b.s + 6), .4)}[id] ?? 0);
  COLS.forEach((c, ci) => {
    const k = ctx.A(ctx.mark(c.m, a.s + 1 + ci), .5);
    const dim = c.key === 'mem' ? 1 : 1 - .65 * memFocus;
    s += T(c.x, 284, c[ctx.lang], {size: 24, weight: 700, fill: MUTED, op: k * dim});
    D.top10.forEach((l, i) => {
      const v = l[c.key], kk = ctx.A(ctx.mark(c.m, a.s + 1 + ci) + i * .06, .35);
      let op = kk * dim;
      if (c.key === 'mem' && memFocus > 0) { const g = Math.max(grp(v), v === 'db' ? 0 : 0); op = kk * lerp(1, .3 + .7 * g, memFocus); }
      s += rect(c.x, RY(l.rank) - 4, CW - 30, 40, {rx: 20, fill: CAT_C[v], op});
      s += T(c.x + (CW - 30) / 2, RY(l.rank) + 25, D.labels[c.key][v][ctx.lang], {size: 22, weight: 700, fill: '#fff', anchor: 'middle', op});
      ctx.box(`cell${ci}-${l.id}`, c.x, RY(l.rank) - 4, CW - 30, 40);
    });
  });
  D.top10.forEach(l => {
    const k = ctx.A(a.s + l.rank * .05, .4), memHi = memFocus > 0 ? lerp(1, .35 + .65 * grp(l.mem), memFocus) : 1;
    s += T(120, RY(l.rank) + 26, l.rank + '  ' + l.name, {size: 28, weight: 800, fill: l.color, op: k * memHi});
  });
  // legend for the memory story
  const LEG = [['manual', Z(ctx, '手動管理：快，但容易出錯', 'Manual: fast, error-prone')], ['gc', Z(ctx, '垃圾回收：安全，多一點負擔', 'GC: safer, some overhead')], ['own', Z(ctx, '所有權：編譯時就把關', 'Ownership: checked at compile time')]];
  LEG.forEach(([id, txt], i) => { const k = grp(id) * memFocus; s += pill(330 + i * 630, 832, txt, {size: 24, fill: CAT_C[id], op: k}); });
  return s;
};

// ======================= 6. case study: Android =======================
S.case = ctx => {
  const {t} = ctx, a = ctx.ph('s6a'), b = ctx.ph('s6b'), c = ctx.ph('s6c');
  let s = '';
  const STEPS = [[Z(ctx, '① 問題', '① Problem'), a.s], [Z(ctx, '② 做法', '② Approach'), b.s], [Z(ctx, '③ 結果', '③ Result'), c.s], [Z(ctx, '④ 限制', '④ Limits'), ctx.mark('limits', c.s + 3)]];
  STEPS.forEach(([n, at], i) => { const on = t >= at, k = ctx.A(at, .4); s += pill(260 + i * 300, 278, n, {size: 24, fill: on ? ACCENT : '#fff', color: on ? '#fff' : MUTED, stroke: on ? null : RULE, op: .5 + .5 * k}); });
  // chart
  const CX = 200, CY0 = 790, H = 4.0;
  s += T(CX - 40, 360, Z(ctx, 'Android 漏洞中，記憶體安全漏洞的比例', 'Share of Android vulnerabilities that are memory-safety bugs'), {size: 24, weight: 700});
  for (const g of [0, 25, 50, 75, 100]) { s += line(CX, CY0 - g * H, CX + 560, CY0 - g * H, {stroke: RULE, sw: 1.5}); s += T(CX - 12, CY0 - g * H + 8, g + '%', {size: 20, fill: MUTED, anchor: 'end'}); }
  const b1 = ctx.A(ctx.mark('c76', a.s + 4), 1.0, outCubic), b2 = ctx.A(c.s + .2, 1.2, outCubic);
  s += rect(CX + 70, CY0 - 76 * H * b1, 160, 76 * H * b1, {rx: 6, fill: '#DC2626'});
  s += T(CX + 150, CY0 + 34, '2019', {size: 26, weight: 700, anchor: 'middle'});
  s += T(CX + 150, CY0 - 76 * H * b1 - 14, Math.round(76 * b1) + '%', {size: 40, weight: 800, fill: '#DC2626', anchor: 'middle', op: clamp(b1 * 3)});
  s += rect(CX + 330, CY0 - 24 * H * b2, 160, 24 * H * b2, {rx: 6, fill: '#15803D'});
  s += T(CX + 410, CY0 + 34, '2024', {size: 26, weight: 700, anchor: 'middle', op: ctx.A(c.s, .4)});
  if (b2 > 0) s += T(CX + 410, CY0 - 24 * H * b2 - 14, Math.round(24 * b2) + '%', {size: 40, weight: 800, fill: '#15803D', anchor: 'middle', op: clamp(b2 * 3)});
  s += T(CX - 40, 862, Z(ctx, '資料：Google Security Blog（2024-09-25）', 'Data: Google Security Blog (2024-09-25)'), {size: 18, fill: MUTED});
  // code-base mosaic (illustrative)
  const MX = 960, MY = 380, SQ = 30, G = 8, COLS = 14, ROWS = 7;
  const mk = ctx.A(ctx.mark('android', a.s + 1.5), .6);
  s += T(MX, 360, Z(ctx, 'Android 系統程式碼（示意）', 'Android system code (illustrative)'), {size: 24, weight: 700, op: mk});
  const newK = clamp((t - b.s - .8) / Math.max(1, b.e - b.s - 1));
  for (let cI = 0; cI < COLS; cI++) for (let r = 0; r < ROWS; r++) {
    const isNew = cI >= 9, idx = (cI - 9) * ROWS + r, n = (COLS - 9) * ROWS;
    let fill, op;
    if (!isNew) { fill = rnd(cI * 7 + r) > .45 ? '#DC2626' : '#7C3AED'; op = mk * (.55 + .2 * rnd(cI + r * 3)); }
    else { if (idx / n > newK) continue; fill = rnd(cI * 5 + r * 11) > .5 ? '#B45309' : '#7F52FF'; op = 1; }
    s += rect(MX + cI * (SQ + G), MY + 20 + r * (SQ + G), SQ, SQ, {rx: 5, fill, op});
  }
  const lg = ctx.A(b.s + .4, .5);
  s += rect(MX, 680, 22, 22, {rx: 4, fill: '#DC2626', op: mk}) + T(MX + 32, 699, 'C', {size: 22, op: mk});
  s += rect(MX + 80, 680, 22, 22, {rx: 4, fill: '#7C3AED', op: mk}) + T(MX + 112, 699, 'C++', {size: 22, op: mk});
  s += rect(MX + 200, 680, 22, 22, {rx: 4, fill: '#B45309', op: lg}) + T(MX + 232, 699, 'Rust', {size: 22, op: lg});
  s += rect(MX + 310, 680, 22, 22, {rx: 4, fill: '#7F52FF', op: lg}) + T(MX + 342, 699, 'Kotlin', {size: 22, op: lg});
  // "not a rewrite" tag
  const nr = ctx.A(b.s + .2, .5);
  s += T(MX + COLS * (SQ + G) + 12, 400 + ROWS * (SQ + G) / 2, Z(ctx, '← 新程式碼', '← New code'), {size: 24, weight: 700, fill: '#B45309', op: nr});
  s += pill(1640, 300 + 0, Z(ctx, '不是全部重寫', 'Not a full rewrite'), {size: 22, fill: '#15803D', op: nr});
  // limits
  const lk = ctx.A(ctx.mark('limits', c.s + 3), .5), lk2 = ctx.A(ctx.mark('limits', c.s + 3) + 1.4, .5);
  s += rect(MX, 735, 400, 90, {rx: 16, fill: '#FEF2F2', stroke: '#B91C1C', op: lk}) + T(MX + 200, 792, Z(ctx, '舊的 C／C++ 仍在', 'Old C/C++ remains'), {size: 28, weight: 800, fill: '#B91C1C', anchor: 'middle', op: lk});
  s += rect(MX + 430, 735, 400, 90, {rx: 16, fill: '#FEF2F2', stroke: '#B91C1C', op: lk2}) + T(MX + 630, 792, Z(ctx, '跨語言銜接成本', 'Cross-language cost'), {size: 28, weight: 800, fill: '#B91C1C', anchor: 'middle', op: lk2});
  return s;
};

// ======================= 7. AI era =======================
S.ai = ctx => {
  const {t} = ctx, a = ctx.ph('s7a'), b = ctx.ph('s7b'), c = ctx.ph('s7c');
  let s = '';
  const out = 1 - ctx.A(c.s, .6);
  const merge = ctx.A(b.s + .3, 1.1, inOut);
  const pk = ctx.A(ctx.mark('python', a.s + 2), .5), gk = ctx.A(ctx.mark('gpu', a.s + 4), .5);
  const topY = lerp(300, 420, merge), botY = lerp(580, 420, merge);
  if (out > .01) {
    s += rect(140, topY, 760, 200, {rx: 24, fill: '#DBEAFE', stroke: '#2563EB', sw: 3, op: pk * out * (1 - merge)});
    s += T(520, topY + 90, 'Python', {size: 54, weight: 800, fill: '#1D4ED8', anchor: 'middle', op: pk * out * (1 - merge)});
    s += T(520, topY + 145, Z(ctx, '好寫・套件豐富（PyTorch 等）', 'Easy to write · rich libraries (PyTorch…)'), {size: 26, fill: '#1D4ED8', anchor: 'middle', op: pk * out * (1 - merge)});
    s += rect(140, botY, 760, 200, {rx: 24, fill: '#F1F5F9', stroke: INK, sw: 3, op: gk * out * (1 - merge)});
    s += T(520, botY + 90, Z(ctx, 'C++ ／ GPU 程式', 'C++ / GPU code'), {size: 50, weight: 800, anchor: 'middle', op: gk * out * (1 - merge)});
    s += T(520, botY + 145, Z(ctx, '負責大量運算', 'Does the heavy computation'), {size: 26, fill: MUTED, anchor: 'middle', op: gk * out * (1 - merge)});
    s += arrow(520, 510, 520, 572, {sw: 4, op: gk * out * (1 - merge)});
    // merged Mojo block
    s += `<defs><linearGradient id="mojo" x1="0" x2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="${ACCENT}"/></linearGradient></defs>`;
    s += rect(140, 400, 760, 240, {rx: 28, fill: 'url(#mojo)', op: merge * out});
    s += T(520, 500, 'Mojo', {size: 76, weight: 800, fill: '#fff', anchor: 'middle', op: merge * out});
    s += T(520, 560, Z(ctx, '像 Python 的語法', 'Python-like syntax'), {size: 30, weight: 700, fill: '#fff', anchor: 'middle', op: merge * out});
    s += T(520, 605, Z(ctx, '直接編譯給 CPU 與 GPU', 'Compiles directly for CPUs & GPUs'), {size: 30, weight: 700, fill: '#fff', anchor: 'middle', op: ctx.A(ctx.mark('cpu', b.s + 3), .5) * out});
    // mini timeline
    const tk = ctx.A(ctx.mark('y2023', b.s + 1.5), .6) * out, tk2 = ctx.A(ctx.mark('y2026', b.s + 5), .6) * out;
    s += line(1040, 520, lerp(1040, 1780, tk2 > 0 ? 1 : .45 * tk), 520, {sw: 4, op: tk});
    s += `<circle cx="1100" cy="520" r="14" fill="#2563EB" opacity="${f3(tk)}"/>` + T(1100, 480, '2023', {size: 40, weight: 800, fill: '#2563EB', anchor: 'middle', op: tk});
    s += T(1100, 575, Z(ctx, 'Modular 發表', 'Announced by Modular'), {size: 24, anchor: 'middle', op: tk});
    s += `<circle cx="1680" cy="520" r="${f1(14 + 4 * tk2)}" fill="${ACCENT}" opacity="${f3(tk2)}"/>` + T(1680, 480, Z(ctx, '2026 年 8 月', 'Aug 2026'), {size: 40, weight: 800, fill: ACCENT, anchor: 'middle', op: tk2});
    s += T(1680, 575, Z(ctx, '1.0 穩定版', 'Stable 1.0'), {size: 24, anchor: 'middle', op: tk2});
  }
  // s7c: natural language as interface (illustrative)
  const ck = ctx.A(c.s + .3, .6);
  if (ck > 0.01) {
    s += rect(260, 300, 1400, 120, {rx: 60, fill: '#fff', stroke: RULE, op: ck});
    s += `<circle cx="330" cy="360" r="34" fill="${INK}" opacity="${f3(ck)}"/>` + T(330, 371, Z(ctx, '你', 'You'), {size: 26, weight: 700, fill: '#fff', anchor: 'middle', op: ck});
    s += T(390, 372, typed(Z(ctx, '「幫我寫一個函式，計算全班的平均分數」', '"Write a function that computes the class average."'), (t - c.s - .5) / 1.6), {size: 34, weight: 600, op: ck});
    const ak = ctx.A(ctx.mark('describe', c.s + 3.5), .5);
    s += arrow(960, 432, 960, 480, {sw: 4, stroke: ACCENT, op: ak});
    s += rect(260, 490, 1400, 250, {rx: 22, fill: INK, op: ak});
    s += `<circle cx="330" cy="550" r="34" fill="${ACCENT}" opacity="${f3(ak)}"/>` + T(330, 560, 'AI', {size: 26, weight: 800, fill: '#fff', anchor: 'middle', op: ak});
    const code = ['def average(scores):', '    return sum(scores) / len(scores)'];
    code.forEach((ln, i) => s += T(400, 570 + i * 60, typed(ln, (t - ctx.mark('describe', c.s + 3.5) - .5 - i * 1.0) / 1.0), {size: 36, family: MONO, fill: '#FDE68A', op: ak}));
    s += T(1640, 720, Z(ctx, '示意', 'Illustrative'), {size: 20, fill: '#94A3B8', anchor: 'end', op: ak});
    s += T(960, 800, Z(ctx, '自然語言 → AI 助手 → 程式碼（仍需人來驗證）', 'Natural language → AI assistant → code (still needs human review)'), {size: 28, weight: 700, fill: ACCENT, anchor: 'middle', op: ctx.A(ctx.mark('describe', c.s + 3.5) + 2.5, .6)});
  }
  return s;
};

// ======================= 8. outlook =======================
const OUT = [
  {tag: {zh: '已公佈', en: 'ANNOUNCED'}, c: '#15803D', lines: {zh: ['Modular 宣布：', '2026 年開源', 'Mojo 編譯器與工具鏈'], en: ['Modular has announced:', 'Mojo compiler & toolchain', 'to be open-sourced in 2026']}},
  {tag: {zh: '研究中', en: 'RESEARCH'}, c: '#1D4ED8', lines: {zh: ['LMPL 2026 研討會：', '大型語言模型 ×', '程式語言設計'], en: ['LMPL 2026 workshop:', 'large language models ×', 'programming languages']}},
  {tag: {zh: '推測', en: 'INFERENCE'}, c: '#B45309', lines: {zh: ['工程師的時間轉向：', '描述需求', '與驗證結果'], en: ['Engineers\' time shifts to:', 'specifying requirements', 'and verifying results']}}
];
S.outlook = ctx => {
  const {t} = ctx, a = ctx.ph('s8a'), b = ctx.ph('s8b');
  const ats = [a.s + .2, ctx.mark('research', a.s + 4), b.s + .2];
  let s = '';
  OUT.forEach((o, i) => {
    const k = ctx.A(ats[i], .55), x = 96 + i * 594, y = 290 + (1 - k) * 24;
    s += rect(x, y, 546, 380, {rx: 24, fill: '#fff', stroke: o.c, sw: 4, op: k});
    s += pill(x + 30 + (textW(o.tag[ctx.lang], 24) + 36) / 2, y + 52, o.tag[ctx.lang], {size: 24, fill: o.c, op: k});
    o.lines[ctx.lang].forEach((ln, j) => { const base = j === 0 ? 30 : 38, size = Math.min(base, Math.floor(base * 474 / Math.max(1, textW(ln, base))));
      s += T(x + 36, y + 160 + j * 62, ln, {size, weight: j === 0 ? 600 : 800, fill: j === 0 ? MUTED : INK, op: k}); });
    if (k > 0) ctx.box('out' + i, x, 290, 546, 380);
  });
  const uk = ctx.A(ctx.mark('open', b.s + 4), .6);
  s += rect(96, 712, 1728, 96, {rx: 20, fill: '#FEF2F2', stroke: '#B91C1C', sw: 3, op: uk});
  s += T(960, 774, Z(ctx, '未解問題：AI 產生的程式碼，正確嗎？安全嗎？', 'Open problem: is AI-generated code correct? Is it secure?'), {size: 36, weight: 800, fill: '#B91C1C', anchor: 'middle', op: uk});
  s += T(1824, 862, Z(ctx, '截至 2026-10-07｜來源：Modular（2026-08-11）、LMPL 2026', 'As of 2026-10-07 | Sources: Modular (2026-08-11), LMPL 2026'), {size: 18, fill: MUTED, anchor: 'end'});
  return s;
};

// ======================= 9. recap =======================
S.recap = ctx => {
  const {t} = ctx, a = ctx.ph('s9a');
  const NODES = [
    {big: '0 1', zh: '機器碼', en: 'Machine code', m: null, c: INK},
    {big: 'MOV', zh: '組合語言', en: 'Assembly', m: 'n2', c: '#7C3AED'},
    {big: 'Y=A*X', zh: '高階語言（1957～）', en: 'High-level (1957–)', m: 'n3', c: '#2563EB'},
    {big: 'AI', zh: '自然語言＋AI', en: 'Natural language + AI', m: 'n4', c: ACCENT}
  ];
  let s = '';
  NODES.forEach((n, i) => {
    const at = n.m ? ctx.mark(n.m, a.s + 1 + i * 1.2) : a.s + .2, k = ctx.A(at, .5, back), x = 280 + i * 453;
    if (i > 0) s += growArrow(x - 453 + 120, 450, x - 120, 450, ctx.A(at - .3, .4), {stroke: MUTED, sw: 4, head: 16});
    s += `<circle cx="${x}" cy="450" r="${f1(105 * clamp(k))}" fill="${n.c}" opacity="${f3(clamp(k))}"/>`;
    s += T(x, 450 + (n.big.length > 3 ? 14 : 22), n.big, {size: n.big.length > 3 ? 40 : 64, weight: 800, fill: '#fff', anchor: 'middle', family: n.big === 'AI' ? null : MONO, op: clamp(k)});
    s += T(x, 610, n[ctx.lang], {size: 30, weight: 700, fill: n.c, anchor: 'middle', op: clamp(k)});
    ctx.box('node' + i, x - 105, 345, 210, 210);
  });
  const q = ctx.A(ctx.mark('ask', a.e - 3), .6);
  s += T(960, 760, Z(ctx, '你要解決什麼問題？', 'What problem are you solving?'), {size: 64, weight: 800, fill: ACCENT, anchor: 'middle', op: q});
  return s;
};
})();
