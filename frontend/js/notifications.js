/**
 * notifications.js - Toast Notification System
 * Coracao Animal - PIM III UNIP
 */

function showNotification(message, type = 'info', duration = 4000) {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none';
    document.body.appendChild(container);
  }

  const cfg = {
    success: { border: '#4a7c59', icon: '✅' },
    error:   { border: '#e53935', icon: '❌' },
    info:    { border: '#185FA5', icon: 'ℹ️' },
  }[type] || { border: '#185FA5', icon: 'ℹ️' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:var(--bg-card);border:1px solid ${cfg.border};
    border-left:4px solid ${cfg.border};color:var(--text);
    border-radius:12px;padding:12px 16px;
    font-family:'DM Sans',sans-serif;font-size:14px;
    max-width:320px;box-shadow:0 4px 20px var(--shadow);
    pointer-events:all;cursor:pointer;
    display:flex;align-items:center;gap:10px;
    animation:slideInToast .3s ease;
    transition:opacity .3s, transform .3s;
  `;
  toast.innerHTML = `<span style="font-size:18px;flex-shrink:0">${cfg.icon}</span><span>${message}</span>`;
  toast.onclick = () => { toast.style.opacity='0'; toast.style.transform='translateX(20px)'; setTimeout(()=>toast.remove(),300); };
  container.appendChild(toast);
  setTimeout(() => toast.click(), duration);
}

const _ns = document.createElement('style');
_ns.textContent = '@keyframes slideInToast{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}';
document.head.appendChild(_ns);