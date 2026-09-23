(() => {
  try {
    const theme = localStorage.getItem('morse-tree-theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  } catch { /* Storage is optional; keep the system theme. */ }
})();
