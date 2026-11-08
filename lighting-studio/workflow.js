'use strict';

const safeMarkup = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const profileKey='lightcraft-v9-studio-profiles';
let profiles=[];
try {
  const stored=JSON.parse(localStorage.getItem(profileKey)||'[]');
  if(Array.isArray(stored)) profiles=stored.flatMap(profile=>{
    try {return [cleanProfile(profile)];} catch {return [];}
  });
} catch { /* The editor still works for this session. */ }

let cardPreset, actualPreset, actualDraft, adaptPreset, profileId, resumeAdapt, adaptation;
let frameRequest=0;
const adaptView=new StudioView($('adapt-stage'),null,()=>null,()=>adaptation?.scene,()=>adaptation?.profile);

function activeObjects(s) {
  return ['subject','camera',...LIGHTS.filter(id=>s[id].enabled && s[id].power>0),
    ...[...REFLECTORS,'flag'].filter(id=>s[id].enabled)];
}

function objectGear(s,id) {
  const o=s[id];
  if(LIGHTS.includes(id)) {
    const rating=o.source==='daylight'?'':` ${o.watts} ${o.source==='led'?'W':'Ws'}`;
    const modifier=EQUIPMENT[o.modifier].name;
    const control=[o.grid?'Grid':null,o.gel!=='none'?EQUIPMENT[o.gel].name:null].filter(Boolean);
    return [EQUIPMENT[o.source].name+rating,modifier,...control].join(' · ');
  }
  if(REFLECTORS.includes(id)) return EQUIPMENT[o.finish].name;
  if(id==='flag') return 'Black flag · '+o.yaw+'° rotation';
  if(id==='camera') return 'Aimed at the subject';
  return {standing:'Standing person',seated:'Seated person',table:'Tabletop subject'}[o.form]+' · '+o.yaw+'° rotation';
}

function overhead(s,ids,pattern) {
  const points=ids.map(id=>s[id]);
  const minX=Math.min(...points.map(p=>p.x)), maxX=Math.max(...points.map(p=>p.x));
  const minZ=Math.min(...points.map(p=>p.z)), maxZ=Math.max(...points.map(p=>p.z));
  const scale=Math.min(72,268/Math.max(.7,maxX-minX),155/Math.max(.7,maxZ-minZ));
  const map=p=>[round(160+(p.x-(minX+maxX)/2)*scale),round(103+(p.z-(minZ+maxZ)/2)*scale)];
  const [sx,sz]=map(s.subject);
  const drawn=ids.map((id,i)=>{
    const [x,z]=map(s[id]);
    const ray=id==='subject'?'':`<line x1="${sx}" y1="${sz}" x2="${x}" y2="${z}" stroke="#746689" stroke-dasharray="3 4"/>`;
    const fill=id==='subject'?'#211c29':id==='camera'?'#345777':'#57329c';
    return {x,z,ray,label:i+1,fill};
  });
  const used=[];
  const pins=drawn.map(({x,z,label,fill})=>{
    let bx=x,bz=z;
    for(const [dx,dz] of [[0,0],[0,-20],[20,0],[0,20],[-20,0],[20,-20],[-20,-20],[20,20],[-20,20],[0,-39],[39,0],[0,39],[-39,0]]) {
      const px=clamp(x+dx,13,307), pz=clamp(z+dz,13,192);
      if(used.every(([a,b])=>Math.hypot(a-px,b-pz)>=18)){bx=px;bz=pz;break;}
    }
    used.push([bx,bz]);
    return `<line x1="${x}" y1="${z}" x2="${bx}" y2="${bz}" stroke="#57329c"/>
      <circle cx="${x}" cy="${z}" r="2" fill="#57329c"/>
      <circle cx="${bx}" cy="${bz}" r="9" fill="${fill}"/>
      <text x="${bx}" y="${bz+3.6}" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">${label}</text>`;
  }).join('');
  return `<svg class="card-diagram" viewBox="0 0 320 225" role="img" aria-label="Overhead placement diagram. The numbered positions are listed in the table.">
    <defs><pattern id="${pattern}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" stroke="#dcd6e5" fill="none"/></pattern></defs>
    <rect width="320" height="205" rx="9" fill="#f5f1f8"/>
    <rect width="320" height="205" rx="9" fill="url(#${pattern})"/>
    ${drawn.map(d=>d.ray).join('')}${pins}
    <path d="M14 215h${scale}m-${scale} -3v6m${scale} -6v6" stroke="#3a2c49"/>
    <text x="${20+scale}" y="219" font-size="10" fill="#3a2c49">1 m</text></svg>`;
}

