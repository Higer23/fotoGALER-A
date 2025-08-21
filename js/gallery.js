        document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid");
  const lightbox = document.getElementById("lightbox");
  const lbContent = document.getElementById("lbContent");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lbFullscreen = document.getElementById("lbFullscreen");
  const themeBtn = document.getElementById("btnTheme");
  const searchInput = document.getElementById("searchInput");
  const resultCount = document.getElementById("resultCount");
  const chips = document.querySelectorAll(".chip");
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  const photos = [
    { type: "photo", src: "images/f1.jpg", title: "f1" },
    { type: "photo", src: "images/f2.jpg", title: "f2" },
    { type: "photo", src: "images/f3.jpg", title: "f3" },
    { type: "photo", src: "images/f4.jpg", title: "f4" },
    { type: "photo", src: "images/f5.jpg", title: "f5" },
    { type: "photo", src: "images/f6.jpg", title: "f6" },
    { type: "photo", src: "images/f7.jpg", title: "f7" },
    { type: "photo", src: "images/f8.jpg", title: "f8" },
    { type: "photo", src: "images/f9.jpg", title: "f9" },
    { type: "photo", src: "images/f10.jpg", title: "f10" },
    { type: "photo", src: "images/f11.jpg", title: "f11" },
    { type: "photo", src: "images/f12.jpg", title: "f12" },
    { type: "photo", src: "images/f13.jpg", title: "f13" },
    { type: "photo", src: "images/f14.jpg", title: "f14" },
    { type: "photo", src: "images/f15.jpg", title: "f15" },
    { type: "photo", src: "images/f16.jpg", title: "f16" },
    { type: "photo", src: "images/f17.jpg", title: "f17" },
    { type: "photo", src: "images/f18.jpg", title: "f18" },
    { type: "photo", src: "images/f19.jpg", title: "f19" },
    { type: "photo", src: "images/f20.jpg", title: "f20" },
    { type: "photo", src: "images/f21.jpg", title: "f21" },
    { type: "photo", src: "images/f22.jpg", title: "f22" }
  ];

  const videos = [
    { type: "video", src: "videos/v1.mp4", title: "v1" },
    { type: "video", src: "videos/v2.mp4", title: "v2" },
    { type: "video", src: "videos/v3.mp4", title: "v3" },
    { type: "video", src: "videos/v4.mp4", title: "v4" },
    { type: "video", src: "videos/v5.mp4", title: "v5" }
  ];

  const placeholders = [];
  for (let i = 23; i <= 50; i++) placeholders.push({ type: "photo", title: "f" + i, placeholder: true });
  for (let i = 6; i <= 30; i++) placeholders.push({ type: "video", title: "v" + i, placeholder: true });

  let allItems = [...photos, ...videos, ...placeholders];
  let currentItems = [...allItems];
  let currentIndex = 0;

  function renderGrid(items) {
    grid.innerHTML = "";
    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "card";
      div.dataset.index = index;
      if (item.placeholder) {
        div.classList.add("placeholder");
        div.dataset.placeholder = item.type === "photo" ? "📷 Yakında" : "🎬 Yakında";
      } else if (item.type === "photo") {
        const img = document.createElement("img");
        img.dataset.src = item.src;
        img.alt = item.title;
        img.loading = "lazy";
        div.appendChild(img);
      } else if (item.type === "video") {
        const vid = document.createElement("video");
        vid.dataset.src = item.src;
        vid.poster = `videos/posters/${item.title}.jpg`;
        vid.muted = true;
        vid.playsInline = true;
        div.appendChild(vid);
      }
      grid.appendChild(div);
    });
    lazyLoad();

    if (resultCount) {
      if (items.length > 0) {
        resultCount.textContent = `${items.length} sonuç bulundu`;
      } else {
        resultCount.textContent = `Sonuç bulunamadı.`;
      }
    }
  }

  function lazyLoad() {
    const els = [...grid.querySelectorAll("img[data-src]"), ...grid.querySelectorAll("video[data-src]")];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.src = el.dataset.src;
          el.removeAttribute("data-src");
          observer.unobserve(el);
        }
      });
    }, { rootMargin: "200px" });
    els.forEach(el => observer.observe(el));
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card || card.classList.contains("placeholder")) return;
    currentIndex = +card.dataset.index;
    showLightbox(currentIndex);
  });

  function showLightbox(index) {
    lbContent.innerHTML = "";
    const item = currentItems[index];
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
    lightbox.classList.remove("is-hidden");
  }

  function handlePrevNext() {
    const navButtons = document.querySelectorAll(".lb-nav");
    if (navButtons.length > 0) {
      navButtons.forEach(btn => {
        btn.style.display = currentItems.length > 1 ? "flex" : "none";
      });
    }
  }

  lbClose.addEventListener("click", () => lightbox.classList.add("is-hidden"));
  lbPrev.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    showLightbox(currentIndex);
  });
  lbNext.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % currentItems.length;
    showLightbox(currentIndex);
  });
  document.addEventListener("keydown", e => {
    if (lightbox.classList.contains("is-hidden")) return;
    if (e.key === "Escape") lightbox.classList.add("is-hidden");
    if (e.key === "ArrowLeft") lbPrev.click();
    if (e.key === "ArrowRight") lbNext.click();
  });

  lbFullscreen.addEventListener("click", () => {
    const content = lbContent.firstElementChild;
    if (!content) return;
    if (content.requestFullscreen) {
      content.requestFullscreen();
    } else if (content.webkitRequestFullscreen) {
      content.webkitRequestFullscreen();
    } else if (content.msRequestFullscreen) {
      content.msRequestFullscreen();
    }
  });

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const filter = chip.dataset.filter;
      searchInput.value = "";
      const filtered = filter === "all" ? allItems : allItems.filter(i => i.type === filter);
      currentItems = filtered;
      renderGrid(filtered);
      handlePrevNext();
    });
  });

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const activeFilter = document.querySelector('.chip.is-active').dataset.filter;
    let filteredItems = activeFilter === 'all' ? allItems : allItems.filter(item => item.type === activeFilter);
    const searchedItems = filteredItems.filter(item => item.title.toLowerCase().includes(searchTerm));
    currentItems = searchedItems;
    renderGrid(currentItems);
    handlePrevNext();
  });

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("theme-dark");
    document.body.classList.toggle("theme-light");
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addPhoto = (photoObj) => {
    allItems = allItems.map(i => {
      if (i.placeholder && i.title === photoObj.title) return photoObj;
      return i;
    });
    currentItems = allItems;
    renderGrid(allItems);
  };
  
  renderGrid(allItems);
  handlePrevNext();
});
