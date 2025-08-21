/* =================================================================================
   SCRIPT.JS — Gallery engine
   - 100 fotoğraf + 30 video
   - placeholder kutular (dosya yoksa arkaplanla aynı görünür; hover'da "Yakında")
   - otomatik video poster üretimi (ilk kareden canvas -> dataURL)
   - masonry-like grid: CSS grid-auto-rows + JS grid-row-end hesaplama
   - lightbox (hash routing #/media/:index), ESC, ←/→, swipe, aria
   - filtre & arama
   ================================================================================= */

/* ---------------------- Helpers ---------------------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const raf = (fn) => requestAnimationFrame(fn);
const idle = (fn) => ('requestIdleCallback' in window) ? requestIdleCallback(fn) : setTimeout(fn, 1);

function humanDuration(seconds){
  if(!isFinite(seconds)) return '';
  const m = Math.floor(seconds/60);
  const s = Math.round(seconds%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

/* ---------------------- Manifest ---------------------- */
// Bilinen ölçüler (kullanıcı verdi)
const knownDims = {
  f1:  { w:2418, h:2870 },
  f2:  { w:2235, h:2586 },
  f3:  { w:1777, h:2808 },
  f4:  { w:2078, h:20232 } // olağanüstü uzun örnek
  // f5..f100 bilinmiyor -> natural ölçü yüklendiğinde okunacak
};

// Build media array: 100 photos, 30 videos
const PHOTOS = 100;
const VIDEOS = 30;

const media = [];

// push photos
for(let i=1;i<=PHOTOS;i++){
  const id = `f${i}`;
  const dim = knownDims[id] || null;
  media.push({
    type: 'image',
    id,
    src: `images/${id}.jpg`,
    w: dim?.w,
    h: dim?.h,
    tags: [id,'photo']
  });
}

// push videos
for(let i=1;i<=VIDEOS;i++){
  const id = `v${i}`;
  media.push({
    type: 'video',
    id,
    src: `videos/${id}.mp4`,
    // poster: none; will be auto-generated
    duration: undefined,
    tags: [id,'video']
  });
}

/* ---------------------- DOM refs ---------------------- */
const gridEl = $('#grid');
const filterBtns = $$('.chip');
const searchInput = $('#searchInput');

const lightbox = $('#lightbox');
const lbStage = $('#lbStage');
const lbLoader = $('#lbLoader');
const lbClose = $('#lbClose');
const lbPrev = $('#lbPrev');
const lbNext = $('#lbNext');
const lbTitle = $('.lb-title');
const lbMeta = $('#lbMeta');

const btnTheme = $('#btnTheme');
const btnAbout = $('#btnAbout');
const aboutDialog = $('#aboutDialog');
const aboutClose = $('#aboutClose');
const aboutOk = $('#aboutOk');

let currentFilter = 'all';
let currentQuery = '';
let currentIndex = -1;

/* ---------------------- Create card ---------------------- */
function createCard(item, index){
  const a = document.createElement('a');
  a.className = 'card';
  a.setAttribute('role','listitem');
  a.setAttribute('aria-label', `${item.type === 'image'? 'Fotoğraf':'Video'} ${item.id}`);
  a.href = `#/media/${index}`;
  a.dataset.index = String(index);
  a.dataset.type = item.type;

  // media slot
  const mediaEl = document.createElement('img');
  mediaEl.className = 'card__media';
  mediaEl.alt = item.id;
  mediaEl.decoding = 'async';
  mediaEl.loading = 'lazy';

  // If image
  if(item.type === 'image'){
    mediaEl.src = item.src;
    if(item.w && item.h){
      mediaEl.width = item.w;
      mediaEl.height = item.h;
      a.dataset.w = String(item.w);
      a.dataset.h = String(item.h);
    }
    a.appendChild(mediaEl);
  } else {
    // video placeholder img (we will replace src with dataURL when IO triggers)
    mediaEl.src = transparentSVG();
    a.appendChild(mediaEl);

    // badge (Video / duration)
    const badge = document.createElement('div');
    badge.className = 'card__badge';
    badge.innerHTML = `<span class="dot"></span><span class="badge-text">Video</span>`;
    a.appendChild(badge);
  }

  // Click: set hash to open
  a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `#/media/${index}`;
  });

  // image error -> placeholder behavior
  mediaEl.addEventListener('error', () => {
    // file not found: convert to placeholder
    a.classList.add('placeholder');
    a.dataset.placeholder = (item.type === 'image') ? '📷 Yakında' : '🎬 Yakında';
    // remove media src to avoid broken icon
    mediaEl.remove();
    // set a min height so grid looks stable; compute row span after
    a.style.minHeight = '120px';
    computeRowSpan(a);
  }, { once:true });

  // when image loads -> compute row span (for masonry)
  mediaEl.addEventListener('load', () => computeRowSpan(a), { once:true });

  return a;
}

