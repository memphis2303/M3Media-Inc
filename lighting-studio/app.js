'use strict';

const $ = id => document.getElementById(id);
const ROUTES={
  studio:['3D Lighting Studio','Arrange the setup in 3D or see the light on a realistic portrait.'],
  storyboard:['Lighting Storyboard','Compare the lighting plans, see the reference images, and take a recipe into the studio.'],
  coach:['Smart Setup Coach','Turn the shoot brief into a lighting plan you can apply to the studio.'],
  gear:['Gear Library','Choose the equipment you have and estimate where to start.'],
  presets:['Lighting Presets','Keep complete lighting setups ready for the next shoot.']
};
let route='storyboard', selected='key', gearLight='key', mode='orbit', toastTimer, coachKit=null;
const view=new StudioView($('stage'),selectObject,()=>selected);
const portraitView=new PortraitView($('portrait-stage'),view,message=>{
  $('portrait-status').textContent=message;
  $('portrait-status').hidden=!message;
  $('portrait-stage').hidden=!!message;
});
const entries = obj => Object.entries(obj);
const textOptions = (options,value) => entries(options).map(([id,name])=>`<option value="${id}"${value===id?' selected':''}>${name}</option>`).join('');
const coordinateFields=['x','y','z'];
const lightFields=['source','watts','modifier','gel','power','softness'];
const fixed = n => Number(n.toFixed(2));
let presets=[];
let canStorePresets=true;

try {
  const saved=JSON.parse(localStorage.getItem('lightcraft-v9-presets') || '[]');
  if (Array.isArray(saved)) {
    presets=saved.flatMap(item=>{
      try {
        return [cleanShootRecord(item)];
      } catch {return [];}
    });
  }
} catch (error) {
  if(error.name==='SecurityError') canStorePresets=false;
}

function announce(message) {
  $('status').textContent=message;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('status').textContent='',4500);
}

function formField(id, key) {
  const f=FIELDS[key], value=Scene.get()[id][key], data=`data-object="${id}" data-field="${key}"`;
  if(typeof value==='boolean') return `<label class="check"><input type="checkbox" ${data}${value?' checked':''}> ${f.label}</label>`;
  if(f.options) return `<label>${f.label}<select ${data}>${textOptions(f.options,value)}</select></label>`;
  return `<label>${f.label}<input type="number" ${data} min="${f.min}" max="${f.max}" step="${f.step}" value="${value}"></label>`;
}

function fields(id,keys,extra='') {return `<div class="field-grid ${extra}">${keys.map(key=>formField(id,key)).join('')}</div>`;}

function renderInspector() {
  const id=selected, s=Scene.get(), obj=s[id];
  const panels={
    subject:['form','skin','scale','build','yaw'],camera:['lens'],flag:['yaw']
  };
  const details=LIGHTS.includes(id)?lightFields:REFLECTORS.includes(id)?['finish']:panels[id];
  const switches=[...(typeof obj.enabled==='boolean'?['enabled']:[]),...(LIGHTS.includes(id)?['grid']:[])];
  const note=id==='camera'?'Position the camera in the overhead plan. Focal length is recorded in the setup and lighting card.':
    id==='subject'?'Use the position, form, height and build controls to change the study model.':
    'Use the fields to position equipment by keyboard, or drag an enabled fixture in Studio view.';
  $('object-controls').innerHTML=`<h3>${OBJECTS[id][0]}</h3>${switches.map(key=>formField(id,key)).join('')}${fields(id,coordinateFields,'three')}${fields(id,details)}<p class="field-note">${note}</p>`;
}

function renderObjectPicker() {
  const s=Scene.get(), base=[...MAIN_LIGHTS,'subject','camera','reflector','flag'];
  const ids=Object.keys(OBJECTS).filter(id=>base.includes(id)||s[id].enabled);
  const list=$('object-list'), signature=ids.join(',');
  if(list.dataset.objects===signature) return;
  list.dataset.objects=signature;
  list.innerHTML=ids.map(id=>{
    const [name,icon]=OBJECTS[id];
    return `<button class="button compact" type="button" data-pick="${id}" aria-pressed="${selected===id}"><span class="object-icon" aria-hidden="true">${icon}</span>${name}</button>`;
  }).join('');
  if(!ids.includes(selected)) {
    const wasEditing=$('object-controls').contains?.(document.activeElement);
    selectObject('subject');
    if(wasEditing) list.querySelector('[data-pick="subject"]')?.focus({preventScroll:true});
  }
}

