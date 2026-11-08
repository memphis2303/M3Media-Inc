'use strict';

const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const round = n => Math.round(n*100)/100;
const radians = degrees => degrees*Math.PI/180;
const copy = value => JSON.parse(JSON.stringify(value));
const position = (x,y,z) => ({x,y,z});
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const targetOf = (s, camera = false) => ({
  x:s.subject.x,
  y:s.subject.y+(s.subject.form==='table' ? 1.03 : (s.subject.form==='seated' ? 1.13 : 1.58)*s.subject.scale/100)+(camera ? s.camera.aimOffset : 0),
  z:s.subject.z
});

function keyPosition(target, angle, elevation, meters) {
  const a=radians(angle), e=radians(elevation), d=meters*Math.cos(e);
  return position(round(target.x-Math.sin(a)*d),round(target.y+Math.sin(e)*meters),round(target.z+Math.cos(a)*d));
}

function light(x,y,z,power,modifier,enabled=true) {
  return {...position(x,y,z),source:'strobe',watts:200,power,modifier,softness:EQUIPMENT[modifier].soft,grid:false,gel:'none',enabled};
}

function defaultKeyPlacement(s) {
  if(s.genre==='Bodyscape' && s.style==='low') return {angle:135,elevation:35,meters:1.8};
  const t=TECHNIQUES[s.style];
  return {angle:t.angle,elevation:t.elevation,meters:s.style==='shade'?2.8:1.65};
}

function createScene(genre='Portrait', style=GENRES[genre].styles[0]) {
  const g=GENRES[genre], t=TECHNIQUES[style];
  const s={
    version:9,genre,style,mood:'native',space:'medium',experience:'beginner',
    subject:{...position(0,0,0),form:g.form,skin:g.skin,yaw:t.yaw || 0,scale:100,build:genre==='Maternity' || genre==='Boudoir' ? 120 : 100},
    key:light(-1,2.35,1.2,42,t.modifier),
    fill:light(.95,1.15,1.8,t.fill,'softbox',t.fill>=20 && !(genre==='Headshot' && style==='loop')),
    rim:light(1.15,2.05,-1.25,34,'strip',genre==='Fashion' && style==='rim'),
    camera:{...position(0,g.form==='table'?1.28:g.form==='seated'?1.36:1.66,3.5),lens:g.lens,aimOffset:g.lens<48?-.37:0},
    reflector:{...position(.85,.82,.66),finish:'white',enabled:style==='clamshell'},
    flag:{...position(-.8,1.55,-.65),yaw:25,enabled:false}
  };
  const key=defaultKeyPlacement(s);
  Object.assign(s.key,keyPosition(targetOf(s),key.angle,key.elevation,key.meters));
  if(genre==='Bodyscape' && style==='low') {s.key.softness=25;s.subject.yaw=20;}
  if (style==='clamshell') Object.assign(s.fill,position(0,.65,1.25));
  if (style==='low') s.key.grid=true;
  if (genre==='Outdoor') {
    s.key.source='daylight'; s.key.watts=0; s.fill.enabled=false;
    s.reflector.enabled=true;
  }
  if (style==='gel') {s.key.gel='rose';s.fill.gel='blue';}
  const extraAngles=[-58,65,154,-156,-16];
  for(const id of LIGHTS.slice(3)){
    const i=LIGHTS.indexOf(id)-3;
    const p=keyPosition(targetOf(s),extraAngles[i],i%2===0?16:35,1.85+i*.18);
    s[id]=light(p.x,p.y,p.z,i===4?18:24,MODIFIERS[i%MODIFIERS.length],false);
  }
  for(const id of REFLECTORS.slice(1)){
    const i=REFLECTORS.indexOf(id);
    const p=keyPosition(position(0,1.04,0),-75+i*43,0,1.05+(i%3)*.22);
    s[id]={...p,finish:REFLECTOR_SURFACES[i%REFLECTOR_SURFACES.length],enabled:false};
  }
  return s;
}

