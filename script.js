document.addEventListener("DOMContentLoaded", () => {
    // DOM Elementleri
    const loader = document.getElementById("loader");
    const loginScreen = document.getElementById("loginScreen");
    const galleryScreen = document.getElementById("galleryScreen");
    const passwordInput = document.getElementById("passwordInput");
    const loginBtn = document.getElementById("loginBtn");
    const errorMessage = document.getElementById("errorMessage");
    const grid = document.getElementById("grid");
    const lightbox = document.getElementById("lightbox");
    const lbContent = document.getElementById("lbContent");
    const lbCaption = document.getElementById("lbCaption");
    const lbClose = document.getElementById("lbClose");
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");
    const lbFullscreen = document.getElementById("lbFullscreen");
    const themeBtn = document.getElementById("btnTheme");
    const searchInput = document.getElementById("searchInput");
    const resultCount = document.getElementById("resultCount");
    const chips = document.querySelectorAll(".chip");
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    const correctPassword = "halil<3berra"; // Şifreniz
    let allItems = [];
    let currentItems = [];
    let currentIndex = 0;

    // --- VERİ OLUŞTURMA ---
    function generateData() {
        const photos = Array.from({ length: 60 }, (_, i) => ({
            type: "photo",
            src: `images/f${i + 1}.jpg`,
            title: `f${i + 1}.jpg`
        }));
        const videos = Array.from({ length: 25 }, (_, i) => ({
            type: "video",
            src: `videos/v${i + 1}.mp4`,
            poster: `videos/posters/v${i + 1}.jpg`,
            title: `v${i + 1}.mp4`
        }));
        allItems = [...photos, ...videos].sort(() => Math.random() - 0.5); // Karışık sırala
        currentItems = allItems;
    }

    // --- GİRİŞ İŞLEMLERİ ---
    function handleLogin() {
        if (passwordInput.value === correctPassword) {
            loginScreen.classList.remove("active-screen");
            galleryScreen.classList.add("active-screen");
            loader.classList.add('is-active');
            setTimeout(() => {
                generateData();
                renderGrid(allItems);
                loader.classList.remove('is-active');
            }, 500);
        } else {
            errorMessage.textContent = "Hatalı şifre! Lütfen tekrar deneyin.";
            errorMessage.classList.add("show");
            passwordInput.classList.add("shake");
            setTimeout(() => {
                passwordInput.classList.remove("shake");
                errorMessage.classList.remove("show");
            }, 500);
        }
    }

    // --- GRID OLUŞTURMA VE YÖNETİMİ ---
    function renderGrid(items) {
        grid.innerHTML = "";
        if (items.length === 0) {
            resultCount.textContent = "Sonuç bulunamadı.";
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "card";
            card.dataset.index = items.indexOf(item); // Orijinal dizideki indeksi kullan

            let mediaElement;
            if (item.type === "photo") {
                mediaElement = document.createElement("img");
                mediaElement.src = item.src;
                mediaElement.alt = item.title;
                mediaElement.loading = "lazy";
            } else if (item.type === "video") {
                mediaElement = document.createElement("video");
                mediaElement.src = item.src;
                mediaElement.poster = item.poster;
                mediaElement.muted = true;
                mediaElement.loop = true;
                mediaElement.playsInline = true;
                
                const playIcon = document.createElement('div');
                playIcon.className = 'play-icon';
                playIcon.innerHTML = '▶';
                card.appendChild(playIcon);

                card.addEventListener('mouseenter', () => mediaElement.play());
                card.addEventListener('mouseleave', () => mediaElement.pause());
            }

            card.appendChild(mediaElement);
            grid.appendChild(card);
            
            // Dinamik grid için yükseklik ayarı
            if (item.type === 'photo') {
                mediaElement.onload = () => resizeGridItem(card);
            } else {
                 mediaElement.onloadedmetadata = () => resizeGridItem(card);
            }
        });

        resultCount.textContent = `${items.length} sonuç bulundu`;
        currentItems = items;
    }

    function resizeGridItem(item) {
        const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));
        const media = item.querySelector('img') || item.querySelector('video');
        const contentHeight = media.getBoundingClientRect().height;
        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = "span " + rowSpan;
    }

    // --- LIGHTBOX İŞLEMLERİ ---
    function showLightbox(index) {
        const item = currentItems[index];
        lbContent.innerHTML = "";
        lbCaption.textContent = item.title;

        if (item.type === "photo") {
            const img = document.createElement("img");
            img.src = item.src;
            lbContent.appendChild(img);
        } else if (item.type === "video") {
            const vid = document.createElement("video");
            vid.src = item.src;
            vid.controls = true;
            vid.autoplay = true;
            lbContent.appendChild(vid);
        }
        lightbox.classList.add("is-active");
        currentIndex = index;
    }

    function closeLightbox() {
        lightbox.classList.remove("is-active");
        // Videoyu durdur
        const video = lbContent.querySelector('video');
        if (video) video.pause();
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
        showLightbox(currentIndex);
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % currentItems.length;
        showLightbox(currentIndex);
    }
    
    // --- FİLTRELEME VE ARAMA ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.chip.is-active').dataset.filter;

        let filteredItems = allItems;

        if (activeFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.type === activeFilter);
        }
        
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => item.title.toLowerCase().includes(searchTerm));
        }

        renderGrid(filteredItems);
    }

    // --- TEMA YÖNETİMİ ---
    function toggleTheme() {
        document.body.classList.toggle("theme-light");
        if (document.body.classList.contains("theme-light")) {
            themeBtn.textContent = "☀️";
        } else {
            themeBtn.textContent = "🌙";
        }
    }

    // --- EVENT LISTENERS ---
    loginBtn.addEventListener("click", handleLogin);
    passwordInput.addEventListener("keypress", (e) => e.key === "Enter" && handleLogin());

    grid.addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (card) {
            const index = currentItems.findIndex(item => item.title === (card.querySelector('img, video').alt || card.querySelector('video').poster.split('/').pop().replace('.jpg', '.mp4')));
             showLightbox(parseInt(card.dataset.index, 10));
        }
    });

    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", showPrev);
    lbNext.addEventListener("click", showNext);
    lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-active")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showPrev();
        if (e.key === "ArrowRight") showNext();
    });

    lbFullscreen.addEventListener("click", () => {
        const content = lbContent.firstElementChild;
        if (content && content.requestFullscreen) {
            content.requestFullscreen();
        }
    });

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("is-active"));
            chip.classList.add("is-active");
            applyFilters();
        });
    });

    searchInput.addEventListener("input", applyFilters);
    themeBtn.addEventListener("click", toggleTheme);

    scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener("scroll", () => {
        scrollTopBtn.classList.toggle("show", window.scrollY > 300);
    });

    window.addEventListener('resize', () => renderGrid(currentItems));
});
