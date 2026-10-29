const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));document.getElementById('year').textContent=new Date().getFullYear();
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