function selectObject(id) {
  selected=id;
  for(const b of $('object-list').querySelectorAll('button')) b.setAttribute('aria-pressed',String(b.dataset.pick===id));
  renderInspector();
  renderStudio();
}

function patchFields() {
  const s=Scene.get();
  for(const control of document.querySelectorAll('[data-object][data-field]')){
    const value=s[control.dataset.object][control.dataset.field];
    if(control.type==='checkbox') control.checked=value;
    else if(document.activeElement!==control || control.type!=='number') control.value=value;
  }
}

function keyGeometry(s) {
  const t=targetOf(s), l=s.key;
  const horizontal=Math.hypot(l.x-t.x,l.z-t.z);
  const angle=Math.round(Math.atan2(t.x-l.x,l.z-t.z)*180/Math.PI);
  const elevation=Math.round(Math.atan2(l.y-t.y,horizontal)*180/Math.PI);
  return {angle,elevation,meters:fixed(distance(l,t))};
}

function summary(s) {
  const l=s.key, {angle,elevation,meters}=keyGeometry(s);
  const side=angle===0?'centered':Math.abs(angle)+'° camera-'+(angle>0?'left':'right');
  const active=LIGHTS.filter(id=>s[id].enabled && s[id].power>0);
  const key=l.enabled && l.power>0 ? `Key ${side}, ${elevation}° elevation, ${meters} m from the subject, ${l.power}% power.` : 'Key light is off.';
  const reflectors=REFLECTORS.filter(id=>s[id].enabled);
  const bounce=reflectors.length===1?EQUIPMENT[s[reflectors[0]].finish].name:reflectors.length?reflectors.length+' reflectors':null;
  const accessories=[bounce,s.flag.enabled?'black flag':null].filter(Boolean);
  const extras=active.filter(id=>!MAIN_LIGHTS.includes(id));
  const extraNote=extras.length?' '+extras.map(id=>OBJECTS[id][0]).join(', ')+' on.':'';
  return `${key} ${active.includes('fill')?'Fill on.':'Fill off.'} ${active.includes('rim')?'Rim on.':'Rim off.'}${extraNote}${accessories.length?' In use: '+accessories.join(', ')+'.':''}`;
}

const defaultPhoto = genre => PHOTOS.find(photo=>photo.genre===genre);
function referenceFor(s) {
  const look=GENRES[s.genre].styles[0], recipe=editorialRecipes(s).find(item=>sameRecipe(item.scene,s));
  const photo=recipe || setupReference(s.genre,0);
  return {id:s.genre+'-guide-'+(recipe?.id||'default'),genre:s.genre,style:look,src:photo.photo,
    alt:photo.alt,slot:photo.slot,fallback:photo.fallback,note:photo.caption||TECHNIQUES[look].hint};
}
function photoCard(photo, s, inStudio=false) {
  if(!photo) return `<div class="photo-empty"><p class="eyebrow">PHOTO EXAMPLE</p><h3>Explore this technique in the live studio</h3><p>There’s no bundled photo for this setup. Switch to Studio to work with the lighting setup.</p></div>`;
  const sameGenre=photo.genre===s.genre;
  const caption=sameGenre && photo.style===s.style?'Illustrates the technique at its starting placement.'
    :sameGenre?'Genre reference showing a different lighting technique.':'Technique reference from a different genre.';
  return `<img class="photo-img${inStudio?' viewport-image':''}" src="${photo.src}" alt="${photo.alt}"${photo.slot?` data-slot="${photo.slot}" data-fallback="${photo.fallback||''}"`:''}>
    ${studyBadge(photo.slot)}<figcaption class="photo-caption"><span class="photo-tag">${photo.sourceLabel||'AI-generated example'} · ${photo.genre} · ${TECHNIQUES[photo.style].name}</span>
    <p>${photo.note}</p><p>${caption} Lighting changes show in the live views.</p></figcaption>`;
}

