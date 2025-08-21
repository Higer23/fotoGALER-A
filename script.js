/* =========================================================================================
   SCRIPT.JS — Profesyonel Galeri Motoru
   =========================================================================================
   Ana özellikler:
   • Manifest tabanlı medya tanımı (foto + video), bilinen ölçüler → width/height + aspect-ratio
   • Masonry benzeri grid: CSS grid-auto-rows + dinamik grid-row-end (satır-span) hesaplama
   • Lazy loading: <img loading="lazy"> + IntersectionObserver ile video kapak/thumbnail üretimi
   • Video poster’ı harici dosya gerektirmez: ilk frameden <canvas> ile otomatik oluşturulur
   • Fullscreen lightbox: ESC, ←/→, butonlar; hash routing → #/media/:index  (geri tuşu çalışır)
   • Swipe navigasyonu: mobilde sağa/sola
   • Filtre (Hepsi/Foto/Video) + arama (id/etiket/ad)
   • Erişilebilirlik (ARIA), odak yönetimi, klavye kısayolları
   • Tema geçişi (dark/light) — body.classList toggle, localStorage ile kalıcılık
   • Performans: requestIdleCallback, RAF kuyrukları, hızlı DOM güncellemeleri, CLS azaltımı
   -----------------------------------------------------------------------------------------
   GitHub Pages üzerinde bağımlılıksız çalışır.
========================================================================================= */

/* -----------------------------------------
   0) Yardımcılar (tiny utils)
----------------------------------------- */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const raf = (fn) => window.requestAnimationFrame(fn);
const idle = (fn) => ('requestIdleCallback' in window) ? requestIdleCallback(fn) : setTimeout(fn, 1);

