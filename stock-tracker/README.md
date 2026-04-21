# 台股自動追蹤系統 — 部署說明

## 檔案結構
```
stock-tracker/
├── index.html      ← 主頁面
├── sw.js           ← Service Worker（推播通知核心）
├── manifest.json   ← PWA 設定
├── icons/
│   ├── icon-72.png    ← 通知小圖示
│   ├── icon-192.png   ← App 圖示
│   └── icon-512.png   ← 啟動畫面圖示
└── README.md
```

## 圖示製作
請至 https://realfavicongenerator.net 或 https://www.pwabuilder.com/imageGenerator
上傳一張 512x512 的圖片，產生各尺寸圖示，放入 icons/ 資料夾。

---

## 部署到 GitHub Pages（免費）

1. 登入 GitHub，點右上角「+」→「New repository」
2. Repository name 填：`stock-tracker`（或任意名稱）
3. 設定為 **Public**，點「Create repository」
4. 點「uploading an existing file」，把所有檔案拖曳上傳
5. 進入 **Settings** → **Pages**
6. Source 選「Deploy from a branch」，Branch 選「main」，點 Save
7. 幾分鐘後網址生效：`https://你的帳號.github.io/stock-tracker/`

---

## 手機安裝為 App

### iPhone (Safari)
1. 用 Safari 開啟網址
2. 點下方分享按鈕（方框+箭頭）
3. 選「加入主畫面」
4. 點「新增」完成

### Android (Chrome)
1. 用 Chrome 開啟網址
2. 點右上角三點選單
3. 選「新增到主畫面」或「安裝應用程式」
4. 完成後 App 出現在桌面

---

## 開啟推播通知

1. 開啟 App 後點右上角「🔔 開啟通知」
2. 瀏覽器詢問時選「允許」
3. 到「警報」頁面點「發送測試通知」確認是否成功

---

## 串接真實股價 API（進階）

在 sw.js 的 `checkStockAlerts()` 函數中，已有 Yahoo Finance API 的串接範本：

```javascript
const res = await fetch(
  'https://query1.finance.yahoo.com/v8/finance/chart/0050.TW?interval=1d&range=1d'
);
const data = await res.json();
const price = data.chart.result[0].meta.regularMarketPrice;
```

台股代號格式：`{代號}.TW`，例如：
- `0050.TW` → 元大台灣50
- `2303.TW` → 聯電
- `4939.TW` → 亞電
- `3231.TW` → 緯創

---

## 定期背景檢查（進階）

需在支援 Periodic Background Sync 的 Chrome Android 上，可做到即使 App 關閉也自動定期檢查警報：

```javascript
// 在 index.html 的 requestNotification() 函數中加入：
const reg = await navigator.serviceWorker.ready;
if ('periodicSync' in reg) {
  await reg.periodicSync.register('stock-check', { minInterval: 30 * 60 * 1000 });
}
```

---

## 注意事項

- iPhone Safari 推播通知需 iOS 16.4 以上，且 App 須已安裝到主畫面
- 免費版 GitHub Pages 沒有後端，推播依賴瀏覽器定期同步
- 若需完全自動化推播（即使手機未開 App），需搭配後端服務（如 Vercel + Cron Job）