function cardMarkup(item, actual, pattern='card-grid') {
  const s=actual?.scene || item.scene, g=GENRES[s.genre], technique=TECHNIQUES[s.style];
  const sceneLabel=s.genre+' · '+technique.name;
  const cameraSettings=actual?.settings || setupSettings(s), ids=activeObjects(s), t=targetOf(s);
  const equipment=ids.map((id,i)=>{
    const o=s[id];
    const distanceLabel=id==='subject'?'—':round(distance(o,t))+' m';
    const flash=LIGHTS.includes(id)?exposure(s,id):null;
    const power=flash?`${o.power}% scene${!actual && flash.flash?' · start '+flash.power.toLowerCase():''}`:'—';
    return `<tr><th scope="row">${i+1}. ${OBJECTS[id][0]}</th><td>${objectGear(s,id)}</td>
      <td>${o.y} m</td><td>${distanceLabel}</td><td>${power}</td></tr>`;
  }).join('');
  const settings=entries(cameraSettings).map(([id,value])=>`<div><dt>${SHOOT_FIELDS[id]}</dt><dd>${safeMarkup(value)}</dd></div>`).join('');
  return `<article class="lighting-card">
    <header class="card-head"><p class="eyebrow">LIGHTCRAFT · ${actual?'AS SHOT':'PLANNED SETUP'}</p>
      <h2>${safeMarkup(item.name)}</h2>${item.name===sceneLabel?'':`<p>${sceneLabel}</p>`}</header>
    <div class="card-top"><div>${overhead(s,ids,pattern)}</div><div><h3>${actual?'Recorded camera settings':'Starting camera settings'}</h3>
      <dl class="camera-readout">${settings}</dl><p>${safeMarkup(summary(s))}</p>
      <p>${technique.hint}</p></div></div>
    <table class="card-kit"><caption>Equipment and placement</caption><thead><tr>
      <th scope="col">Object</th><th scope="col">Gear / configuration</th><th scope="col">Height</th>
      <th scope="col">To target</th><th scope="col">Power</th></tr></thead><tbody>${equipment}</tbody></table>
    <div class="card-notes"><div><h3>Pose and frame</h3><p>${g.pose}</p></div><div><h3>Access on set</h3><p>${g.access}</p></div></div>
    ${actual && (actual.notes || actual.frame)?`<div class="shot-proof"><div><h3>On-set notes</h3><p>${safeMarkup(actual.notes||'No notes recorded.')}</p></div>
      ${actual.frame?`<img src="${actual.frame}" alt="Recorded test frame">`:''}</div>`:''}
    <p class="field-note card-foot">Distances are measured to the scene target. Confirm starting exposure with a meter or test frame.</p>
  </article>`;
}

function renderCard() {
  const actual=$('card-version').value==='actual'?cardPreset.asShot:null;
  const content=cardMarkup(cardPreset,actual);
  $('card-preview').innerHTML=content;
}
$('card-version').addEventListener('change',renderCard);
$('card-print').addEventListener('click',()=>{
  const actual=$('card-version').value==='actual'?cardPreset.asShot:null;
  const sheet=$('print-sheet');
  sheet.innerHTML=cardMarkup(cardPreset,actual,'print-grid');
  sheet.dataset.ready='true';
  window.print();
});
window.addEventListener('afterprint',()=>{delete $('print-sheet').dataset.ready;});
$('record-export').addEventListener('click',()=>downloadJSON({format:'lightcraft-shoot-record',version:1,preset:cardPreset},'lightcraft-shoot-record.json'));

