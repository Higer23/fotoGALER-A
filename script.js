const $=(s,d=document)=>d.querySelector(s);
const $$=(s,d=document)=>Array.from(d.querySelectorAll(s));
const PHOTOS=100,VIDEOS=30;
const media=[];
for(let i=1;i<=PHOTOS;i++){media.push({type:'image',id:`f${i}`,src:`images/f${i}.jpg`,tags:[`f${i}`,'photo']});}
for(let i=1;i<=VIDEOS;i++){media.push({type:'video',id:`v${i}`,src:`videos/v${i}.mp4`,tags:[`v${i}`,'video']});}

const gridEl=$('#grid');
const filterBtns=$$('.chip');
const searchInput=$('#searchInput');
const lightbox=$('#lightbox');
const lbStage=$('#lbStage');const lbLoader=$('#lbLoader');
const lbClose=$('#lbClose');const lbPrev=$('#lbPrev');const lbNext=$('#lbNext');
const lbTitle=$('.lb-title');const lbMeta=$('#lbMeta');
const btnTheme=$('#btnTheme');
let currentFilter='all',currentQuery='',currentIndex=-1;

function createCard(item,index){
  const a=document.createElement('a');a.className='card';a.href=`#/media/${index}`;a.dataset.index=index;a.dataset.type=item.type;
  const mediaEl=document.createElement('img');mediaEl.className='card__media';mediaEl.alt=item.id;mediaEl.decoding='async';mediaEl.loading='lazy';
  if(item.type==='image'){mediaEl.src=item.src;a.appendChild(mediaEl);}
  else{mediaEl.src=transparentSVG();a.appendChild(mediaEl);}
  a.addEventListener('click',e=>{e.preventDefault();location.hash=`#/media/${index}`;});
  mediaEl.addEventListener('error',()=>{a.classList.add('placeholder');a.dataset.placeholder=item.type==='image'?'📷 Yakında':'🎬 Yakında';mediaEl.remove();a.style.minHeight='120px';computeRowSpan(a);},{once:true});
  mediaEl.addEventListener('load',()=>computeRowSpan(a),{once:true});
  return a;
}

function transparentSVG(){return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2272%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23000%22/%3E%3C/svg%3E';}

function renderGrid(list){gridEl.setAttribute('aria-busy','true');gridEl.innerHTML='';const frag=document.createDocumentFragment();
list.forEach((item,idx)=>frag.appendChild(createCard(item,idx)));gridEl.appendChild(frag);gridEl.setAttribute('aria-busy','false');idle(()=>$$('.card',gridEl).forEach(c=>computeRowSpan(c)));setupVideoThumbnails(list);}
function computeRowSpan(card){const img=card.querySelector('.card__media');if(!img)return;const style=getComputedStyle(gridEl);const rowH=parseFloat(style.getPropertyValue('grid-auto-rows'))||6;const gap=parseFloat(style.getPropertyValue('gap'))||12;
function setSpan(){const height=img.getBoundingClientRect().height;const span=Math.ceil((height+gap)/(rowH+gap));card.style.gridRowEnd=`span ${span}`;}
if(img.complete&&img.naturalHeight!==0)setSpan();else{img.addEventListener('load',setSpan,{once:true});img.addEventListener('error',()=>{card.style.gridRowEnd=`span ${Math.ceil(180/rowH)}`},{once:true});}}

function setupVideoThumbnails(list){const videoCards=$$('.card[data-type="video"]',gridEl);if(videoCards.length===0)return;
const io=new IntersectionObserver((entries,obs)=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const card=entry.target;const idx=Number(card.dataset.index);const item=list[idx];const img=card.querySelector('img.card__media');const v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;v.src=item.src;v.addEventListener('loadeddata',async()=>{try{v.currentTime=Math.min(0.15,(v.duration||1)*0.05);await new Promise(r=>v.addEventListener('seeked',r,{once:true}));const c=document.createElement('canvas');c.width=v.videoWidth||640;c.height=v.videoHeight||360;c.getContext('2d').drawImage(v,0,0,c.width,c.height);const dataURL=c.toDataURL('image/jpeg',0.7);if(img){img.src=dataURL;computeRowSpan(card);}}catch(e){}finally{obs.unobserve(card);}}, {once:true});v.load();});},{rootMargin:'200px 0px'});videoCards.forEach(c=>io.observe(c));}

