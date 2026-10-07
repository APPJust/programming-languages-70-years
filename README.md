# 程式語言的七十年：從 0 與 1 到 AI

互動教學動畫（李振偉老師）。線上觀看：https://appjust.github.io/programming-languages-70-years/

- 長度 8:44，1920×1080 動畫畫面，中文／英文配音（Gemini TTS），字幕可切換「繁中＋英文」或「繁中＋越南文」
- 內容：程式語言的起源（1957 年 FORTRAN）、編譯／直譯／虛擬機器的原理、七十年演進時間軸、TIOBE 指數 2026 年 9 月前 10 名比較、Android 記憶體安全案例、AI 時代的語言與展望
- 互動練習：「時光滑桿」（某個年代時，前 10 名有哪些已誕生）、「任務配對」（依任務選語言，有回饋）
- 鍵盤：空白鍵播放／暫停，← → 前後 5 秒

## 本機開啟

瀏覽器無法直接以 `file://` 讀取資料與音訊，請用本機伺服器：

```bash
python -m http.server 8000
```

再開啟 http://localhost:8000/

## 資料來源（查閱日 2026-10-07）

- TIOBE Index for September 2026 — https://www.tiobe.com/tiobe-index/
- IBM History: FORTRAN — https://www.ibm.com/history/fortran
- Google Security Blog, Eliminating Memory Safety Vulnerabilities at the Source (2024-09-25)
- Modular, Modular 26.5: Mojo 1.0 is here! (2026-08-11)
- LMPL 2026 (SPLASH/ISSTA 2026)

動畫中的流程圖、指令與 AI 對話範例為示意，非實測。

## 授權

- 字型：Noto Sans、Noto Sans TC，SIL Open Font License 1.1（見 `fonts/OFL.txt`）
- 背景音樂與音效為程序化原創合成；旁白由 Google Gemini API 產生