function humanDuration(seconds){
  // Basit süre biçimleyici (mm:ss)
  if(isNaN(seconds) || !isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

/* -----------------------------------------
   1) Medya Manifesti
   - type: 'image' | 'video'
   - src: yol
   - id: kısa ad (örn. f1, v3)
   - w, h: biliniyorsa (CLS azaltımı için width/height img attribute olarak verilir)
   - tags: arama/filtre için etiketler
----------------------------------------- */
const IMAGES_COUNT = 22;
const VIDEOS_COUNT = 5;

// Verdiğin kesin ölçüler:
const knownDims = {
  f1:  { w: 2418, h: 2870 },
  f2:  { w: 2235, h: 2586 },
  f3:  { w: 1777, h: 2808 },
  f4:  { w: 2078, h: 20232 }, // çok uzun (panorama/scroll shot gibi)
  // f5..f22 bilinmiyor → doğal boyuttan okunacak
};

// Foto manifest
const photos = Array.from({length: IMAGES_COUNT}, (_,i) => {
  const id = `f${i+1}`;
  const dim = knownDims[id] || null;
  return {
    type: 'image',
    id,
    src: `images/${id}.jpg`,
    w: dim?.w || undefined,
    h: dim?.h || undefined,
    tags: [id, 'photo', 'image', 'gallery'] // basit etiketler
  };
});

// Video manifest
const videos = Array.from({length: VIDEOS_COUNT}, (_,i) => {
  const id = `v${i+1}`;
  return {
    type: 'video',
    id,
    src: `videos/${id}.mp4`,
    // Poster harici yok — IO ile ilk frameden üretilecek
    duration: undefined, // metadata okununca dolacak (grid rozeti için)
    tags: [id, 'video', 'movie', 'clip']
  };
});

// Birleştirilmiş akış (listeyi istersen karıştırabilirsin)
const media = [...photos, ...videos];

/* -----------------------------------------
   2) DOM Referansları
----------------------------------------- */
const gridEl     = $('#grid');
const filterBtns = $$('.chip');
const searchEl   = $('#searchInput');

const lightbox   = $('#lightbox');
const lbStage    = $('#lbStage');
const lbLoader   = $('#lbLoader');
const lbPrev     = $('#lbPrev');
const lbNext     = $('#lbNext');
const lbClose    = $('#lbClose');
const lbMeta     = $('#lbMeta');

const btnTheme   = $('#btnTheme');

const aboutDlg   = $('#aboutDialog');
const aboutOpen  = $('#btnAbout');
const aboutClose = $('#aboutClose');
const aboutOk    = $('#aboutOk');

let currentIndex = -1;
let currentFilter = 'all';
let currentQuery = '';

/* -----------------------------------------
   3) Grid Kart Üretimi
----------------------------------------- */
function createCard(item, idx){
  // Kart (link gibi davranır, erişilebilirlik için role ve label)
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `#/media/${idx}`; // hash routing
  a.role = 'listitem';
  a.setAttribute('aria-label', (item.type === 'image' ? 'Fotoğraf ' : 'Video ') + item.id);
  a.dataset.index = String(idx);
  a.dataset.type  = item.type;

  // Medya görseli/öniçerik
  if(item.type === 'image'){
    const img = document.createElement('img');
    img.className = 'card__media';
    img.alt = item.id;
    img.decoding = 'async';
    img.loading  = 'lazy';
    img.src = item.src;

    // CLS azaltımı için width/height ya da CSS aspect-ratio
    if(item.w && item.h){
      img.width  = item.w;
      img.height = item.h;
      // ayrıca CSS grid span hesabına yardımcı olmak için dataset’e yaz
      a.dataset.w = String(item.w);
      a.dataset.h = String(item.h);
    }

    a.appendChild(img);
  } else {
    // Video kartında görüntülemek için bir IMG tutucu oluşturup,
    // IntersectionObserver’da poster dataURL üretip buna set edeceğiz.
    const img = document.createElement('img');
    img.className = 'card__media';
    img.alt = item.id + ' (Video)';
    img.decoding = 'async';
    img.loading  = 'lazy';
    // geçici koyu arka plan; poster hazır olduğunda src atanır
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="12"%3E%3Crect width="100%25" height="100%25" fill="%23000"/%3E%3C/svg%3E';
    a.appendChild(img);

    // Sağ altta "play" rozeti + süre etiketi (metadata sonrası)
    const badge = document.createElement('div');
    badge.className = 'card__badge';
    badge.textContent = 'Video';
    a.appendChild(badge);
  }

  // Etkinlik (tıklama → hash set; lightbox router yakalayacak)
  a.addEventListener('click', (ev) => {
    ev.preventDefault();
    // hash’e git → router openLightbox’ı çağırır
    location.hash = `#/media/${idx}`;
  });

  return a;
}

/* -----------------------------------------
   4) Grid Render + Masonry Satır-Span Hesabı
----------------------------------------- */
function renderGrid(list){
  gridEl.setAttribute('aria-busy', 'true');
  gridEl.innerHTML = '';
  const frag = document.createDocumentFragment();

  list.forEach((item, idx) => {
    const card = createCard(item, idx);
    frag.appendChild(card);
  });

  gridEl.appendChild(frag);
  gridEl.setAttribute('aria-busy', 'false');

  // Masonry row-span → görseller yüklendikçe hesapla
  idle(() => {
    const cards = $$('.card', gridEl);
    cards.forEach(card => computeRowSpan(card));
  });

  // Video thumbnail/poster üretimi ve duration okuma
  setupVideoThumbnails(list);
}

/* Row span hesapla: elementin render yüksekliğine göre grid-row-end: span N */
function computeRowSpan(card){
  // Eğer width/height biliniyorsa hızlıdır; yoksa doğal boyutu img yüklenince alınır.
  const img = card.querySelector('.card__media');
  if(!img) return;

  const row = parseFloat(getComputedStyle(gridEl).getPropertyValue('grid-auto-rows'));
  const gap = parseFloat(getComputedStyle(gridEl).getPropertyValue('gap')) || 0;

  function setSpan(){
    // Kartın iç yüksekliği:
    const contentHeight = img.getBoundingClientRect().height;
    const total = contentHeight + gap; // alt boşluğu hesaba kat
    const span = Math.ceil(total / (row + gap));
    card.style.gridRowEnd = `span ${span}`;
  }

  if(img.complete){
    setSpan();
  } else {
    img.addEventListener('load', setSpan, { once:true });
    img.addEventListener('error', () => {
      // hata olursa tahmini bir yükseklik ver (stabil görünüm)
      card.style.gridRowEnd = `span ${Math.ceil(240 / row)}`;
    }, { once:true });
  }
}

/* -----------------------------------------
   5) Lazy Video Thumbnail (Poster) Üretimi
   - Harici poster dosyası gerektirmez.
   - IO ile kart görünürken video'dan 0.2s civarı frame alıp canvas’a çiz
   - Süre (duration) metadata’dan okunur → rozet içine eklenir.
----------------------------------------- */
function setupVideoThumbnails(list){
  const cards = $$('.card[data-type="video"]', gridEl);
  if(cards.length === 0) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(async entry => {
      if(!entry.isIntersecting) return;
      const card = entry.target;
      const idx  = Number(card.dataset.index);
      const item = list[idx];
      const img  = card.querySelector('img.card__media');
      const badge = card.querySelector('.card__badge');

      // Video nesnesi oluştur (off-DOM)
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.src = item.src;

      // Metadata yüklendiğinde süre
      v.addEventListener('loadedmetadata', () => {
        item.duration = v.duration;
      });

      // Frame yakala
      v.addEventListener('loadeddata', async () => {
        try{
          // birkaç yüz ms ileri sar ki siyah kare gelmesin
          v.currentTime = Math.min(0.2, (v.duration || 1) * 0.05);
          await new Promise(res => v.addEventListener('seeked', res, { once:true }));

          // Canvas’a çiz
          const canvas = document.createElement('canvas');
          canvas.width  = v.videoWidth || 640;
          canvas.height = v.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg', 0.7);

          // IMG’ye ata
          img.src = dataURL;

          // Rozete süre yaz
          if(item.duration){
            const dur = humanDuration(item.duration);
            badge.textContent = `Video • ${dur}`;
          }

          // Masonry span güncelle
          computeRowSpan(card);
        }catch(err){
          // Bir şey olursa yine de span hesapla
          computeRowSpan(card);
        }finally{
          obs.unobserve(card);
        }
      }, { once:true });

      // Yükleme başlat
      v.load();
    });
  }, { rootMargin: '200px 0px' });

  cards.forEach(c => io.observe(c));
}