/* Transparent svg tiny */
function transparentSVG(){
  return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2272%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23000%22%22 %3E%3C/rect%3E%3C/svg%3E';
}

/* ---------------------- Render grid & masonry spans ---------------------- */
function renderGrid(list){
  gridEl.setAttribute('aria-busy','true');
  gridEl.innerHTML = '';
  const frag = document.createDocumentFragment();

  list.forEach((item, idx) => {
    const card = createCard(item, idx);
    frag.appendChild(card);
  });

  gridEl.appendChild(frag);
  gridEl.setAttribute('aria-busy','false');

  // compute spans after layout
  idle(() => {
    const cards = $$('.card', gridEl);
    cards.forEach(c => computeRowSpan(c));
  });

  // Setup video thumbnail IO and metadata
  setupVideoThumbnails(list);
}

/* grid-row span hesaplama */
function computeRowSpan(card){
  const img = card.querySelector('.card__media');
  if(!img) return;
  const style = getComputedStyle(gridEl);
  const rowH = parseFloat(style.getPropertyValue('grid-auto-rows')) || 6;
  const gap = parseFloat(style.getPropertyValue('gap')) || 12;

  function setSpan(){
    const height = img.getBoundingClientRect().height;
    const span = Math.ceil((height + gap) / (rowH + gap));
    card.style.gridRowEnd = `span ${span}`;
  }

  if(img.complete && img.naturalHeight !== 0){
    setSpan();
  } else {
    img.addEventListener('load', setSpan, { once:true });
    img.addEventListener('error', () => {
      // ensure minimal span
      card.style.gridRowEnd = `span ${Math.ceil(180 / rowH)}`;
    }, { once:true });
  }
}

/* ---------------------- Video thumbnail / poster generation (IO) ---------------------- */
function setupVideoThumbnails(list){
  const videoCards = $$('.card[data-type="video"]', gridEl);
  if(videoCards.length === 0) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const card = entry.target;
      const idx = Number(card.dataset.index);
      const item = list[idx];
      const img = card.querySelector('img.card__media');
      const badgeText = card.querySelector('.card__badge .badge-text');

      // create off-DOM video
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.src = item.src;

      // When metadata loaded -> duration
      v.addEventListener('loadedmetadata', () => {
        item.duration = v.duration;
        if(badgeText) badgeText.textContent = `Video • ${humanDuration(v.duration)}`;
      }, { once:true });

      // When data available -> capture frame
      v.addEventListener('loadeddata', async () => {
        try{
          // seek a tiny bit to avoid black frames
          v.currentTime = Math.min(0.15, (v.duration || 1) * 0.05);
          await new Promise(res => v.addEventListener('seeked', res, { once:true }));

          const canvas = document.createElement('canvas');
          canvas.width = v.videoWidth || 640;
          canvas.height = v.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          // draw with cover-like behavior: scale to fit
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg', 0.7);

          // set image src to dataURL
          if(img) {
            img.src = dataURL;
            img.alt = item.id + ' (video poster)';
            computeRowSpan(card);
          }
        }catch(e){
          // ignore
        }finally{
          obs.unobserve(card);
        }
      }, { once:true });

      // trigger load
      v.load();
    });
  }, { rootMargin: '200px 0px' });

  videoCards.forEach(c => io.observe(c));
}

/* ---------------------- Filter & Search ---------------------- */
function applyFilters(){
  const q = currentQuery.trim().toLowerCase();
  const filtered = media.filter(m => {
    if(currentFilter !== 'all' && m.type !== currentFilter) return false;
    if(!q) return true;
    return m.id.toLowerCase().includes(q) || (m.tags || []).some(t => t.toLowerCase().includes(q));
  });
  renderGrid(filtered);
}

/* filter buttons */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true');
    currentFilter = btn.dataset.filter;
    applyFilters();
  });
});

/* search */
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value;
    applyFilters();
  }, 180);
});

/* ---------------------- Lightbox (open/close/nav/hash) ---------------------- */
function openLightbox(index, pushHash=true){
  index = clamp(index, 0, media.length-1);
  currentIndex = index;

  // show loader
  lbStage.innerHTML = '';
  lbStage.appendChild(lbLoader);
  lightbox.classList.remove('is-hidden');
  lightbox.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow = 'hidden';

  const item = media[index];

  if(item.type === 'image'){
    const img = new Image();
    img.className = 'fade-in';
    img.alt = item.id;
    img.decoding = 'async';
    img.src = item.src;
    img.addEventListener('load', () => {
      lbStage.replaceChildren(img);
      lbTitle.textContent = `Fotoğraf • ${item.id}`;
      lbMeta.textContent = item.w && item.h ? `${item.w}×${item.h}` : '';
    }, { once:true });
    img.addEventListener('error', () => {
      lbStage.textContent = 'Görüntü yüklenemedi.';
      lbTitle.textContent = 'Yükleme hatası';
    }, { once:true });
  } else {
    const v = document.createElement('video');
    v.controls = true;
    v.autoplay = false; // kullanıcı etkileşimi ile oynatılır (mobil politikalar)
    v.playsInline = true;
    v.preload = 'metadata';
    v.src = item.src;
    v.addEventListener('loadedmetadata', () => {
      lbStage.replaceChildren(v);
      lbTitle.textContent = `Video • ${item.id}`;
      lbMeta.textContent = item.duration ? humanDuration(item.duration) : '';
    }, { once:true });
    v.addEventListener('error', () => {
      lbStage.textContent = 'Video yüklenemedi.';
      lbTitle.textContent = 'Yükleme hatası';
    }, { once:true });
  }

  if(pushHash){
    location.hash = `#/media/${index}`;
  }
}

