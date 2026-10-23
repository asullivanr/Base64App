(() => {
  const storageKey = 'base64-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // Theme switching still works when browser storage is unavailable.
  }

  function applyTheme() {
    document.documentElement.dataset.theme = preference === 'system'
      ? (systemTheme.matches ? 'dark' : 'light')
      : preference;
  }

  applyTheme();
  systemTheme.addEventListener('change', applyTheme);
  document.addEventListener('DOMContentLoaded', () => {
    const control = document.getElementById('theme');
    control.value = preference;
    control.addEventListener('change', () => {
      preference = control.value;
      applyTheme();
      try {
        if (preference === 'system') localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, preference);
      } catch {
        // Keep the selected theme for this page even without storage.
      }
    });
  });
})();