function applyFilters(){const q=currentQuery.trim().toLowerCase();const filtered=media.filter(m=>{if(currentFilter!=='all'&&m.type!==currentFilter)return false;if(!q)return true;return m.id.toLowerCase().includes(q)||(m.tags||[]).some(t=>t.toLowerCase().includes(q));});renderGrid(filtered);}
filterBtns.forEach(btn=>btn.addEventListener('click',()=>{filterBtns.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});btn.classList.add('is-active');btn.setAttribute('aria-pressed','true');currentFilter=btn.dataset.filter;applyFilters();}));
let searchTimer=null;searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentQuery=searchInput.value;applyFilters();},180);});

function openLightbox(index,pushHash=true){index=Math.max(0,Math.min(media.length-1,index));currentIndex=index;lbStage.innerHTML='';lbStage.appendChild(lbLoader);lightbox.classList.remove('is-hidden');document.documentElement.style.overflow='hidden';const item=media[index];if(item.type==='image'){const img=new Image();img.className='fade-in';img.alt=item.id;img.decoding='async';img.src=item.src;img.addEventListener('load',()=>{lbStage.replaceChildren(img);lbTitle.textContent=`Fotoğraf • ${item.id}`;lbMeta.textContent='';},{once:true});img.addEventListener('error',()=>{lbStage.textContent='Görüntü yüklenemedi';lbTitle.textContent='Hata';},{once:true});}else{const v=document.createElement('video');v.controls=true;v.autoplay=false;v.playsInline=true;v.preload='metadata';v.src=item.src;v.addEventListener('loadedmetadata',()=>{lbStage.replaceChildren(v);lbTitle.textContent=`Video • ${item.id}`;lbMeta.textContent='';},{once:true});v.addEventListener('error',()=>{lbStage.textContent='Video yüklenemedi';lbTitle.textContent='Hata';},{once:true});}
if(pushHash)location.hash=`#/media/${index}`;}
function closeLightbox(popHash=true){const v=lbStage.querySelector('video');if(v)try{v.pause();}catch(e){}lightbox.classList.add('is-hidden');document.documentElement.style.overflow='';lbStage.innerHTML='';lbMeta.textContent='';if(popHash&&location.hash.startsWith('#/media/'))history.pushState('',document.title,window.location.pathname+window.location.search);}
function prevItem(){if(currentIndex>=0)openLightbox((currentIndex-1+media.length)%media.length);}
function nextItem(){if(currentIndex>=0)openLightbox((currentIndex+1)%media.length);}
lbClose.addEventListener('click',()=>closeLightbox());lbPrev.addEventListener('click',prevItem);lbNext.addEventListener('click',nextItem);
document.addEventListener('keydown',e=>{if(lightbox.classList.contains('is-hidden'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')prevItem();if(e.key==='ArrowRight')nextItem();},{passive:true});
let touchStartX=0,touchLock=false;lightbox.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;touchLock=false;},{passive:true});
lightbox.addEventListener('touchmove',e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(!touchLock)touchLock=Math.abs(dx)>8;},{passive:true});
lightbox.addEventListener('touchend',e=>{if(!touchLock)return;const dx=e.changedTouches[0].clientX-touchStartX;if(dx>50)prevItem();else if(dx<-50)nextItem();},{passive:true});
function handleHash(){const h=location.hash||'';if(h.startsWith('#/media/')){const idx=Number(h.replace('#/media/','').trim());if(Number.isInteger(idx)&&idx>=0&&idx<media.length){openLightbox(idx,false);return;}}if(!lightbox.classList.contains('is-hidden'))closeLightbox(false);}
window.addEventListener('hashchange',handleHash);

function applyTheme(saved){const light=saved==='light';document.body.classList.toggle('theme-light',light);document.body.classList.toggle('theme-dark',!light);btnTheme.textContent=light?'☀️':'🌙';localStorage.setItem('gallery-theme',light?'light':'dark');}
btnTheme.addEventListener('click',()=>{applyTheme(!document.body.classList.contains('theme-light')?'light':'dark');});

function boot(){const theme=localStorage.getItem('gallery-theme')||'dark';applyTheme(theme==='light'?'light':'dark');currentFilter='all';currentQuery='';applyFilters();let rid=0;window.addEventListener('resize',()=>{cancelAnimationFrame(rid);rid=requestAnimationFrame(()=>$$('.card',gridEl).forEach(c=>computeRowSpan(c)));},{passive:true});handleHash();}
document.addEventListener('DOMContentLoaded',boot);

function idle(fn){('requestIdleCallback'in window)?requestIdleCallback(fn):setTimeout(fn,1);}
function humanDuration(sec){if(!isFinite(sec))return'';const m=Math.floor(sec/60);const s=Math.round(sec%60);return `${m}:${String(s).padStart(2,'0')}`;}
