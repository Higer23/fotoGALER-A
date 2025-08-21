// Giriş şifre kontrolü
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginScreen = document.getElementById("loginScreen");
const gallery = document.getElementById("gallery");
const errorMessage = document.getElementById("error");

const correctPassword = "halil<3berra"; // Şifreyi buraya yaz

loginBtn.addEventListener("click", function () {
  const password = passwordInput.value;
  if (password === correctPassword) {
    loginScreen.classList.add("hidden");
    gallery.classList.remove("hidden");
  } else {
    errorMessage.style.display = "block";
  }
});

// Lightbox (tam ekran görüntüleme)
const lightbox = document.getElementById("lightbox");
const lbClose = document.getElementById("lbClose");
const lbImage = document.getElementById("lbImage");
const lbVideo = document.getElementById("lbVideo");

const images = [
  "images/f1.jpg", "images/f2.jpg", "images/f3.jpg", "images/f4.jpg", "images/f5.jpg", 
  "images/f6.jpg", "images/f7.jpg", "images/f8.jpg", "images/f9.jpg", "images/f10.jpg", 
  "images/f11.jpg", "images/f12.jpg", "images/f13.jpg", "images/f14.jpg", "images/f15.jpg", 
  "images/f16.jpg", "images/f17.jpg", "images/f18.jpg", "images/f19.jpg", "images/f20.jpg", 
  "images/f21.jpg", "images/f22.jpg", "images/f23.jpg", "images/f24.jpg", "images/f25.jpg", 
  "images/f26.jpg", "images/f27.jpg", "images/f28.jpg", "images/f29.jpg", "images/f30.jpg", 
  "images/f31.jpg", "images/f32.jpg", "images/f33.jpg", "images/f34.jpg", "images/f35.jpg", 
  "images/f36.jpg", "images/f37.jpg", "images/f38.jpg", "images/f39.jpg", "images/f40.jpg", 
  "images/f41.jpg", "images/f42.jpg", "images/f43.jpg", "images/f44.jpg", "images/f45.jpg", 
  "images/f46.jpg", "images/f47.jpg", "images/f48.jpg", "images/f49.jpg", "images/f50.jpg", 
  "images/f51.jpg", "images/f52.jpg", "images/f53.jpg", "images/f54.jpg", "images/f55.jpg", 
  "images/f56.jpg", "images/f57.jpg", "images/f58.jpg", "images/f59.jpg", "images/f60.jpg", 
  "images/f61.jpg", "images/f62.jpg", "images/f63.jpg", "images/f64.jpg", "images/f65.jpg", 
  "images/f66.jpg", "images/f67.jpg", "images/f68.jpg", "images/f69.jpg", "images/f70.jpg", 
  "images/f71.jpg", "images/f72.jpg", "images/f73.jpg", "images/f74.jpg", "images/f75.jpg", 
  "images/f76.jpg", "images/f77.jpg", "images/f78.jpg", "images/f79.jpg", "images/f80.jpg", 
  "images/f81.jpg", "images/f82.jpg", "images/f83.jpg", "images/f84.jpg", "images/f85.jpg", 
  "images/f86.jpg", "images/f87.jpg", "images/f88.jpg", "images/f89.jpg", "images/f90.jpg", 
  "images/f91.jpg", "images/f92.jpg", "images/f93.jpg", "images/f94.jpg", "images/f95.jpg", 
  "images/f96.jpg", "images/f97.jpg", "images/f98.jpg", "images/f99.jpg", "images/f100.jpg"
];

const videos = [
  "videos/v1.mp4", "videos/v2.mp4", "videos/v3.mp4", "videos/v4.mp4", "videos/v5.mp4", 
  "videos/v6.mp4", "videos/v7.mp4", "videos/v8.mp4", "videos/v9.mp4", "videos/v10.mp4", 
  "videos/v11.mp4", "videos/v12.mp4", "videos/v13.mp4", "videos/v14.mp4", "videos/v15.mp4", 
  "videos/v16.mp4", "videos/v17.mp4", "videos/v18.mp4", "videos/v19.mp4", "videos/v20.mp4", 
  "videos/v21.mp4", "videos/v22.mp4", "videos/v23.mp4", "videos/v24.mp4", "videos/v25.mp4", 
  "videos/v26.mp4", "videos/v27.mp4", "videos/v28.mp4", "videos/v29.mp4", "videos/v30.mp4", 
  "videos/v31.mp4", "videos/v32.mp4", "videos/v33.mp4", "videos/v34.mp4", "videos/v35.mp4", 
  "videos/v36.mp4", "videos/v37.mp4", "videos/v38.mp4", "videos/v39.mp4", "videos/v40.mp4", 
  "videos/v41.mp4", "videos/v42.mp4", "videos/v43.mp4", "videos/v44.mp4", "videos/v45.mp4", 
  "videos/v46.mp4", "videos/v47.mp4", "videos/v48.mp4", "videos/v49.mp4", "videos/v50.mp4"
];

function openLightbox(index) {
  if (index < images.length) {
    lbImage.src = images[index];
    lbImage.style.display = "block";
    lbVideo.style.display = "none";
  } else {
    const videoIndex = index - images.length;
    lbVideo.src = videos[videoIndex];
    lbImage.style.display = "none";
    lbVideo.style.display = "block";
  }

  lightbox.classList.remove("hidden");
}

lbClose.addEventListener("click", () => {
  lightbox.classList.add("hidden");
  lbImage.style.display = "none";
  lbVideo.style.display = "none";
});
