// Buổi 9: tách khỏi index.html (trước đây là script inline) để CSP chặn được mọi script inline.
// Đặt theme TRƯỚC khi Angular chạy -> không nháy nền trang khi mở app ở chế độ tối.
// CSS dark của ng-zorro được ThemeService gắn sau stylesheet chính (thứ tự quyết định ghi đè).
(function () {
  try {
    const p = localStorage.getItem('care.theme');
    const dark =
      p === 'dark' ||
      (p !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {
    // localStorage bị chặn (chế độ riêng tư, chính sách trình duyệt): ThemeService đặt lại sau.
  }
})();
