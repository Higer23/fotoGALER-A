// Şifre Kontrolü
const correctPassword = 'halil<3berra';
const passwordBox = document.getElementById('passwordBox');
const contentBox = document.getElementById('content');
const passwordInput = document.getElementById('passwordInput');
const errorBox = document.getElementById('error');

// Medya Verisi (Fotoğraf ve Video) - Bu verileri daha sonra sunucudan dinamik alabiliriz
const media = [];
for (let i = 1; i <= 10; i++) {
  media.push({
    type: 'image',
    id: `f${i}`,
    src: `images/f${i}.webp`,  // WebP formatı önerildi
    lowRes: `images/f${i}_low.webp`,  // Düşük çözünürlüklü görsel
    tags: [`f${i}`, 'photo']
  });
}
for (let i = 1; i <= 5; i++) {
  media.push({
    type: 'video',
    id: `v${i}`,
    src: `videos/v${i}.mp4`,
    tags: [`v${i}`, 'video']
  });
}

// İçeriği Yükle
let mediaIndex = 0;
const itemsPerLoad = 4;  // Bir seferde yüklenecek medya öğesi sayısı

// Medya öğesini sayfaya ekleme fonksiyonu
function loadMedia() {
  const grid = document.getElementById('grid');
  
  for (let i = 0; i < itemsPerLoad; i++) {
    if (mediaIndex >= media.length) break; // Medya bittiğinde dur
    const mediaItem = media[mediaIndex];
    mediaIndex++;
    
    const card = document.createElement('div');
    card.classList.add('card');
    
    if (mediaItem.type === 'image') {
      const img = document.createElement('img');
      img.src = mediaItem.lowRes;
      img.dataset.src = mediaItem.src;
      img.alt = `Fotoğraf ${mediaItem.id}`;
      img.classList.add('lazyload');
      card.appendChild(img);
    } else if (mediaItem.type === 'video') {
      const video = document.createElement('video');
      video.src = mediaItem.src;
      video.controls = true;
      video.alt = `Video ${mediaItem.id}`;
      card.appendChild(video);
    }
    
    // "Öne Çıkan" etiketi
    if (mediaItem.id === 'f1') { // Bu sadece örnek, öne çıkanları belirlemek için mantık eklenebilir
      card.classList.add('featured');
    }

    // Medya kartına tıklanabilirlik
    card.addEventListener('click', () => openLightbox(mediaItem));

    grid.appendChild(card);
  }
}

// Şifre kontrol fonksiyonu
function checkPassword() {
  const enteredPassword = passwordInput.value.trim();
  if (enteredPassword === correctPassword) {
    passwordBox.style.display = 'none';
    contentBox.style.display = 'block';
    loadMedia(); // Sayfa yüklenince ilk 4 medya öğesini yükle
  } else {
    errorBox.textContent = 'Hatalı şifre, lütfen tekrar deneyin.';
  }
}

// Lightbox (Medya Görüntüleme Alanı)
let currentMediaIndex = 0;
const lightbox = document.getElementById('lightbox');
const lbStage = document.getElementById('lbStage');
const lbLoader = document.getElementById('lbLoader');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

// Lightbox'a medya ekleyin
function openLightbox(mediaItem) {
  lbLoader.style.display = 'block';
  lbStage.innerHTML = ''; // Önceki içeriği temizle

  setTimeout(() => {
    lbLoader.style.display = 'none';

    let mediaElement;
    if (mediaItem.type === 'image') {
      mediaElement = document.createElement('img');
      mediaElement.src = mediaItem.src;
      mediaElement.alt = `Fotoğraf ${mediaItem.id}`;
    } else if (mediaItem.type === 'video') {
      mediaElement = document.createElement('video');
      mediaElement.src = mediaItem.src;
      mediaElement.controls = true;
      mediaElement.alt = `Video ${mediaItem.id}`;
    }

    lbStage.appendChild(mediaElement);
    lbMeta.innerHTML = `<h3>${mediaItem.id}</h3>`;
  }, 1000);

  currentMediaIndex = media.findIndex(item => item.id === mediaItem.id);
  lightbox.classList.remove('is-hidden');
}

// Lightbox'ı kapatma
lbClose.addEventListener('click', () => lightbox.classList.add('is-hidden'));

// Lightbox'ta sonraki ve önceki medyaya geçiş
lbPrev.addEventListener('click', () => {
  currentMediaIndex = (currentMediaIndex - 1 + media.length) % media.length;
  openLightbox(media[currentMediaIndex]);
});
lbNext.addEventListener('click', () => {
  currentMediaIndex = (currentMediaIndex + 1) % media.length;
  openLightbox(media[currentMediaIndex]);
});

// Temayı değiştirme fonksiyonu
const btnTheme = document.getElementById('btnTheme');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('theme-light');
});

// Sonsuz kaydırma fonksiyonu
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 200) {
    loadMedia();
  }
});

// "Daha Fazla Yükle" butonu (Gelecek için daha kullanıcı dostu bir seçenek)
const loadMoreBtn = document.getElementById('loadMoreBtn');
loadMoreBtn.addEventListener('click', loadMedia);

// Lazy loading
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('.lazyload');
  if ('IntersectionObserver' in window) {
    let lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazyload');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(lazyImage => {
      lazyImageObserver.observe(lazyImage);
    });
  }
});
