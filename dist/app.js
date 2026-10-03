const views = [...document.querySelectorAll('[data-view]')];
const navButtons = [...document.querySelectorAll('[data-nav]')];
const bottomBar = document.querySelector('#bottomBar');
const weddingStart = new Date('2026-10-18T14:30:00+08:00').getTime();
const weddingEnd = new Date('2026-10-18T15:00:00+08:00').getTime();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentView;

function showView(requested, push = true) {
  const name = views.some(view => view.dataset.view === requested) ? requested : 'home';
  const changed = currentView !== name;
  if (lightbox.classList.contains('open')) closeImage();
  views.forEach(view => {
    const active = view.dataset.view === name;
    view.classList.toggle('active', active);
    view.setAttribute('aria-hidden', String(!active));
  });
  navButtons.forEach(button => {
    const active = button.dataset.nav === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  bottomBar.hidden = name === 'home';
  if (push && changed) {
    history.pushState({view:name}, '', location.pathname + location.search + (name === 'home' ? '' : `#${name}`));
  }
  if (changed) window.scrollTo({top:0, behavior:'instant'});
  if (currentView && changed) {
    const heading = document.querySelector(`[data-view="${name}"] h1`);
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll:true});
  }
  currentView = name;
  updateCountdown();
}

document.querySelectorAll('[data-open],[data-nav]').forEach(button => button.addEventListener('click', () => showView(button.dataset.open || button.dataset.nav)));
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showView('home')));
window.addEventListener('popstate', () => showView(location.hash.slice(1), false));
window.addEventListener('hashchange', () => showView(location.hash.slice(1), false));

function bindTabs(selector, panelAttr, key) {
  document.querySelectorAll(selector).forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      button.parentElement.querySelectorAll('button').forEach(item => {
        item.classList.toggle('active', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      document.querySelectorAll(`[${panelAttr}]`).forEach(panel => panel.classList.toggle('active', panel.getAttribute(panelAttr) === button.dataset[key]));
    });
  });
}
bindTabs('[data-route-tab]', 'data-route-panel', 'routeTab');
bindTabs('[data-transport-tab]', 'data-transport-panel', 'transportTab');

function setClockValue(id, value) {
  const el = document.getElementById(id);
  if (el.textContent === value) return;
  el.textContent = value;
  if (!reduceMotion.matches && currentView === 'ceremony') {
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
  }
}
function updateCountdown() {
  const now = Date.now();
  const diff = Math.max(0, weddingStart - now);
  const pad = value => String(value).padStart(2, '0');
  setClockValue('days', pad(Math.floor(diff / 86400000)));
  setClockValue('hours', pad(Math.floor(diff / 3600000) % 24));
  setClockValue('minutes', pad(Math.floor(diff / 60000) % 60));
  setClockValue('seconds', pad(Math.floor(diff / 1000) % 60));
  document.querySelector('.countdown').hidden = diff === 0;
  document.querySelector('.countdown-label').textContent = diff > 0 ? '距离仪式开始还有' : now < weddingEnd ? '仪式已开始' : '感谢你见证我们的幸福时刻';
  document.querySelector('.ceremony-sentence').textContent = diff > 0 ? '仪式将会在' : '婚礼仪式';
  document.querySelector('.ceremony-time small').textContent = diff > 0 ? '开始' : '';
}
setInterval(() => { if (!document.hidden && currentView === 'ceremony') updateCountdown(); }, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });

let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
document.querySelector('#copyAddress').addEventListener('click', async () => {
  const address = '上海市浦东新区申迪西路1009号 上海迪士尼乐园酒店';
  try {
    await navigator.clipboard.writeText(address);
    toast('酒店地址已复制');
  } catch {
    const fallback = document.querySelector('#copyFallback');
    fallback.hidden = false;
    const input = fallback.querySelector('input');
    input.value = address;
    input.focus();
    input.select();
    input.setSelectionRange(0, address.length);
    toast('请长按已选中的地址复制');
  }
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const imageScroll = document.querySelector('.lightbox-scroll');
const closeButton = document.querySelector('.lightbox-close');
const zoomButton = document.querySelector('#imageZoom');
let imageTrigger;
let bodyOverflow = '';
function openImage(trigger) {
  imageTrigger = trigger;
  lightboxImage.alt = trigger.dataset.zoom.includes('resort-map') ? '上海迪士尼度假区完整地图' : '婚礼交通完整参考图';
  lightboxImage.src = trigger.dataset.zoom;
  lightboxImage.hidden = false;
  document.querySelector('.image-error').hidden = true;
  lightbox.classList.remove('zoomed');
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  zoomButton.textContent = '放大';
  zoomButton.setAttribute('aria-pressed', 'false');
  imageScroll.scrollTo(0, 0);
  bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.querySelector('.app').inert = true;
  bottomBar.inert = true;
  closeButton.focus();
}
function closeImage() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = bodyOverflow;
  document.querySelector('.app').inert = false;
  bottomBar.inert = false;
  if (imageTrigger) imageTrigger.focus({preventScroll:true});
}
zoomButton.addEventListener('click', () => {
  const zoomed = lightbox.classList.toggle('zoomed');
  zoomButton.textContent = zoomed ? '适应屏幕' : '放大';
  zoomButton.setAttribute('aria-pressed', String(zoomed));
});
lightboxImage.addEventListener('error', () => {
  lightboxImage.hidden = true;
  document.querySelector('.image-error').hidden = false;
});
document.querySelectorAll('[data-zoom]').forEach(el => {
  el.addEventListener('click', () => openImage(el));
  if (el.tagName !== 'BUTTON') el.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();openImage(el);}
  });
});
closeButton.addEventListener('click', closeImage);
lightbox.addEventListener('click', event => { if (event.target === imageScroll) closeImage(); });
document.addEventListener('keydown', event => {
  if (!lightbox.classList.contains('open')) return;
  if (event.key === 'Escape') closeImage();
  if (event.key === 'Tab') {
    const controls = [zoomButton, closeButton, imageScroll];
    const index = controls.indexOf(document.activeElement);
    const next = (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    event.preventDefault();
    controls[next].focus();
  }
});
showView(location.hash.slice(1), false);