/* -----------------------------------------
   6) Filtre & Arama
----------------------------------------- */
function applyFilters(){
  const q = currentQuery.trim().toLowerCase();
  const list = media.filter((m) => {
    const typeOk = currentFilter === 'all' || m.type === currentFilter;
    if(!typeOk) return false;
    if(q === '') return true;
    // Basit arama: id veya tag eşleşmesi
    return m.id.toLowerCase().includes(q) || (m.tags || []).some(t => t.toLowerCase().includes(q));
  });
  renderGrid(list);
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true');
    currentFilter = btn.dataset.filter;
    applyFilters();
  });
});

searchEl.addEventListener('input', () => {
  currentQuery = searchEl.value;
  // Debounce basit (RAF)
  raf(applyFilters);
});

/* -----------------------------------------
   7) Lightbox — Aç/Kapat/Geçiş
----------------------------------------- */
function openLightbox(index, pushHash=true){
  currentIndex = clamp(index, 0, media.length-1);

  // İçerik yüklenmeden önce loader
  lbStage.innerHTML = '';
  lbStage.appendChild(lbLoader);
  lightbox.classList.remove('is-hidden');
  lightbox.setAttribute('aria-hidden', 'false');

  // Scroll kilidi (basit)
  document.documentElement.style.overflow = 'hidden';

  // İçeriği yükle
  const item = media[currentIndex];
  if(item.type === 'image'){
    const img = new Image();
    img.className = 'fade-in';
    img.alt = item.id;
    img.decoding = 'async';
    img.src = item.src;
    img.addEventListener('load', () => {
      lbStage.replaceChildren(img);
      lbMeta.textContent = `Fotoğraf • ${item.id} • ${item.w && item.h ? `${item.w}×${item.h}` : 'boyut okunuyor'}`;
    }, { once:true });
    img.addEventListener('error', () => {
      lbStage.textContent = 'Görüntü yüklenemedi.';
      lbMeta.textContent = '';
    }, { once:true });
  } else {
    // Video — kontroller açık, autoplay disabled (kullanıcı eylemi beklenir)
    const v = document.createElement('video');
    v.className = 'fade-in';
    v.controls = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.src = item.src;

    v.addEventListener('loadedmetadata', () => {
      lbStage.replaceChildren(v);
      const dur = humanDuration(v.duration);
      lbMeta.textContent = `Video • ${item.id}${dur ? ' • ' + dur : ''}`;
    }, { once:true });

    v.addEventListener('error', () => {
      lbStage.textContent = 'Video yüklenemedi.';
      lbMeta.textContent = '';
    }, { once:true });
  }

  // Hash yönlendirme (geri tuşu desteği)
  if(pushHash){
    location.hash = `#/media/${currentIndex}`;
  }
}