function updateActualFields(settings) {
  $('actual-settings').innerHTML=entries(SHOOT_FIELDS).map(([id,label])=>
    `<label>${label}<input id="actual-${id}" required maxlength="24" value="${safeMarkup(settings[id])}"></label>`).join('');
}

function setTestFrame(frame) {
  actualDraft.frame=frame;
  const img=$('actual-image');
  if(frame) img.src=frame;
  else img.removeAttribute('src');
  img.hidden=$('actual-remove').hidden=!frame;
}

function openActual(item) {
  actualPreset=item;
  actualDraft=copy(item.asShot||{scene:item.scene,settings:setupSettings(item.scene),notes:'',frame:''});
  frameRequest++;
  $('actual-save').disabled=false;
  $('actual-file').value='';
  $('actual-plan').textContent='Original plan: '+item.name+'. Your shoot record is saved alongside it.';
  $('actual-scene').textContent=item.asShot?'Using the saved as-shot scene.':'Starting with the planned scene. Copy the active scene if you adjusted the setup.';
  $('actual-load').hidden=!item.asShot;
  $('actual-notes').value=actualDraft.notes;
  $('actual-feedback').textContent='';
  updateActualFields(actualDraft.settings);
  setTestFrame(actualDraft.frame);
  $('actual-dialog').showModal();
}

$('actual-capture').addEventListener('click',()=>{
  actualDraft.scene=copy(Scene.get());
  updateActualFields(setupSettings(actualDraft.scene));
  $('actual-scene').textContent='Copied the current '+actualDraft.scene.genre.toLowerCase()+' scene and its suggested settings. Edit the fields to match your camera.';
});
$('actual-load').addEventListener('click',()=>{
  Scene.set(actualPreset.asShot.scene);
  $('actual-dialog').close();
  location.hash='studio';
  announce('As-shot scene loaded.');
});
$('actual-remove').addEventListener('click',()=>{
  frameRequest++;
  setTestFrame('');
  $('actual-file').value='';
  $('actual-save').disabled=false;
  $('actual-feedback').textContent='Test frame removed from this draft.';
});

async function encodeTestFrame(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>20*1024*1024) throw Error('Choose a JPEG, PNG or WebP image under 20 MB.');
  const src=URL.createObjectURL(file), image=new Image();
  try {
    image.src=src;
    await image.decode();
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('2d');
    for(const max of [900,650,400]) {
      const factor=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
      canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));
      context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const data=cleanTestFrame(canvas.toDataURL('image/jpeg',.78));
      if(data) return data;
    }
    throw Error('This image could not be saved at a small enough size.');
  } finally {URL.revokeObjectURL(src);}
}

$('actual-file').addEventListener('change',async e=>{
  const file=e.target.files[0];
  if(!file) return;
  const request=++frameRequest;
  $('actual-save').disabled=true;
  $('actual-feedback').textContent='Preparing test frame…';
  try {
    const frame=await encodeTestFrame(file);
    if(request!==frameRequest || !$('actual-dialog').open) return;
    setTestFrame(frame);
    $('actual-feedback').textContent='Test frame added to the draft.';
  } catch(error) {
    if(request!==frameRequest || !$('actual-dialog').open) return;
    $('actual-feedback').textContent=error.message;
  } finally {
    if(request===frameRequest && $('actual-dialog').open) {
      $('actual-save').disabled=false;
      e.target.value='';
    }
  }
});

$('actual-form').addEventListener('submit',e=>{
  e.preventDefault();
  if($('actual-save').disabled) return;
  const settings=Object.fromEntries(Object.keys(SHOOT_FIELDS).map(id=>[id,$('actual-'+id).value]));
  const saved=cleanShootRecord({...actualPreset,asShot:{...actualDraft,settings,notes:$('actual-notes').value}});
  presets=presets.map(item=>item.id===saved.id?saved:item);
  persistPresets();$('actual-dialog').close();
  renderPresets();$('save-secondary').focus();
  announce(canStorePresets?'As-shot record saved alongside the original plan.':'As-shot record saved for this session. Export it to keep a copy.');
});

