// Verified lesson data (sources listed in project.json). Checked 2026-10-07.
// TIOBE Index, September 2026: rank, rating %, change vs. Sep 2025.
// year = first public release / announcement (one consistent event type for every language).
window.LESSON_DATA = {
  tiobeMonth: {zh: 'TIOBE 指數 2026 年 9 月', en: 'TIOBE Index, September 2026'},
  top10: [
    {id: 'python', name: 'Python', rank: 1, last: 1, rating: 17.76, change: -8.22, year: 1991, color: '#2563EB',
     who: {zh: '吉多．范羅蘇姆', en: 'Guido van Rossum'}, run: 'interp', mem: 'gc', typing: 'dynamic',
     use: {zh: '資料科學・AI・自動化', en: 'Data science · AI · automation'}},
    {id: 'c', name: 'C', rank: 2, last: 3, rating: 10.28, change: 1.63, year: 1972, color: '#DC2626',
     who: {zh: '丹尼斯．里奇（貝爾實驗室）', en: 'Dennis Ritchie (Bell Labs)'}, run: 'compiled', mem: 'manual', typing: 'static',
     use: {zh: '作業系統・嵌入式・驅動程式', en: 'Operating systems · embedded · drivers'}},
    {id: 'cpp', name: 'C++', rank: 3, last: 2, rating: 8.67, change: -0.13, year: 1985, color: '#7C3AED',
     who: {zh: '比雅尼．史特勞斯特魯普', en: 'Bjarne Stroustrup'}, run: 'compiled', mem: 'manual', typing: 'static',
     use: {zh: '遊戲引擎・瀏覽器・高頻交易', en: 'Game engines · browsers · trading'}},
    {id: 'java', name: 'Java', rank: 4, last: 4, rating: 7.54, change: -0.81, year: 1995, color: '#DB2777',
     who: {zh: '詹姆斯．高斯林（昇陽電腦）', en: 'James Gosling (Sun Microsystems)'}, run: 'vm', mem: 'gc', typing: 'static',
     use: {zh: '企業後端・Android', en: 'Enterprise back ends · Android'}},
    {id: 'csharp', name: 'C#', rank: 5, last: 5, rating: 4.22, change: -2.16, year: 2000, color: '#16A34A',
     who: {zh: '安德斯．海爾斯伯格（微軟）', en: 'Anders Hejlsberg (Microsoft)'}, run: 'vm', mem: 'gc', typing: 'static',
     use: {zh: 'Windows 應用・雲端・Unity 遊戲', en: 'Windows apps · cloud · Unity games'}},
    {id: 'js', name: 'JavaScript', rank: 6, last: 6, rating: 2.76, change: -0.46, year: 1995, color: '#CA8A04',
     who: {zh: '布蘭登．艾克（網景）', en: 'Brendan Eich (Netscape)'}, run: 'jit', mem: 'gc', typing: 'dynamic',
     use: {zh: '網頁互動・前後端', en: 'Web interactivity · front & back end'}},
    {id: 'vb', name: 'Visual Basic', rank: 7, last: 7, rating: 2.55, change: -0.28, year: 1991, color: '#0891B2',
     who: {zh: '微軟', en: 'Microsoft'}, run: 'vm', mem: 'gc', typing: 'static',
     use: {zh: 'Office 自動化・企業舊系統', en: 'Office automation · legacy business apps'}},
    {id: 'sql', name: 'SQL', rank: 8, last: 11, rating: 2.16, change: 0.29, year: 1974, color: '#65A30D',
     who: {zh: '張伯倫與博伊斯（IBM）', en: 'Chamberlin & Boyce (IBM)'}, run: 'query', mem: 'db', typing: 'decl',
     use: {zh: '資料庫查詢與管理', en: 'Querying & managing databases'}},
    {id: 'r', name: 'R', rank: 9, last: 13, rating: 1.69, change: 0.27, year: 1993, color: '#0F766E',
     who: {zh: '伊哈卡與簡特曼（奧克蘭大學）', en: 'Ihaka & Gentleman (Univ. of Auckland)'}, run: 'interp', mem: 'gc', typing: 'dynamic',
     use: {zh: '統計分析・資料視覺化', en: 'Statistics · data visualization'}},
    {id: 'rust', name: 'Rust', rank: 10, last: 18, rating: 1.34, change: 0.33, year: 2010, color: '#B45309',
     who: {zh: '格雷登．霍爾（Mozilla 贊助）', en: 'Graydon Hoare (Mozilla-sponsored)'}, run: 'compiled', mem: 'own', typing: 'static',
     use: {zh: '系統程式・基礎設施・安全', en: 'Systems · infrastructure · safety'}}
  ],
  labels: {
    run: {compiled: {zh: '編譯', en: 'Compiled'}, interp: {zh: '直譯', en: 'Interpreted'}, vm: {zh: '虛擬機器', en: 'Virtual machine'},
          jit: {zh: '即時編譯', en: 'JIT engine'}, query: {zh: '資料庫引擎', en: 'Database engine'}},
    mem: {manual: {zh: '手動管理', en: 'Manual'}, gc: {zh: '垃圾回收', en: 'Garbage collected'}, own: {zh: '所有權規則', en: 'Ownership'},
          db: {zh: '由資料庫管理', en: 'Managed by DB'}},
    typing: {static: {zh: '靜態型別', en: 'Static'}, dynamic: {zh: '動態型別', en: 'Dynamic'}, decl: {zh: '宣告式查詢', en: 'Declarative'}}
  }
};
