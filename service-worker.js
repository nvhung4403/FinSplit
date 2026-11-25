const CACHE_NAME = 'chia-tien-cache-v41';

// Danh sách các file cốt lõi cần được cache để ứng dụng hoạt động.
const urlsToCache = [
  '/',
  '/index.html',
  '/history.html',
  '/tonghop_thanhtoan.html',
  '/thanhtoan_lichsu.html',
  '/style.css',
  '/payment-summary.css',
  '/payment-detail.css',
  '/history-style.css',
  'https://cdn.lordicon.com/lordicon.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js'
];

// Sự kiện 'install': Tải và lưu các file mới vào cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mở cache và tải các file mới cho phiên bản:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Buộc service worker mới được kích hoạt ngay lập tức.
});

// Sự kiện 'activate': Dọn dẹp các cache của phiên bản cũ.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Nếu tên cache không phải là phiên bản hiện tại, hãy xóa nó đi.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Dọn dẹp cache cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Giành quyền kiểm soát các tab đang mở ngay lập tức.
});


// Sự kiện 'fetch': Xử lý các yêu cầu mạng theo chiến lược "Network First" cải tiến.
self.addEventListener('fetch', event => {
  event.respondWith(
    // 1. Cố gắng lấy dữ liệu từ mạng trước.
    fetch(event.request).then(networkResponse => {
      // Kiểm tra xem chúng ta có nhận được một phản hồi hợp lệ không
      if (networkResponse && networkResponse.status === 200) {
        // 2. Nếu thành công, sao chép phản hồi và cập nhật cache.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
      }
      // 3. Trả về phản hồi gốc từ mạng (dù thành công hay không).
      return networkResponse;
    }).catch(() => {
      // 4. Nếu mạng thất bại (offline), tìm và trả về từ cache.
      console.log('Mạng thất bại, tìm trong cache...');
      return caches.match(event.request);
    })
  );
});