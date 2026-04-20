/**
 * notifications.js — Toast Notification System
 * Coracao Animal — PIM III UNIP
 */

function showNotification(message, type = 'info', duration = 4000) {
  let container = document.getElementById('notifContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifContainer';
    container.style.cssText = `
      position:fixed;top:80px;right:20px;z-index:9999;
      display:flex;flex-direction:column;gap:10px;pointer-events:none;`;
    document.body.appendChild(container);
  }

  const icons  = { success:'✅', error:'❌', info:'ℹ️' };
  const colors = { success:'#4a7c59', error:'#e53935', info:'#185FA5' };
  const color  = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:var(--bg-card);border:1px solid ${color};border-left:4px solid ${color};
    color:var(--text);border-radius:12px;padding:12px 16px;
    font-family:'DM Sans',sans-serif;font-size:14px;max-width:320px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);pointer-events:all;cursor:pointer;
    display:flex;align-items:center;gap:10px;animation:toastIn .3s ease;
    transition:opacity .3s,transform .3s;`;
  toast.innerHTML = `<span style="font-size:18px;flex-shrink:0">${icons[type]||icons.info}</span><span>${message}</span>`;

  const dismiss = () => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  };
  toast.onclick = dismiss;
  container.appendChild(toast);
  setTimeout(dismiss, duration);
}

// Inject keyframes once
if (!document.getElementById('notifStyles')) {
  const s = document.createElement('style');
  s.id = 'notifStyles';
  s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}';
  document.head.appendChild(s);
}