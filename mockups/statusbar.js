// Injects the iOS-style status bar icons (signal, wifi, battery) into every .status .icons
document.querySelectorAll('.status .icons').forEach(el => {
  el.innerHTML = `
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#0F172A"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#0F172A"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#0F172A"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0F172A"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0z" fill="#0F172A"/><path d="M3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.4 1.4a4.5 4.5 0 0 0-6.4 0z" fill="#0F172A"/><path d="M1 4.4a9.9 9.9 0 0 1 14 0l-1.4 1.4a7.9 7.9 0 0 0-11.2 0z" fill="#0F172A"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="#0F172A" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#0F172A"/><rect x="24.5" y="4.5" width="1.8" height="4" rx="1" fill="#0F172A" opacity=".4"/></svg>`;
});