const FIELDS = {
  x:{label:'Left / right (m)',min:-4,max:4,step:.01},
  y:{label:'Height (m)',min:0,max:4,step:.01},
  z:{label:'Near / far (m)',min:-5,max:8,step:.01},
  yaw:{label:'Rotation (°)',min:-180,max:180,step:1},
  scale:{label:'Height scale (%)',min:70,max:130,step:1},
  build:{label:'Build width (%)',min:75,max:145,step:1},
  lens:{label:'Focal length (mm)',min:24,max:105,step:1},
  aimOffset:{label:'Aim offset (m)',min:-1,max:1,step:.01},
  watts:{label:'Rated output (Ws / W)',min:0,max:2400,step:1},
  power:{label:'Power (%)',min:0,max:100,step:1},
  softness:{label:'Softness (%)',min:0,max:100,step:1},
  skin:{label:'Skin tone',options:Object.fromEntries(Object.entries(SKIN).map(([key,[name]])=>[key,name]))},
  form:{label:'Subject form',options:{standing:'Standing person',seated:'Seated person',table:'Tabletop subject'}},
  enabled:{label:'Enabled'},grid:{label:'Grid fitted'},
  finish:{label:'Reflector surface',options:Object.fromEntries(REFLECTOR_SURFACES.map(id=>[id,EQUIPMENT[id].name]))},
  gel:{label:'Gel',options:{none:'None',...Object.fromEntries(GELS.map(id=>[id,EQUIPMENT[id].name]))}},
  source:{label:'Light source',options:{strobe:'Studio strobe',speedlight:'Speedlight',led:'Continuous LED',daylight:'Window / daylight'}},
  modifier:{label:'Modifier',options:{softbox:'Softbox',umbrella:'Umbrella',dish:'Beauty dish',strip:'Stripbox',bare:'Bare reflector'}}
};

const member = (table,value) => typeof value==='string' && Object.hasOwn(table,value);
function safeField(key,value,fallback) {
  const field=FIELDS[key];
  if (field.options) return member(field.options,value) ? value : fallback;
  if (typeof fallback==='boolean') return typeof value==='boolean' ? value : fallback;
  return Number.isFinite(value) ? round(clamp(value,field.min,field.max)) : fallback;
}

function normalize(input) {
  if (!input || input.version!==9 || !member(GENRES,input.genre) || !member(TECHNIQUES,input.style)) throw Error('Choose a LightCraft V9 or V8 workspace JSON file.');
  const s=createScene(input.genre,input.style);
  if (member(MOODS,input.mood)) s.mood=input.mood;
  if (['small','medium','large'].includes(input.space)) s.space=input.space;
  if (['beginner','advanced'].includes(input.experience)) s.experience=input.experience;
  for (const key of Object.keys(OBJECTS)) {
    for (const field of Object.keys(s[key])) {
      s[key][field]=safeField(field,input[key]?.[field],s[key][field]);
    }
  }
  if(!Number.isFinite(input.camera?.aimOffset)) s.camera.aimOffset=s.camera.lens<48?-.37:0;
  return s;
}

function migrateV8(old) {
  const genre=member(GENRES,old.shoot) ? old.shoot : 'Portrait';
  const s=createScene(genre);
  if (member(MOODS,old.mood)) s.mood=old.mood;
  s.space=old.space;
  s.experience=old.experience;
  const c=old.controls;
  const value=(key,fallback)=>Number.isFinite(c[key]) ? c[key] : fallback;
  Object.assign(s.key,keyPosition(targetOf(s),clamp(value('angle',45),-180,180),clamp(value('height',25),-30,80),clamp(value('distance',1.5),.5,5)));
  s.key.power=100/Math.pow(2,clamp(value('power',3),0,7));
  s.key.softness=value('softness',65);
  s.fill.power=value('fill',25);
  s.fill.enabled=s.fill.power>0;
  return normalize(s);
}

function recommend(s) {
  const style=MOODS[s.mood][1] || GENRES[s.genre].styles[0];
  const fresh=createScene(s.genre,style);
  const meters={small:1.2,medium:1.65,large:2.25}[s.space];
  const key=defaultKeyPlacement(fresh);
  fresh.subject={...s.subject,yaw:fresh.subject.yaw};
  fresh.camera={...s.camera};
  Object.assign(fresh.key,keyPosition(targetOf(fresh),key.angle,key.elevation,meters));
  const offset=position(s.subject.x,s.subject.y,s.subject.z);
  for (const id of [...LIGHTS.slice(1),...REFLECTORS,'flag']) {
    for (const axis of ['x','y','z']) fresh[id][axis]+=offset[axis];
  }
  for (const id of LIGHTS) {
    fresh[id].source=s[id].source;
    fresh[id].watts=s[id].watts;
  }
  fresh.mood=s.mood; fresh.space=s.space; fresh.experience=s.experience;
  return normalize(fresh);
}

const KIT_LABELS={lights:'Lights',reflectors:'Reflectors',modifiers:'Modifiers',gels:'Gels',grids:'Grids'};

function kitCounts(s) {
  const lights=LIGHTS.filter(id=>s[id].enabled);
  return {
    lights:lights.length,
    reflectors:REFLECTORS.filter(id=>s[id].enabled).length,
    modifiers:lights.filter(id=>s[id].modifier!=='bare').length,
    gels:lights.filter(id=>s[id].gel!=='none').length,
    grids:lights.filter(id=>s[id].grid).length
  };
}