function persistProfiles() {
  try {localStorage.setItem(profileKey,JSON.stringify(profiles));return true;}
  catch {return false;}
}

function renderProfiles() {
  const list=$('profiles-list');
  list.replaceChildren();
  if(!profiles.length) {
    const empty=document.createElement('p');
    empty.textContent='No studio profiles saved yet.';
    list.append(empty);
  }
  for(const profile of profiles) {
    const row=document.createElement('article');
    row.className='preset-row';
    row.innerHTML='<div><strong></strong><p></p></div><div class="actions"><button class="button" type="button">Edit</button><button class="button" type="button">Remove</button></div>';
    row.querySelector('strong').textContent=profile.name;
    const sources=SOURCES.reduce((count,id)=>count+profile.inventory[id],0);
    row.querySelector('p').textContent=`${profile.width} × ${profile.depth} m · ${profile.height} m ceiling · ${sources} source${sources===1?'':'s'}`;
    const [edit,remove]=row.querySelectorAll('button');
    edit.setAttribute('aria-label','Edit '+profile.name);
    remove.setAttribute('aria-label','Remove '+profile.name);
    edit.addEventListener('click',()=>openProfile(profile));
    remove.addEventListener('click',()=>{
      profiles=profiles.filter(item=>item.id!==profile.id);
      persistProfiles();renderProfiles();$('profile-new').focus();
      announce('Removed studio profile '+profile.name+'.');
    });
    list.append(row);
  }
}

function openProfile(profile) {
  profileId=profile?.id || newId();
  $('profile-name').value=profile?.name || '';
  $('profile-feedback').textContent='';
  const labels={width:'Clear width',depth:'Clear depth',height:'Ceiling height'};
  const defaults={width:4,depth:5,height:2.7};
  const defaultKit={strobe:2,softbox:1,strip:1,white:1};
  const count=(key)=>`<label>${EQUIPMENT[key].name} count<input type="number" id="stock-${key}" min="0" max="${MAX_FIXTURES}" step="1" value="${profile?.inventory[key]??defaultKit[key]??0}" required></label>`;
  $('profile-dimensions').innerHTML=entries(LIMITS).map(([id,[min,max]])=>
    `<label>${labels[id]} (m)<input type="number" id="room-${id}" min="${min}" max="${max}" step=".01" value="${profile?.[id]??defaults[id]}" required></label>`).join('');
  $('profile-sources').innerHTML=SOURCES.map(key=>`<div class="field-grid">${count(key)}
    ${key==='daylight'?'':`<label>Rated output per ${key==='led'?'LED (W)':'unit (Ws)'}<input type="number" id="rating-${key}" min="1" max="2400" step="1" value="${profile?.ratings[key]??EQUIPMENT[key].watts}" required></label>`}</div>`).join('');
  $('profile-inventory').innerHTML=[...MODIFIERS,...ACCESSORIES].map(count).join('');
  $('profile-dialog').showModal();
}

$('profile-new').addEventListener('click',()=>openProfile());
$('profile-form').addEventListener('submit',e=>{
  e.preventDefault();
  try {
    const dimensions=Object.fromEntries(Object.keys(LIMITS).map(id=>[id,$('room-'+id).valueAsNumber]));
    const inventory=Object.fromEntries(INVENTORY.map(id=>[id,$('stock-'+id).valueAsNumber]));
    const ratings=Object.fromEntries(SOURCES.filter(id=>id!=='daylight').map(id=>[id,$('rating-'+id).valueAsNumber]));
    const profile=cleanProfile({id:profileId,name:$('profile-name').value,...dimensions,inventory,ratings});
    profiles=profiles.some(item=>item.id===profileId)?profiles.map(item=>item.id===profileId?profile:item):[...profiles,profile];
    const stored=persistProfiles(), resume=resumeAdapt;
    resumeAdapt=null;
    $('profile-dialog').close();
    renderProfiles();
    if(resume) openAdapt(resume,profile.id);
    else $('profile-new').focus();
    announce(stored?'Studio profile saved.':'Studio profile saved for this session.');
  } catch(error) {$('profile-feedback').textContent=error.message;}
});

