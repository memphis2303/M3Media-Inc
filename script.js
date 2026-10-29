const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
// Original photography supplied by M3 Media Inc. Images are optimized WebP copies.
const slides = [
  {src:'assets/slide-02.webp',alt:'M3 Media photography — featured image 1'},
  {src:'assets/slide-09.webp',alt:'M3 Media photography — red vintage truck fashion portrait'},
  {src:'assets/slide-10.webp',alt:'M3 Media photography — featured image 3'}
];
let slide=0;
let timer;
let transitioning=false;
const hero=document.querySelector('.hero');
const current=document.getElementById('heroImage');
const incoming=document.getElementById('heroImageNext');
const progress=document.getElementById('slideProgress');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
slides.forEach((s,i)=>{
  const b=document.createElement('button');
  b.setAttribute('aria-label',`Go to slide ${i+1} of ${slides.length}`);
  b.addEventListener('click',()=>setSlide(i));
  progress.appendChild(b);
});
function updateIndicators(){
  [...progress.children].forEach((b,j)=>{
    b.classList.toggle('active',j===slide);
    b.setAttribute('aria-current',String(j===slide));
  });
}
function restartTimer(){
  clearInterval(timer);
  if(!reduceMotion && !document.hidden) timer=setInterval(()=>setSlide(slide+1),6000);
}
function setSlide(i){
  const target=(i+slides.length)%slides.length;
  if(target===slide || transitioning)return;
  transitioning=true;
  const img=new Image();
  img.onload=()=>{
    incoming.style.backgroundImage=`url("${slides[target].src}")`;
    incoming.classList.add('show');
    const complete=()=>{
      current.style.backgroundImage=`url("${slides[target].src}")`;
      current.setAttribute('aria-label',slides[target].alt);
      incoming.classList.remove('show');
      slide=target;
      updateIndicators();
      transitioning=false;
      restartTimer();
    };
    if(reduceMotion){complete();return;}
    setTimeout(complete,850);
  };
  img.onerror=()=>{transitioning=false;restartTimer();};
  img.src=slides[target].src;
}
current.style.backgroundImage=`url("${slides[0].src}")`;
current.setAttribute('aria-label',slides[0].alt);
updateIndicators();
document.getElementById('prevSlide').addEventListener('click',()=>setSlide(slide-1));
document.getElementById('nextSlide').addEventListener('click',()=>setSlide(slide+1));
hero.addEventListener('mouseenter',()=>clearInterval(timer));
hero.addEventListener('mouseleave',restartTimer);
hero.addEventListener('focusin',()=>clearInterval(timer));
hero.addEventListener('focusout',e=>{if(!hero.contains(e.relatedTarget))restartTimer();});
document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(timer):restartTimer());
hero.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();setSlide(slide-1);}
  if(e.key==='ArrowRight'){e.preventDefault();setSlide(slide+1);}
});
restartTimer();
document.getElementById('year').textContent=new Date().getFullYear();


// Portfolio lightbox with keyboard navigation and focus return
const portfolioPhotos = Array.from(document.querySelectorAll('.portfolio-open img'));
const lightbox = document.getElementById('portfolioLightbox');
const lightboxImg = document.getElementById('lightboxImage');
const lightboxCounter = document.getElementById('lightboxCounter');
let activePortfolioIndex=0, portfolioTrigger=null;
function showPortfolio(index){
  activePortfolioIndex=(index+portfolioPhotos.length)%portfolioPhotos.length;
  const photo=portfolioPhotos[activePortfolioIndex];
  lightboxImg.src=photo.src;
  lightboxImg.alt=photo.alt;
  lightboxCounter.textContent=`${activePortfolioIndex+1} / ${portfolioPhotos.length}`;
}
function closePortfolio(){
  lightbox.hidden=true;
  document.body.classList.remove('lightbox-active');
  if(portfolioTrigger)portfolioTrigger.focus();
}
document.querySelectorAll('.portfolio-open').forEach((button,index)=>{
  button.addEventListener('click',()=>{
    portfolioTrigger=button;
    showPortfolio(index);
    lightbox.hidden=false;
    document.body.classList.add('lightbox-active');
    lightbox.querySelector('.lightbox-close').focus();
  });
});
lightbox.querySelector('.lightbox-close').addEventListener('click',closePortfolio);
lightbox.querySelector('.lightbox-prev').addEventListener('click',()=>showPortfolio(activePortfolioIndex-1));
lightbox.querySelector('.lightbox-next').addEventListener('click',()=>showPortfolio(activePortfolioIndex+1));
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closePortfolio();});
document.addEventListener('keydown',e=>{
  if(lightbox.hidden)return;
  if(e.key==='Escape')closePortfolio();
  if(e.key==='ArrowLeft')showPortfolio(activePortfolioIndex-1);
  if(e.key==='ArrowRight')showPortfolio(activePortfolioIndex+1);
});
