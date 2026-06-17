// Toast notification system to replace standard browser alert popups

export const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '99999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'feedback-toast-card';
  toast.style.pointerEvents = 'auto';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.padding = '12px 20px';
  toast.style.background = '#FFFFFF';
  
  let borderColor = 'rgba(15, 23, 42, 0.08)';
  let accentColor = '#EA580C'; // Cyber orange default
  let iconHtml = '<span style="font-size: 15px; color: #EA580C; font-weight: bold;">⚠</span>';
  
  if (type === 'success') {
    borderColor = 'rgba(16, 185, 129, 0.2)';
    accentColor = '#10B981';
    iconHtml = '<span style="font-size: 15px; color: #10B981; font-weight: bold;">✔</span>';
  } else if (type === 'error') {
    borderColor = 'rgba(239, 68, 68, 0.2)';
    accentColor = '#EF4444';
    iconHtml = '<span style="font-size: 15px; color: #EF4444; font-weight: bold;">✘</span>';
  }
  
  toast.style.border = `1px solid ${borderColor}`;
  toast.style.borderLeft = `4px solid ${accentColor}`;
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)';
  toast.style.color = '#0F172A';
  toast.style.fontFamily = 'var(--font-body)';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  
  toast.innerHTML = `${iconHtml} <span style="line-height: 1.4;">${message}</span>`;
  container.appendChild(toast);

  // Trigger animation reflow
  toast.offsetHeight;

  // Animate slide-in
  toast.style.transform = 'translateX(0)';
  toast.style.opacity = '1';

  // Automatically fade out and remove after delay
  const dismissTimeout = setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    }, 350);
  }, 4000);

  // Add click to dismiss early
  toast.style.cursor = 'pointer';
  toast.onclick = () => {
    clearTimeout(dismissTimeout);
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    }, 350);
  };
};

// Bind to window object for ease of global access
if (typeof window !== 'undefined') {
  (window as any).showToast = showToast;
}

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  }
}
