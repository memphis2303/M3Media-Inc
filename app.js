const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
$('.burger')?.addEventListener('click',()=>$('nav').classList.toggle('open'));
$$('nav a').forEach(a=>a.addEventListener('click',()=>$('nav').classList.remove('open')));
$$('#yr').forEach(e=>e.textContent=new Date().getFullYear());
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(e=>io.observe(e));
const sl=$$('.slide');if(sl.length){let i=0;sl[0].classList.add('on');setInterval(()=>{sl[i].classList.remove('on');i=(i+1)%sl.length;sl[i].classList.add('on')},6500)}
const figs=$$('.masonry figure');if(figs.length){
 const fb=$$('.filters button');let cur=[...figs],k=0;const lb=$('#lb'),im=$('img',lb),ct=$('span',lb);
 const setCat=c=>{fb.forEach(b=>b.classList.toggle('on',b.dataset.c===c));figs.forEach(f=>f.classList.toggle('hide',c!=='all'&&f.dataset.c!==c));cur=figs.filter(f=>!f.classList.contains('hide'))};
 fb.forEach(b=>b.onclick=()=>setCat(b.dataset.c));
 setCat(new URLSearchParams(location.search).get('category')||'all');
 const show=n=>{k=(n+cur.length)%cur.length;const s=$('img',cur[k]);im.src=s.src;im.alt=s.alt;ct.textContent=`${k+1} / ${cur.length}`};
 figs.forEach(f=>f.onclick=()=>{lb.classList.add('on');show(cur.indexOf(f))});
 $('.x',lb).onclick=()=>lb.classList.remove('on');$('.p',lb).onclick=()=>show(k-1);$('.n',lb).onclick=()=>show(k+1);
 lb.onclick=e=>{if(e.target===lb)lb.classList.remove('on')};
 addEventListener('keydown',e=>{if(!lb.classList.contains('on'))return;if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowLeft')show(k-1);if(e.key==='ArrowRight')show(k+1)});
}
