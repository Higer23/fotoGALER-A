);
document.addEventListener("DOMContentLoaded", () => {
    // --- STATE MANAGEMENT ---
    const state = {
        allItems: [],
        currentItems: [],
        currentIndex: 0,
        touchStartX: 0,
        touchEndX: 0
    };

    // --- DOM SELECTORS ---
    const selectors = {
        galleryScreen: document.getElementById("galleryScreen"),
        grid: document.getElementById("grid"),
        lightbox: document.getElementById("lightbox"),
        lbContent: document.getElementById("lbContent"),
        lbCaption: document.getElementById("lbCaption"),
        lbClose: document.getElementById("lbClose"),
        lbPrev: document.getElementById("lbPrev"),
        lbNext: document.getElementById("lbNext"),
        lbFullscreen: document.getElementById("lbFullscreen"),
        lbDownload: document.getElementById("lbDownload"),
        themeBtn: document.getElementById("btnTheme"),
        searchInput: document.getElementById("searchInput"),
        resultCount: document.getElementById("resultCount"),
        chips: document.querySelectorAll(".chip"),
        scrollTopBtn: document.getElementById("scrollTopBtn"),
    };

    // --- UTILITY FUNCTIONS ---
    const debounce = (func, delay = 250) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // --- DATA GENERATION ---
    function generateData() {
        // Rastgele tarih oluşturma fonksiyonu (son 2 yıl içinde)
        const getRandomDate = () => {
            const end = new Date();
            const start = new Date(end.getFullYear() - 2, end.getMonth(), end.getDate());
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };
        
        const photos = Array.from({ length: 60 }, (_, i) => ({
            type: "photo",
            src: `images/f${i + 1}.jpg`,
            title: `f${i + 1}.jpg`,
            date: getRandomDate()
        }));
        const videos = Array.from({ length: 25 }, (_, i) => ({
            type: "video",
            src: `videos/v${i + 1}.mp4`,
            poster: `videos/posters/v${i + 1}.jpg`,
            title: `v${i + 1}.mp4`,
            date: getRandomDate()
        }));
        
        // En yeniden en eskiye sırala
        state.allItems = [...photos, ...videos].sort((a, b) => b.date - a.date);
        state.currentItems = state.allItems;
    }

    // --- GRID RENDERING ---
    function renderGrid(items) {
        selectors.grid.innerHTML = "";

        if (items.length === 0) {
            selectors.grid.innerHTML = `<div class="grid-empty">Bu kriterlere uygun sonuç bulunamadı.</div>`;
            selectors.resultCount.textContent = "0 sonuç";
            return;
        }

        // Tarihe göre grupla
        const groupedItems = items.reduce((acc, item) => {
            const month = item.date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(item);
            return acc;
        }, {});

        for (const month in groupedItems) {
            const header = document.createElement('div');
            header.className = 'grid-header';
            header.textContent = month.charAt(0).toUpperCase() + month.slice(1);
            selectors.grid.appendChild(header);

            groupedItems[month].forEach(item => {
                const card = document.createElement("div");
                card.className = "card";
                card.dataset.itemId = item.title;
                card.setAttribute('role', 'button');
                card.tabIndex = 0;

                let mediaElement;
                if (item.type === "photo") {
                    mediaElement = document.createElement("img");
                    mediaElement.src = item.src;
                    mediaElement.alt = item.title;
                    mediaElement.onload = () => resizeGridItem(card);
                } else {
                    mediaElement = document.createElement("video");
                    mediaElement.src = item.src;
                    mediaElement.poster = item.poster;
                    mediaElement.muted = true;
                    mediaElement.loop = true;
                    mediaElement.playsInline = true;
                    mediaElement.onloadedmetadata = () => resizeGridItem(card);

                    card.addEventListener('mouseenter', () => mediaElement.play());
                    card.addEventListener('mouseleave', () => mediaElement.pause());
                }
                card.appendChild(mediaElement);
                selectors.grid.appendChild(card);
            });
        }
        selectors.resultCount.textContent = `${items.length} sonuç bulundu`;
        state.currentItems = items;
    }

    function resizeGridItem(item) {
        const rowHeight = 10;
        const rowGap = 15;
        const media = item.querySelector('img, video');
        if (!media || !media.getBoundingClientRect().height) return;
        const contentHeight = media.getBoundingClientRect().height;
        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = `span ${rowSpan}`;
    }

    const recalculateGridSpans = () => {
        document.querySelectorAll('.card').forEach(resizeGridItem);
    };

    // --- LIGHTBOX ---
    function showLightbox(item) {
        if (!item) return;

        selectors.lbContent.classList.add('is-loading'); // Animasyon için
        
        setTimeout(() => {
            selectors.lbContent.innerHTML = "";
            selectors.lbCaption.textContent = item.title;
            selectors.lbDownload.href = item.src;

            if (item.type === "photo") {
                const img = document.createElement("img");
                img.src = item.src;
                selectors.lbContent.appendChild(img);
            } else {
                const vid = document.createElement("video");
                vid.src = item.src;
                vid.controls = true;
                vid.autoplay = true;
                selectors.lbContent.appendChild(vid);
            }
            
            selectors.lightbox.classList.add("is-active");
            window.location.hash = item.title;
            state.currentIndex = state.currentItems.findIndex(i => i.title === item.title);
            selectors.lbContent.classList.remove('is-loading');
        }, 100); // Geçiş animasyonu için küçük bir gecikme
    }

    function closeLightbox() {
        selectors.lightbox.classList.remove("is-active");
        const video = selectors.lbContent.querySelector('video');
        if (video) video.pause();
        // Adres çubuğunu temizle
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }

    const showPrev = () => showLightbox(state.currentItems[(state.currentIndex - 1 + state.currentItems.length) % state.currentItems.length]);
    const showNext = () => showLightbox(state.currentItems[(state.currentIndex + 1) % state.currentItems.length]);

    // --- FILTERS ---
    function applyFilters() {
        const searchTerm = selectors.searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.chip.is-active').dataset.filter;
        let filtered = state.allItems;

        if (activeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === activeFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(item => item.title.toLowerCase().includes(searchTerm));
        }
        renderGrid(filtered);
        recalculateGridSpans();
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        selectors.grid.addEventListener("click", e => {
            const card = e.target.closest(".card");
            if (card) showLightbox(state.currentItems.find(item => item.title === card.dataset.itemId));
        });
        
        selectors.grid.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const card = e.target.closest('.card');
                if (card) {
                    e.preventDefault();
                    showLightbox(state.currentItems.find(item => item.title === card.dataset.itemId));
                }
            }
        });

        selectors.lbClose.addEventListener("click", closeLightbox);
        selectors.lbPrev.addEventListener("click", showPrev);
        selectors.lbNext.addEventListener("click", showNext);
        selectors.lightbox.addEventListener('click', e => e.target === selectors.lightbox && closeLightbox());

        selectors.lbFullscreen.addEventListener("click", () => {
            const content = selectors.lbContent.firstElementChild;
            if (content?.requestFullscreen) content.requestFullscreen();
        });

        // Swipe Gestures
        selectors.lightbox.addEventListener('touchstart', e => state.touchStartX = e.changedTouches[0].screenX, { passive: true });
        selectors.lightbox.addEventListener('touchend', e => {
            state.touchEndX = e.changedTouches[0].screenX;
            const deltaX = state.touchEndX - state.touchStartX;
            if (Math.abs(deltaX) > 50) { // Eşik değeri
                deltaX < 0 ? showNext() : showPrev();
            }
        });

        document.addEventListener("keydown", e => {
            if (!selectors.lightbox.classList.contains("is-active")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "ArrowRight") showNext();
        });

        window.addEventListener('hashchange', () => {
            const itemId = window.location.hash.substring(1);
            if (itemId && !selectors.lightbox.classList.contains('is-active')) {
                 showLightbox(state.allItems.find(item => item.title === itemId));
            } else if (!itemId) {
                closeLightbox();
            }
        });

        selectors.chips.forEach(chip => chip.addEventListener("click", () => {
            selectors.chips.forEach(c => c.classList.remove("is-active"));
            chip.classList.add("is-active");
            applyFilters();
        }));

        selectors.searchInput.addEventListener("input", debounce(applyFilters, 300));

        selectors.themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("theme-light");
            selectors.themeBtn.textContent = document.body.classList.contains("theme-light") ? "☀️" : "🌙";
        });

        selectors.scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        window.addEventListener("scroll", () => selectors.scrollTopBtn.classList.toggle("show", window.scrollY > 300));
        window.addEventListener('resize', debounce(recalculateGridSpans, 200));
    }

    // --- INITIALIZATION ---
    function init() {
        generateData();
        renderGrid(state.allItems);
        setupEventListeners();

        // Check for a hash on initial load
        const initialItemId = window.location.hash.substring(1);
        if (initialItemId) {
            const itemToShow = state.allItems.find(item => item.title === initialItemId);
            if(itemToShow) {
                // DOM'un yüklenmesi için kısa bir gecikme
                setTimeout(() => showLightbox(itemToShow), 100);
            }
        }
    }

    init();
});