$('profile-dialog').addEventListener('close',()=>{
  if(!resumeAdapt) return;
  const resume=resumeAdapt;
  resumeAdapt=null;
  openAdapt(resume);
});

function renderAdapt() {
  const profile=profiles.find(item=>item.id===$('adapt-profile').value);
  $('adapt-empty').hidden=!!profile;
  $('adapt-result').hidden=!profile;
  adaptation=null;
  if(!profile) return;
  const original=$('adapt-version').value==='actual' && adaptPreset.asShot ? adaptPreset.asShot.scene : adaptPreset.scene;
  adaptation={...planAdaptation(original,profile),profile};
  const {notes,errors,scene}=adaptation;
  const list=(items)=>items.length?'<ul>'+items.map(text=>'<li>'+safeMarkup(text)+'</li>').join('')+'</ul>':'';
  const fit=`${profile.width} × ${profile.depth} m with a ${profile.height} m ceiling. ${summary(scene)}`;
  $('adapt-summary').innerHTML=`<p>${safeMarkup(fit)}</p>
    ${errors.length?'<h3>Resolve before saving</h3>'+list(errors):''}
    ${notes.length?'<h3>Proposed changes</h3>'+list(notes):errors.length?'':'<p>The setup fits the selected profile without a placement or equipment change.</p>'}
    <p class="field-note">The amber outline shows the room and ceiling. Check stands, cable paths, obstacles and exposure on site.</p>`;
  $('adapt-name').value=shortText(adaptPreset.name,50)+' · '+shortText(profile.name,26);
  $('adapt-save').disabled=errors.length>0;
  adaptView.schedule();
}

function openAdapt(item,profileId) {
  adaptPreset=item;
  $('adapt-source').textContent='Original setup: '+item.name+'. The preview opens separately from your active scene.';
  const select=$('adapt-profile');
  select.replaceChildren();
  if(!profiles.length) {
    const option=document.createElement('option');
    option.textContent='No studio profiles yet';
    select.append(option);
  }
  for(const profile of profiles) {
    const option=document.createElement('option');
    option.value=profile.id;option.textContent=profile.name;select.append(option);
  }
  select.disabled=!profiles.length;
  select.value=profileId||profiles[0]?.id||'';
  $('adapt-version-label').hidden=!item.asShot;
  $('adapt-version').value='plan';
  adaptView.reset();
  $('adapt-dialog').showModal();
  renderAdapt();
}
$('adapt-profile').addEventListener('change',renderAdapt);
$('adapt-version').addEventListener('change',renderAdapt);
$('adapt-left').addEventListener('click',()=>{adaptView.azimuth-=Math.PI/12;adaptView.schedule();});
$('adapt-right').addEventListener('click',()=>{adaptView.azimuth+=Math.PI/12;adaptView.schedule();});
$('adapt-new').addEventListener('click',()=>{
  resumeAdapt=adaptPreset;
  $('adapt-dialog').close();
  openProfile();
});
$('adapt-save').addEventListener('click',()=>{
  if(!adaptation || adaptation.errors.length) return;
  const name=shortText($('adapt-name').value,80);
  if(!name) {$('adapt-name').focus();return;}
  presets.unshift({id:newId(),name,scene:copy(adaptation.scene)});
  persistPresets();$('adapt-dialog').close();
  renderPresets();$('save-secondary').focus();
  announce(canStorePresets?'Adaptation saved as a new preset.':'Adaptation saved as a new preset for this session.');
});

function openPresetWorkflow(kind,item) {
  if(kind==='actual') openActual(item);
  if(kind==='adapt') openAdapt(item);
  if(kind==='card') {
    cardPreset=item;
    $('card-version-label').hidden=!item.asShot;
    $('card-version').value='plan';
    renderCard();
    $('card-dialog').showModal();
  }
}
for(const button of document.querySelectorAll('[data-close]')){
  button.addEventListener('click',()=>$(button.dataset.close).close());
}
renderProfiles();