function resizeSelection(ids,count,has,set) {
  const active=ids.filter(has);
  if(active.length>count) active.slice(count).forEach(id=>set(id,false));
  if(active.length<count) ids.filter(id=>!has(id)).slice(0,count-active.length).forEach(id=>set(id,true));
}

function resizeKit(s,kind,desired) {
  const count=clamp(Math.trunc(desired)||0,0,MAX_FIXTURES);
  if(kind==='lights'||kind==='reflectors') {
    const ids=kind==='lights'?LIGHTS:REFLECTORS;
    resizeSelection(ids,count,id=>s[id].enabled,(id,enabled)=>{s[id].enabled=enabled;});
    return;
  }
  if(kitCounts(s).lights<count) resizeKit(s,'lights',count);
  const active=LIGHTS.filter(id=>s[id].enabled);
  if(kind==='modifiers'){
    resizeSelection(active,count,id=>s[id].modifier!=='bare',(id,enabled)=>{
      const selected=enabled?MODIFIERS[LIGHTS.indexOf(id)%MODIFIERS.length]:'bare';
      Object.assign(s[id],{modifier:selected,softness:EQUIPMENT[selected].soft});
    });
  }
  if(kind==='gels'){
    resizeSelection(active,count,id=>s[id].gel!=='none',(id,enabled)=>{
      s[id].gel=enabled?GELS[LIGHTS.indexOf(id)%GELS.length]:'none';
    });
  }
  if(kind==='grids') resizeSelection(active,count,id=>s[id].grid,(id,enabled)=>{s[id].grid=enabled;});
}

function kitFieldPatch(key,value) {
  if(key==='modifier') return {modifier:value,softness:EQUIPMENT[value].soft};
  if(key==='source') return {source:value,watts:EQUIPMENT[value].watts};
  return {[key]:value};
}

function exposure(s,id='key') {
  const l=s[id], g=GENRES[s.genre], d=Math.max(.25,distance(l,targetOf(s)));
  const flash=l.source==='strobe' || l.source==='speedlight';
  const fraction=.125*(200/Math.max(1,l.watts))*(d/1.5)**2*(Number(g.f)/5.6)**2*2**(EQUIPMENT[l.modifier].loss-1+(l.grid?.5:0)+(l.gel==='none'?0:.7));
  const stops=Math.round(Math.log2(Math.max(fraction,1/256)));
  const power=stops>0 ? 'Over full power' : stops===0 ? 'Full' : '1/'+2**(-stops);
  return {flash,d,power,fraction:2**stops,settings:[`f/${g.f}`,flash?'1/160 s':'1/125 s',flash?'ISO 100':'ISO 400',s.camera.lens+' mm']};
}

const Scene = (() => {
  const key='lightcraft-v9-active';
  let state=createScene('Bodyscape');
  let storage=true;
  const listeners=new Set();
  try {
    const saved=localStorage.getItem(key);
    if (saved) state=normalize(JSON.parse(saved));
  } catch (error) {
    if (error.name==='SecurityError') storage=false;
  }

  function set(next, reason='scene', persist=true) {
    state=normalize(next);
    if (persist) {
      try {localStorage.setItem(key,JSON.stringify(state));} catch {storage=false;}
    }
    for (const listener of listeners) listener(reason);
  }

  return {
    get:()=>state,
    stored:()=>storage,
    set,
    subscribe:fn=>listeners.add(fn),
    select(genre,style) {
      const previous=state;
      const next=createScene(genre,style);
      const sameGenre=genre===previous.genre;
      if (sameGenre) {
        next.subject={...previous.subject,yaw:next.subject.yaw};
        next.camera={...previous.camera};
        const key=defaultKeyPlacement(next);
        Object.assign(next.key,keyPosition(targetOf(next),key.angle,key.elevation,key.meters));
        for (const id of [...LIGHTS.slice(1),...REFLECTORS,'flag']) {
          for (const axis of ['x','y','z']) next[id][axis]+=next.subject[axis];
        }
      }
      for (const id of LIGHTS) {
        if (sameGenre || (genre!=='Outdoor' && previous[id].source!=='daylight')) {
          next[id].source=previous[id].source;
          next[id].watts=previous[id].watts;
        }
      }
      next.space=previous.space;next.experience=previous.experience;
      set(next);
    },
    edit(id,patch,reason='field',persist=true) {
      const next=copy(state);
      Object.assign(next[id],patch);
      set(next,reason,persist);
    }
  };
})();