function setMode(next) {
  mode=next;
  view.mode=next;
  $('view3d').hidden=next==='reference'||next==='portrait';
  $('view-portrait').hidden=next!=='portrait';
  $('view-photo').hidden=next!=='reference';
  $('orbit-controls').hidden=next!=='orbit';
  $('stage-selection').hidden=next!=='orbit';
  $('stage-instructions').hidden=next!=='orbit';
  $('viewport-type').textContent={orbit:'LIVE 3D',portrait:'SIMULATED LIGHT',reference:'PHOTO EXAMPLE'}[mode];
  for(const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
  renderStudio();
}

function renderStudio() {
  const s=Scene.get();
  const tabletop=s.subject.form==='table';
  $('mode-portrait').disabled=tabletop;
  $('mode-portrait').title=tabletop?'Live portrait is available for human subjects.':'';
  if(tabletop && mode==='portrait') {setMode('orbit');return;}
  $('stage-selection').textContent=s[selected].enabled===false?'Studio view':OBJECTS[selected][0];
  $('scene-description').textContent=summary(s);
  if(mode==='reference') {
    const photo=editorialPhoto(s)||referenceFor(s);
    const key=photo?.id+'|'+s.genre+'|'+s.style;
    if($('view-photo').dataset.photo!==key) {
      $('view-photo').dataset.photo=key;
      $('view-photo').innerHTML=`<figure>${photoCard(photo,s,true)}</figure>`;
    }
  }
  if(mode==='portrait') portraitView.request(s,$('portrait-subject').value);
  else view.schedule();
}

function settings(s) {
  return '<div class="settings">'+exposure(s).settings.map(x=>'<span>'+x+'</span>').join('')+'</div>';
}

function renderStory() {
  const s=Scene.get();
  $('story-content').innerHTML=editorialBody(s);
  for(const item of $('genre-grid').querySelectorAll('button')) item.setAttribute('aria-pressed',String(item.dataset.genre===s.genre));
}

function kitInputs(prefix) {
  return entries(KIT_LABELS).map(([id,label])=>
    `<label>${label}<input type="number" id="${prefix}-count-${id}" min="0" max="${MAX_FIXTURES}" step="1" inputmode="numeric"></label>`).join('');
}

function updateKitInputs(prefix,s) {
  for(const [kind,count] of entries(kitCounts(s))) $(prefix+'-count-'+kind).value=count;
}

function coachScene() {
  const next=recommend(Scene.get());
  if(coachKit) for(const [kind,count] of entries(coachKit)) resizeKit(next,kind,count);
  const modifier=$('coach-modifier').value, gel=$('coach-gel').value, reflector=$('coach-reflector').value;
  for(const id of LIGHTS.filter(id=>next[id].enabled)){
    if(member(EQUIPMENT,modifier)&&next[id].modifier!=='bare') Object.assign(next[id],kitFieldPatch('modifier',modifier));
    if(member(EQUIPMENT,gel)&&next[id].gel!=='none') next[id].gel=gel;
  }
  if(REFLECTOR_SURFACES.includes(reflector)) for(const id of REFLECTORS) next[id].finish=reflector;
  const coverage=$('coach-coverage').value;
  if(coverage==='pair'||coverage==='group') {
    const target=targetOf(next), multiplier=coverage==='pair'?1.18:1.35;
    for(const id of LIGHTS.filter(id=>next[id].enabled)){
      const l=next[id];
      for(const axis of ['x','z']) l[axis]=round(clamp(target[axis]+(l[axis]-target[axis])*multiplier,FIELDS[axis].min,FIELDS[axis].max));
      l.power=round(Math.min(100,l.power*multiplier**2));
    }
    if(!modifier && next.key.enabled && next.key.modifier!=='bare') Object.assign(next.key,kitFieldPatch('modifier','umbrella'));
  }
  return next;
}

function renderCoach() {
  const s=Scene.get(), next=coachScene(), t=TECHNIQUES[next.style], start=exposure(next);
  const fixture=EQUIPMENT[next.key.source].name.toLowerCase(), mod=EQUIPMENT[next.key.modifier].name.toLowerCase();
  const placement=keyGeometry(next);
  const coverage=$('coach-coverage').value;
  const side=placement.angle===0?'centered over the lens':Math.abs(placement.angle)+'° camera-'+(placement.angle>0?'left':'right');
  const initial=start.flash?`Start the key near ${start.power.toLowerCase()} and confirm exposure with a test frame or meter.`:'Set the source to a comfortable output and meter the subject at the chosen shutter speed.';
  const groupTip=coverage==='pair'||coverage==='group'
    ?'Spread the subjects across the center of the beam. Meter the nearest and farthest faces and adjust the spacing. The studio shows the center target.'
    :`Position the subject comfortably and leave a clear path around the set. ${GENRES[s.genre].access}`;
  const steps=next.key.enabled?[
    groupTip,
    `Place the ${fixture} with a ${mod} about ${fixed(start.d)} m away, ${side}, at ${placement.elevation}° above the target.`,
    initial,t.hint
  ]:[groupTip,'Use available light. Reposition any reflectors to control bounce and meter a test frame.'];
  const counts=kitCounts(next), kit=entries(KIT_LABELS).map(([id,label])=>
    counts[id]+' '+(counts[id]===1?label.slice(0,-1):label).toLowerCase()).join(' · ');
  const kitItems=LIGHTS.filter(id=>next[id].enabled).map(id=>{
    const light=next[id], parts=[EQUIPMENT[light.source].name,EQUIPMENT[light.modifier].name,`height ${light.y} m`,`${fixed(distance(light,targetOf(next)))} m from target`,light.power+'% power'];
    if(light.gel!=='none') parts.push(EQUIPMENT[light.gel].name);
    if(light.grid) parts.push('grid');
    return '<li>'+OBJECTS[id][0]+' · '+parts.join(' · ')+'</li>';
  }).concat(REFLECTORS.filter(id=>next[id].enabled).map(id=>{
    const panel=next[id];
    return `<li>${OBJECTS[id][0]} · ${EQUIPMENT[panel.finish].name} · height ${panel.y} m · ${fixed(distance(panel,targetOf(next)))} m from target</li>`;
  })).join('');
  updateKitInputs('coach',next);
  $('coach-plan').innerHTML=`<p class="eyebrow">RECOMMENDED PLAN</p><h2>${t.name} for ${s.genre.toLowerCase()}</h2>${next.key.enabled?settings(next):'<p>Meter available light.</p>'}
    ${s.experience==='advanced'?'<p>'+steps.join(' ')+'</p>':'<ol>'+steps.map(step=>'<li>'+step+'</li>').join('')+'</ol>'}
    <h3>Planned equipment</h3><p>${kit}</p>${kitItems?'<ul>'+kitItems+'</ul>':''}
    <h3>Active scene</h3><p>${summary(s)}</p>`;
  for(const id of ['mood','space','experience']) $(id).value=s[id];
}

function renderGearControls() {
  const lightOptions=Object.fromEntries(LIGHTS.map(id=>[id,OBJECTS[id][0]]));
  $('gear-controls').innerHTML=`<div class="field-grid"><label>Configure light<select id="gear-light">${textOptions(lightOptions,gearLight)}</select></label></div>
    ${formField(gearLight,'enabled')}${formField(gearLight,'grid')}${fields(gearLight,lightFields)}
    <h3>Reflector and spill control</h3>${formField('reflector','enabled')}${fields('reflector',['finish'])}${formField('flag','enabled')}`;
  $('gear-light').addEventListener('change',e=>{
    gearLight=e.target.value;
    renderGearControls();
    renderGearEstimate();
    $('gear-light').focus();
  });
}

function renderGearEstimate() {
  const s=Scene.get(), l=s[gearLight], start=exposure(s,gearLight);
  const recommendation=!l.enabled?'This light is disabled in the scene.':
    start.flash?`Estimated starting flash setting: <strong>${start.power}</strong>. Meter a test frame and use a shutter speed within your flash sync limit.`:
    'Meter at your chosen shutter speed. Fixture lux, beam angle and ambient conditions determine the starting exposure.';
  $('gear-estimate').innerHTML=`<p>${OBJECTS[gearLight][0]} · ${EQUIPMENT[l.source].name} · ${fixed(start.d)} m from subject · ${l.power}% scene power</p>
    <div class="settings">${start.settings.map(x=>'<span>'+x+'</span>').join('')}</div>
    <p>${recommendation}</p><p class="field-note">Flash estimates scale a V8 baseline of 200 Ws, 1.5 m, f/5.6 and ISO 100. Manufacturer outputs and modifiers vary.</p>`;
}

function updateShared() {
  const s=Scene.get(), g=GENRES[s.genre];
  $('genre').value=s.genre;
  const suggested=Object.fromEntries(g.styles.map(id=>[id,TECHNIQUES[id].name]));
  const other=Object.fromEntries(entries(TECHNIQUES).filter(([id])=>!g.styles.includes(id)).map(([id,t])=>[id,t.name]));
  if($('style').dataset.genre!==s.genre) {
    $('style').dataset.genre=s.genre;
    $('style').innerHTML=`<optgroup label="Suggested for ${s.genre}">${textOptions(suggested,s.style)}</optgroup><optgroup label="Other techniques">${textOptions(other,s.style)}</optgroup>`;
  }
  $('style').value=s.style;
  const count=LIGHTS.filter(id=>s[id].enabled).length;
  for(const id of MAIN_LIGHTS) $('toggle-'+id).setAttribute('aria-pressed',String(s[id].enabled));
  updateKitInputs('studio',s);
  renderObjectPicker();
  $('scene-meta').textContent=`${count} light${count===1?'':'s'} in scene · ${s.camera.lens} mm · ${Scene.stored()?'Changes saved on this browser':'Session only'}`;
}

function renderRoute() {
  if(route==='studio') renderStudio();
  if(route==='storyboard') renderStory();
  if(route==='coach') renderCoach();
  if(route==='gear') renderGearEstimate();
  if(route==='presets') renderPresets();
}

function navigate(focus=false) {
  const hash=location.hash.slice(1);
  if (hash==='main' && focus) return;
  route=member(ROUTES,hash)?hash:'storyboard';
  for(const page of document.querySelectorAll('.page')) page.hidden=page.id!==route;
  for(const link of document.querySelectorAll('[data-route]')){
    if(link.dataset.route===route) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  [$('page-title').textContent,$('page-intro').textContent]=ROUTES[route];
  document.title=ROUTES[route][0]+' | LightCraft V9';
  renderRoute();
  if(focus) {
    $('page-title').focus({preventScroll:true});
    window.scrollTo(0,0);
  }
}

function persistPresets() {
  try {localStorage.setItem('lightcraft-v9-presets',JSON.stringify(presets));canStorePresets=true;}
  catch {canStorePresets=false;}
}

function renderPresets() {
  const list=$('presets-list');
  list.replaceChildren();
  if(!presets.length) {
    const empty=document.createElement('p');
    empty.textContent='No presets saved yet.';
    list.append(empty);
  }
  for(const item of presets){
    const row=document.createElement('article');
    row.className='preset-row';
    row.innerHTML='<div><strong></strong><p></p></div><div class="actions"><button class="button" type="button">Load</button><button class="button" type="button">Delete</button><button class="button" type="button">Lighting card</button><button class="button" type="button">As shot</button><button class="button" type="button">Adapt</button></div>';
    row.querySelector('strong').textContent=item.name;
    row.querySelector('p').textContent=item.scene.genre+' · '+TECHNIQUES[item.scene.style].name+(item.asShot?' · As-shot record saved':'');
    const [load,remove,card,actual,adapt]=row.querySelectorAll('button');
    load.setAttribute('aria-label','Load '+item.name);
    remove.setAttribute('aria-label','Delete '+item.name);
    load.addEventListener('click',()=>{Scene.set(item.scene);location.hash='studio';announce('Loaded '+item.name+'.');});
    remove.addEventListener('click',()=>{
      presets=presets.filter(p=>p.id!==item.id);
      persistPresets();renderPresets();$('save-secondary').focus();announce('Deleted '+item.name+'.');
    });
    for(const [button,label,event] of [[card,'Lighting card','card'],[actual,'As-shot record','actual'],[adapt,'Adapt to a studio','adapt']]){
      button.setAttribute('aria-label',label+' for '+item.name);
      button.addEventListener('click',()=>openPresetWorkflow(event,item));
    }
    list.append(row);
  }
}

function applyEquipment(id) {
  const e=EQUIPMENT[id], s=Scene.get(), l=s[gearLight];
  if(e.group==='Source') Scene.edit(gearLight,{source:id,watts:e.watts,enabled:true});
  if(e.group==='Modifier') Scene.edit(gearLight,{modifier:id,softness:e.soft,enabled:true});
  if(e.group==='Bounce') Scene.edit('reflector',{finish:id,enabled:true});
  if(e.group==='Gel') Scene.edit(gearLight,{gel:id,enabled:true});
  if(id==='grid') Scene.edit(gearLight,{grid:!l.grid});
  if(id==='flag') Scene.edit('flag',{enabled:!s.flag.enabled});
  announce(e.name+' updated in the scene.');
}

$('genre').innerHTML=textOptions(Object.fromEntries(Object.keys(GENRES).map(id=>[id,id])));
$('mood').innerHTML=textOptions(Object.fromEntries(entries(MOODS).map(([id,m])=>[id,m[0]])));
$('genre').addEventListener('change',e=>Scene.select(e.target.value));
$('style').addEventListener('change',e=>Scene.select(Scene.get().genre,e.target.value));
renderObjectPicker();
$('object-list').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b) selectObject(b.dataset.pick);});
for(const id of MAIN_LIGHTS) {
  $('toggle-'+id).addEventListener('click',()=>{
    const enabled=!Scene.get()[id].enabled;
    Scene.edit(id,{enabled});
    if(enabled) selectObject(id);
  });
}
for(const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click',()=>setMode(b.dataset.mode));
$('portrait-subject').addEventListener('change',renderStudio);
$('reset-view').addEventListener('click',()=>view.reset());
$('orbit-left').addEventListener('click',()=>{view.azimuth-=Math.PI/12;view.schedule();});
$('orbit-right').addEventListener('click',()=>{view.azimuth+=Math.PI/12;view.schedule();});
$('genre-grid').innerHTML=Object.keys(GENRES).map(genre=>{
  const ref=genre==='Bodyscape'?{photo:defaultPhoto(genre).src}:setupReference(genre,0);
  const slot=ref.slot?` data-slot="${ref.slot}" data-fallback="${ref.fallback||''}"`:'';
  return `<button type="button" class="genre-card" data-genre="${genre}" aria-pressed="false"><img class="photo-img" src="${ref.photo}" alt=""${slot} loading="lazy"><span>${genre}</span></button>`;
}).join('');
$('pose-previous').addEventListener('click',()=>stepPoseStudy(-1));
$('pose-next').addEventListener('click',()=>stepPoseStudy(1));
$('pose-dialog').addEventListener('keydown',e=>{
  if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
  e.preventDefault();
  stepPoseStudy(e.key==='ArrowLeft'?-1:1);
});
$('story-content').addEventListener('click',e=>{
  const pose=e.target.closest('[data-pose-study]');
  if(pose) {openPoseStudy(pose.dataset.poseStudy,Scene.get().genre);return;}
  const button=e.target.closest('[data-apply-recipe]');
  if(!button) return;
  const recipe=editorialRecipes(Scene.get()).find(item=>item.id===button.dataset.applyRecipe);
  if(!recipe) return;
  Scene.set(recipe.scene);
  $('story-content').querySelector(`[data-apply-recipe="${recipe.id}"]`)?.focus({preventScroll:true});
  announce(recipe.title+' applied to the studio.');
});
$('genre-grid').addEventListener('click',e=>{
  const b=e.target.closest('[data-genre]');
  if(b) {
    Scene.select(b.dataset.genre);
    $('story-content').scrollIntoView({block:'start'});
    const heading=$('story-content').querySelector('h2');
    heading.tabIndex=-1;
    heading.focus({preventScroll:true});
  }
});
$('gear-library').innerHTML=entries(EQUIPMENT).map(([id,e])=>`<article class="card gear-card"><p class="eyebrow">${e.group}</p><h3>${e.name}</h3><p>${e.detail}</p>
  <button class="button compact" type="button" data-equipment="${id}" aria-label="${id==='flag'||id==='grid'?'Toggle ':'Use '}${e.name}">${id==='flag'||id==='grid'?'Toggle in scene':'Use in scene'}</button></article>`).join('');
$('gear-library').addEventListener('click',e=>{const b=e.target.closest('[data-equipment]');if(b) applyEquipment(b.dataset.equipment);});
for(const prefix of ['studio','coach']) {
  $(prefix+'-kit-counts').innerHTML=kitInputs(prefix);
  for(const kind of Object.keys(KIT_LABELS)){
    $(prefix+'-count-'+kind).addEventListener('change',e=>{
      const draft=prefix==='studio'?copy(Scene.get()):coachScene();
      if(Number.isFinite(e.target.valueAsNumber)) resizeKit(draft,kind,e.target.valueAsNumber);
      if(prefix==='studio') Scene.set(draft);
      else {coachKit=kitCounts(draft);renderCoach();}
    });
  }
}
for(const [id,options] of [['modifier',MODIFIERS],['gel',GELS],['reflector',REFLECTOR_SURFACES]]) {
  const choices=Object.fromEntries(options.map(key=>[key,EQUIPMENT[key].name]));
  $('coach-'+id).innerHTML='<option value="">Mixed / recipe default</option>'+textOptions(choices);
  $('coach-'+id).addEventListener('change',renderCoach);
}
$('coach-coverage').addEventListener('change',renderCoach);
for(const id of ['mood','space','experience']) $(id).addEventListener('change',e=>Scene.set({...Scene.get(),[id]:e.target.value},'coach'));
$('apply-plan').addEventListener('click',()=>{Scene.set(coachScene());announce('Lighting plan applied to the active scene.');});

document.addEventListener('change',e=>{
  const input=e.target, id=input.dataset.object, key=input.dataset.field;
  if(!id || !key) return;
  const current=Scene.get()[id][key];
  const raw=input.type==='checkbox'?input.checked:input.type==='number'?input.valueAsNumber:input.value;
  const value=safeField(key,raw,current);
  Scene.edit(id,kitFieldPatch(key,value));
  if(input.type==='number') input.value=value;
});

function openSave() {
  const s=Scene.get();
  $('preset-name').value=s.genre+' · '+TECHNIQUES[s.style].name;
  $('save-dialog').showModal();
  $('preset-name').select();
}
$('save-open').addEventListener('click',openSave);
$('save-secondary').addEventListener('click',openSave);
$('cancel-save').addEventListener('click',()=>$('save-dialog').close());
$('save-form').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('preset-name').value.trim();
  if(!name) {$('preset-name').focus();return;}
  presets.unshift({id:newId(),name,scene:copy(Scene.get())});
  persistPresets();$('save-dialog').close();
  if(route==='presets') renderPresets();
  announce(canStorePresets?'Preset saved.':'Preset saved for this session. Export JSON for a permanent copy.');
});

