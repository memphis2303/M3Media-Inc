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
    showPortfolio(Math.max(0,portfolioPhotos.indexOf(button.querySelector('img'))));
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

// Category cards filter the separate portfolio page; click again to show all.
const categoryCards=[...document.querySelectorAll('.editorial-categories a[data-category]')];
const galleryFigures=[...document.querySelectorAll('.portfolio-grid figure')];
let selectedCategory=null;
function filterPortfolio(category){
  selectedCategory=selectedCategory===category?null:category;
  categoryCards.forEach(a=>{
    const active=a.dataset.category===selectedCategory;
    a.classList.toggle('category-selected',active);
    a.setAttribute('aria-pressed',String(active));
  });
  galleryFigures.forEach(fig=>{fig.hidden=!!selectedCategory && fig.dataset.category!==selectedCategory;});
  // Lightbox navigation should follow only the visible photographs.
  portfolioPhotos.splice(0,portfolioPhotos.length,...document.querySelectorAll('.portfolio-grid figure:not([hidden]) .portfolio-open img'));
}
categoryCards.forEach(card=>card.addEventListener('click',e=>{
  e.preventDefault();filterPortfolio(card.dataset.category);
  document.getElementById('portfolio-title').scrollIntoView({behavior:'smooth',block:'start'});
}));

// Open the category requested from the homepage, without changing other categories.
const initialCategory = new URLSearchParams(window.location.search).get('category');
if (initialCategory && categoryCards.some(card => card.dataset.category === initialCategory)) {
  filterPortfolio(initialCategory);
}