function closeLightbox(popHash=true){
  const v = lbStage.querySelector('video');
  if(v) try{ v.pause(); } catch(e){}
  lightbox.classList.add('is-hidden');
  lightbox.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow = '';
  lbStage.innerHTML = '';
  lbMeta.textContent = '';
  if(popHash){
    if(location.hash.startsWith('#/media/')){
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }
}
function prevItem(){ if(currentIndex>=0) openLightbox((currentIndex-1+media.length)%media.length); }
function nextItem(){ if(currentIndex>=0) openLightbox((currentIndex+1)%media.length); }

/* lightbox buttons */
lbClose.addEventListener('click', () => closeLightbox());
lbPrev.addEventListener('click', prevItem);
lbNext.addEventListener('click', nextItem);

/* keyboard */
document.addEventListener('keydown', (e) => {
  if(lightbox.classList.contains('is-hidden')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowLeft') prevItem();
  if(e.key === 'ArrowRight') nextItem();
}, { passive:true });

/* swipe */
let touchStartX=0, touchStartY=0, touchLock=false;
lightbox.addEventListener('touchstart',(e)=>{ const t=e.changedTouches[0]; touchStartX=t.clientX; touchStartY=t.clientY; touchLock=false; }, { passive:true });
lightbox.addEventListener('touchmove',(e)=>{ const t=e.changedTouches[0]; const dx=t.clientX-touchStartX; const dy=t.clientY-touchStartY; if(!touchLock) touchLock = Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>8; }, { passive:true });
lightbox.addEventListener('touchend',(e)=>{ if(!touchLock) return; const t=e.changedTouches[0]; const dx=t.clientX-touchStartX; if(dx>50) prevItem(); else if(dx<-50) nextItem(); }, { passive:true });

/* Hash routing */
function handleHash(){
  const h = location.hash || '';
  if(h.startsWith('#/media/')){
    const idxStr = h.replace('#/media/','').trim();
    const idx = Number(idxStr);
    if(Number.isInteger(idx) && idx>=0 && idx<media.length){ openLightbox(idx, false); return; }
  }
  // otherwise, close if open
  if(!lightbox.classList.contains('is-hidden')) closeLightbox(false);
}
window.addEventListener('hashchange', handleHash);

/* ---------------------- Theme ---------------------- */
function applyTheme(saved){
  const light = saved === 'light';
  document.body.classList.toggle('theme-light', light);
  document.body.classList.toggle('theme-dark', !light);
  btnTheme.textContent = light ? '☀️' : '🌙';
  localStorage.setItem('gallery-theme', light ? 'light' : 'dark');
}
btnTheme.addEventListener('click', () => {
  const nowLight = !document.body.classList.contains('theme-light');
  applyTheme(nowLight ? 'light' : 'dark');
});

/* ---------------------- About dialog ---------------------- */
btnAbout.addEventListener('click', ()=> { aboutDialog.classList.remove('is-hidden'); aboutDialog.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden'; });
aboutClose.addEventListener('click', ()=> { aboutDialog.classList.add('is-hidden'); aboutDialog.setAttribute('aria-hidden','true'); document.documentElement.style.overflow=''; });
aboutOk.addEventListener('click', ()=> { aboutClose.click(); });
aboutDialog.addEventListener('click', (e)=> { if(e.target === aboutDialog) aboutClose.click(); });

/* ---------------------- Boot / Init ---------------------- */
function boot(){
  // theme from storage
  const theme = localStorage.getItem('gallery-theme') || 'dark';
  applyTheme(theme === 'light' ? 'light' : 'dark');

  // initial render (all)
  currentFilter = 'all';
  currentQuery = '';
  applyFilters();

  // on resize -> recompute spans
  let rid = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rid);
    rid = raf(()=> $$('.card', gridEl).forEach(c => computeRowSpan(c)));
  }, { passive:true });

  // handle hash at load
  handleHash();
}

/* set initial filter buttons attribute data-filter for script usage */
filterBtns.forEach(b => {
  if(!b.dataset.filter) {
    // ensure dataset.filter exists (chip elements had it in HTML)
  }
});

/* kick off when DOM loaded */
document.addEventListener('DOMContentLoaded', boot);
