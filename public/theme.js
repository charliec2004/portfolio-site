// Set the saved theme before the stylesheet paints; React handles later changes.
let saved;
try {
  saved = localStorage.getItem('portfolio-theme');
} catch {
  // Storage can be unavailable in private browsing.
}

const theme = saved === 'light' || saved === 'dark'
  ? saved
  : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.dataset.theme = theme;
document.querySelector('meta[name="theme-color"]')
  ?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f4f4f0');
