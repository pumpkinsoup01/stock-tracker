const CACHE = 'stock-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* 安裝：快取靜態資源 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

/* 啟動：清除舊快取 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* 攔截請求：優先返回快取 */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

/* 推播通知處理 */
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '台股追蹤警報';
  const options = {
    body: data.body || '有新的股價警報，請查看！',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'stock-alert',
    requireInteraction: true,
    actions: [
      { action: 'view',    title: '查看詳情' },
      { action: 'dismiss', title: '略過' }
    ],
    data: { url: data.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

/* 點擊通知時開啟頁面 */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* 背景同步（觸發警報檢查） */
self.addEventListener('sync', e => {
  if (e.tag === 'check-alerts') {
    e.waitUntil(checkStockAlerts());
  }
});

/* 定期推播（需搭配 Periodic Background Sync API） */
self.addEventListener('periodicsync', e => {
  if (e.tag === 'stock-check') {
    e.waitUntil(checkStockAlerts());
  }
});

async function checkStockAlerts() {
  /* 此處可串接 Yahoo Finance API 取得即時股價 */
  /* 範例：檢查 0050 */
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/0050.TW?interval=1d&range=1d');
    const data = await res.json();
    const price = data.chart.result[0].meta.regularMarketPrice;

    const alerts = await getStoredAlerts();
    for (const alert of alerts) {
      if (alert.code === '0050' && price <= alert.buyPrice) {
        await self.registration.showNotification('加碼訊號 📈', {
          body: `0050 現價 $${price}，已到達加碼參考價 $${alert.buyPrice}！`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        });
      }
    }
  } catch (e) {
    console.log('Alert check skipped (offline or API limit)');
  }
}

async function getStoredAlerts() {
  /* 從 IndexedDB 或 Cache 取得使用者設定的警報 */
  return [
    { code: '0050',   buyPrice: 80.1,  stopPrice: null,  sellPrice: null },
    { code: '009816', buyPrice: 11.4,  stopPrice: null,  sellPrice: null },
    { code: '4939',   buyPrice: null,  stopPrice: 43.46, sellPrice: null },
    { code: '2303',   buyPrice: null,  stopPrice: null,  sellPrice: 77.5  },
  ];
}