function closeLightbox(popHash=true){
  // Video varsa durdur
  const v = lbStage.querySelector('video');
  if(v){ try{ v.pause(); }catch{} }

  lightbox.classList.add('is-hidden');
  lightbox.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  lbStage.innerHTML = '';

  if(popHash){
    // Hash'i temizle
    if(location.hash.startsWith('#/media/')){
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }
}

function prevItem(){
  if(currentIndex < 0) return;
  const next = (currentIndex - 1 + media.length) % media.length;
  openLightbox(next);
}
function nextItem(){
  if(currentIndex < 0) return;
  const next = (currentIndex + 1) % media.length;
  openLightbox(next);
}

/* -----------------------------------------
   8) Lightbox Events (Butonlar + Klavye + Swipe)
----------------------------------------- */
lbClose.addEventListener('click', () => closeLightbox());
lbPrev .addEventListener('click', prevItem);
lbNext .addEventListener('click', nextItem);

document.addEventListener('keydown', (e) => {
  // Lightbox açık değilse çık
  if(lightbox.classList.contains('is-hidden')) return;

  switch(e.key){
    case 'Escape': closeLightbox(); break;
    case 'ArrowLeft': prevItem(); break;
    case 'ArrowRight': nextItem(); break;
  }
}, { passive:true });

// Swipe (mobil)
let touchStartX = 0, touchStartY = 0, touchLock = false;
lightbox.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0]; touchStartX = t.clientX; touchStartY = t.clientY; touchLock = false;
}, { passive:true });

lightbox.addEventListener('touchmove', (e) => {
  const t = e.changedTouches[0]; const dx = t.clientX - touchStartX; const dy = t.clientY - touchStartY;
  if(!touchLock){ touchLock = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8; }
}, { passive:true });

lightbox.addEventListener('touchend', (e) => {
  if(!touchLock) return;
  const t = e.changedTouches[0]; const dx = t.clientX - touchStartX;
  if(dx > 40) prevItem(); else if(dx < -40) nextItem();
}, { passive:true });

/* -----------------------------------------
   9) Hash Router (#/media/:index)
----------------------------------------- */
function handleHash(){
  const h = location.hash || '';
  if(h.startsWith('#/media/')){
    const idxStr = h.replace('#/media/','').trim();
    const idx = Number(idxStr);
    if(Number.isInteger(idx) && idx >= 0 && idx < media.length){
      // Hash üzerinden geldiysek pushHash=false (tekrar pushlama)
      openLightbox(idx, false);
      return;
    }
  }
  // Hash yoksa ve lightbox açıksa kapat
  if(!lightbox.classList.contains('is-hidden')){
    closeLightbox(false);
  }
}
window.addEventListener('hashchange', handleHash);

/* -----------------------------------------
   10) Tema geçişi (dark/light) — kalıcı
----------------------------------------- */
function applyTheme(saved){
  const wantLight = saved === 'light';
  document.body.classList.toggle('theme-light', wantLight);
  document.body.classList.toggle('theme-dark', !wantLight);
  // Buton etiketini güncelle (erişilebilirlik)
  btnTheme.setAttribute('aria-pressed', String(!wantLight ? true : false));
  btnTheme.innerHTML = wantLight ? 'Aydınlık' : 'Karanlık';
}
btnTheme.addEventListener('click', () => {
  const nowLight = !document.body.classList.contains('theme-light') ? true : false;
  const mode = nowLight ? 'light' : 'dark';
  localStorage.setItem('gallery-theme', mode);
  applyTheme(mode);
});

/* -----------------------------------------
   11) Dialog (Hakkında)
----------------------------------------- */
function openDialog(){
  aboutDlg.classList.remove('is-hidden');
  aboutDlg.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow = 'hidden';
}
function closeDialog(){
  aboutDlg.classList.add('is-hidden');
  aboutDlg.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow = '';
}
aboutOpen.addEventListener('click', openDialog);
aboutClose.addEventListener('click', closeDialog);
aboutOk.addEventListener('click', closeDialog);
aboutDlg.addEventListener('click', (e) => { if(e.target === aboutDlg) closeDialog(); });

/* -----------------------------------------
   12) Başlatma — render + filtre default + tema + router
----------------------------------------- */
function boot(){
  // Tema
  const savedTheme = localStorage.getItem('gallery-theme') || 'dark';
  applyTheme(savedTheme);

  // Başlangıçta filtre "all"
  currentFilter = 'all';
  currentQuery = '';
  applyFilters(); // renderGrid içinde video poster IO set edilir

  // Hash router — doğrudan #/media/x ile gelindiyse aç
  handleHash();

  // Pencere yeniden boyutlanınca masonry span tekrar hesapla (debounce)
  let rid = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rid);
    rid = raf(() => {
      $$('.card', gridEl).forEach(card => computeRowSpan(card));
    });
  }, { passive:true });

  // Görseller yüklendikçe satır-span güncel tutulur
  // (createCard içinde img.load → computeRowSpan bağlandı)
}

document.addEventListener('DOMContentLoaded', boot);
