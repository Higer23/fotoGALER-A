document.addEventListener("DOMContentLoaded",()=>{
  const grid=document.getElementById("grid");
  const lightbox=document.getElementById("lightbox");
  const lbContent=document.getElementById("lbContent");
  const lbClose=document.getElementById("lbClose");
  const lbPrev=document.getElementById("lbPrev");
  const lbNext=document.getElementById("lbNext");
  const themeBtn=document.getElementById("btnTheme");
  const searchInput=document.getElementById("searchInput");
  const chips=document.querySelectorAll(".chip");

  const photos=[
    {type:"photo",src:"images/f1.jpg",title:"f1"},
    {type:"photo",src:"images/f2.jpg",title:"f2"},
    {type:"photo",src:"images/f3.jpg",title:"f3"},
    {type:"photo",src:"images/f4.jpg",title:"f4"},
    {type:"photo",src:"images/f5.jpg",title:"f5"},
    {type:"photo",src:"images/f6.jpg",title:"f6"},
    {type:"photo",src:"images/f7.jpg",title:"f7"},
    {type:"photo",src:"images/f8.jpg",title:"f8"},
    {type:"photo",src:"images/f9.jpg",title:"f9"},
    {type:"photo",src:"images/f10.jpg",title:"f10"},
    {type:"photo",src:"images/f11.jpg",title:"f11"},
    {type:"photo",src:"images/f12.jpg",title:"f12"},
    {type:"photo",src:"images/f13.jpg",title:"f13"},
    {type:"photo",src:"images/f14.jpg",title:"f14"},
    {type:"photo",src:"images/f15.jpg",title:"f15"},
    {type:"photo",src:"images/f16.jpg",title:"f16"},
    {type:"photo",src:"images/f17.jpg",title:"f17"},
    {type:"photo",src:"images/f18.jpg",title:"f18"},
    {type:"photo",src:"images/f19.jpg",title:"f19"},
    {type:"photo",src:"images/f20.jpg",title:"f20"},
    {type:"photo",src:"images/f21.jpg",title:"f21"},
    {type:"photo",src:"images/f22.jpg",title:"f22"}
  ];

  const videos=[
    {type:"video",src:"videos/v1.mp4",title:"v1"},
    {type:"video",src:"videos/v2.mp4",title:"v2"},
    {type:"video",src:"videos/v3.mp4",title:"v3"},
    {type:"video",src:"videos/v4.mp4",title:"v4"},
    {type:"video",src:"videos/v5.mp4",title:"v5"}
  ];

  // placeholderlar (toplam 50 foto + 30 video)
  const placeholders=[];
  for(let i=23;i<=50;i++) placeholders.push({type:"photo",title:"f"+i,placeholder:true});
  for(let i=6;i<=30;i++) placeholders.push({type:"video",title:"v"+i,placeholder:true});

  let allItems=[...photos,...videos,...placeholders];
  let currentIndex=0;

  function renderGrid(items){
    grid.innerHTML="";
    items.forEach((item,index)=>{
      const div=document.createElement("div");
      div.className="card";
      div.dataset.index=index;
      if(item.placeholder){
        div.classList.add("placeholder");
        div.dataset.placeholder=item.type==="photo"?"📷 Yakında":"🎬 Yakında";
      } else if(item.type==="photo"){
        const img=document.createElement("img");
        img.dataset.src=item.src;
        img.alt=item.title;
        img.loading="lazy";
        div.appendChild(img);
      } else if(item.type==="video"){
        const vid=document.createElement("video");
        vid.dataset.src=item.src;
        vid.poster=`videos/posters/${item.title}.jpg`;
        vid.muted=true;
        vid.playsInline=true;
        div.appendChild(vid);
      }
      grid.appendChild(div);
    });
    lazyLoad();
  }

  function lazyLoad(){
    const els=[...grid.querySelectorAll("img[data-src]"),...grid.querySelectorAll("video[data-src]")];
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const el=entry.target;
          el.src=el.dataset.src;
          el.removeAttribute("data-src");
          observer.unobserve(el);
        }
      });
    },{rootMargin:"200px"});
    els.forEach(el=>observer.observe(el));
  }

  grid.addEventListener("click",(e)=>{
    const card=e.target.closest(".card");
    if(!card || card.classList.contains("placeholder")) return;
    currentIndex=+card.dataset.index;
    showLightbox(currentIndex);
  });

  function showLightbox(index){
    lbContent.innerHTML="";
    const item=allItems[index];
    if(item.type==="photo"){
      const img=document.createElement("img");
      img.src=item.src;
      lbContent.appendChild(img);
    } else if(item.type==="video"){
      const vid=document.createElement("video");
      vid.src=item.src;
      vid.controls=true;
      vid.autoplay=true;
      lbContent.appendChild(vid);
    }
    lightbox.classList.remove("is-hidden");
  }

  lbClose.addEventListener("click",()=>lightbox.classList.add("is-hidden"));
  lbPrev.addEventListener("click",()=>{
    currentIndex=(currentIndex-1+allItems.length)%allItems.length;
    showLightbox(currentIndex);
  });
  lbNext.addEventListener("click",()=>{
    currentIndex=(currentIndex+1)%allItems.length;
    showLightbox(currentIndex);
  });
  document.addEventListener("keydown",e=>{
    if(lightbox.classList.contains("is-hidden")) return;
    if(e.key==="Escape") lightbox.classList.add("is-hidden");
    if(e.key==="ArrowLeft") lbPrev.click();
    if(e.key==="ArrowRight") lbNext.click();
  });

  // Filter
  chips.forEach(chip=>{
    chip.addEventListener("click",()=>{
      chips.forEach(c=>c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const filter=chip.dataset.filter;
      const filtered=filter==="all"?allItems:allItems.filter(i=>i.type===filter);
      renderGrid(filtered);
    });
  });

  // Search
  searchInput.addEventListener("input",()=>{
    const term=searchInput.value.toLowerCase();
    const filtered=allItems.filter(i=>i.title.toLowerCase().includes(term));
    renderGrid(filtered);
  });

  // Theme toggle
  themeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("theme-dark");
    document.body.classList.toggle("theme-light");
  });

  renderGrid(allItems);

  // Yeni foto ekleme fonksiyonu
  window.addPhoto=(photoObj)=>{
    // placeholder kaldır
    allItems=allItems.map(i=>{
      if(i.placeholder && i.title===photoObj.title) return photoObj;
      return i;
    });
    renderGrid(allItems);
  };
});
