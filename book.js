(()=>{const C=window.STUDIO_CONFIG,$=(s)=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0'),key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
let studio=+new URLSearchParams(location.search).get('studio')===2?2:1,view=new Date(),sel=null,picked=[];view.setDate(1);view.setHours(0,0,0,0);
const today=new Date();today.setHours(0,0,0,0);const min=new Date(today);min.setDate(min.getDate()+C.leadDays);const max=new Date(today);max.setMonth(max.getMonth()+C.monthsAhead);
const taken=(k,s)=>{const b=(C.booked[k]||{})[s];return b==='all'?C.slots.slice():(b||[])};
const status=d=>{const k=key(d);if(d<min||d>max||!C.openDays.includes(d.getDay())||C.closed.includes(k))return'off';const t=taken(k,studio).length;return t>=C.slots.length?'full':t?'some':'open'};
const nice=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'})};
function cal(){$('#mlabel').textContent=`${MN[view.getMonth()]} ${view.getFullYear()}`;
 const first=new Date(view.getFullYear(),view.getMonth(),1),n=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
 $('#prev').disabled=view<=new Date(today.getFullYear(),today.getMonth(),1);$('#next').disabled=new Date(view.getFullYear(),view.getMonth()+1,1)>max;
 let h='';for(let i=0;i<first.getDay();i++)h+='<i></i>';
 for(let d=1;d<=n;d++){const dt=new Date(view.getFullYear(),view.getMonth(),d),k=key(dt),s=status(dt);
  h+=`<button type="button" class="day ${s}${k===sel?' on':''}" data-k="${k}" ${s==='off'||s==='full'?'disabled':''} aria-label="${nice(k)}, ${s==='some'?'limited availability':s==='open'?'available':'unavailable'}">${d}</button>`}
 $('#days').innerHTML=h;
 document.querySelectorAll('.day:not([disabled])').forEach(b=>b.onclick=()=>{sel=b.dataset.k;picked=[];cal();slots()})}
function slots(){const box=$('#slots');
 if(!sel){box.innerHTML='<p class="hint">Choose an available date to see open time slots.</p>';sync();return}
 const t=taken(sel,studio);
 box.innerHTML=`<h3>${nice(sel)}</h3><div class="slotgrid">`+C.slots.map(s=>`<button type="button" class="slot${picked.includes(s)?' on':''}" data-s="${s}" ${t.includes(s)?'disabled':''}>${s}${t.includes(s)?'<small>Booked</small>':''}</button>`).join('')+'</div><p class="hint">Each slot is 2 hours. Select more than one for a longer session.</p>';
 box.querySelectorAll('.slot:not([disabled])').forEach(b=>b.onclick=()=>{const s=b.dataset.s;picked=picked.includes(s)?picked.filter(x=>x!==s):[...picked,s];picked.sort((a,b)=>C.slots.indexOf(a)-C.slots.indexOf(b));b.classList.toggle('on');sync()});sync()}
function sync(){const ok=sel&&picked.length;$('#sum').innerHTML=ok?`<b>${C.studios[studio]}</b><br>${nice(sel)}<br>${picked.join(' · ')}`:'Pick a studio, date and time to start your request.';
 $('#f_studio').value=C.studios[studio];$('#f_date').value=sel?nice(sel):'';$('#f_times').value=picked.join(', ');$('#send').disabled=!ok}
document.querySelectorAll('.tabs button').forEach(b=>{b.onclick=()=>{studio=+b.dataset.s;sel=null;picked=[];tabs();cal();slots()}});
function tabs(){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',+b.dataset.s===studio))}
$('#prev').onclick=()=>{view.setMonth(view.getMonth()-1);cal()};$('#next').onclick=()=>{view.setMonth(view.getMonth()+1);cal()};
tabs();cal();slots()})();