function downloadJSON(value,name) {
  const a=document.createElement('a');
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export').addEventListener('click',()=>downloadJSON(Scene.get(),'lightcraft-v9-setup.json'));
$('import').addEventListener('change',async e=>{
  const file=e.target.files[0];
  if(!file) return;
  try {
    if(file.size>1024*1024) throw Error('Choose a LightCraft setup JSON smaller than 1 MB.');
    const input=JSON.parse(await file.text());
    if(input?.format==='lightcraft-shoot-record' && input.version===1) {
      const imported=cleanShootRecord(input.preset);
      presets.unshift({...imported,id:newId()});
      persistPresets();renderPresets();
      announce(canStorePresets?'Shoot record imported.':'Shoot record imported for this session.');
      return;
    }
    const old=input?.version===8 && input.controls && typeof input.controls==='object';
    const next=old?migrateV8(input):normalize(input);
    Scene.set(next);
    location.hash='studio';
    announce(old?'V8 workspace imported into V9.':'V9 setup imported.');
  } catch(error) {announce(error instanceof SyntaxError?'This file does not contain valid JSON.':error.message);}
  finally {e.target.value='';}
});

Scene.subscribe(()=>{
  updateShared();
  patchFields();
  if(route!=='presets') renderRoute();
});
window.addEventListener('hashchange',()=>navigate(true));
selectObject('key');
renderGearControls();
updateShared();
navigate();
