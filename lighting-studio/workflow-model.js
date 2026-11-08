'use strict';

const SHOOT_FIELDS = {aperture:'Aperture',shutter:'Shutter speed',iso:'ISO',lens:'Focal length'};
const SOURCES = ['strobe','speedlight','led','daylight'];
const ACCESSORIES = [...REFLECTOR_SURFACES,'grid','flag',...GELS];
const INVENTORY = [...SOURCES,...MODIFIERS,...ACCESSORIES];
const LIMITS = {width:[1.6,8],depth:[1.6,10],height:[1.4,4]};
const MODIFIER_CLEARANCE = {softbox:.34,umbrella:.48,dish:.24,strip:.45,bare:.15};
const newId = () => globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2);

function shortText(value, limit) {
  return typeof value==='string' ? value.trim().slice(0,limit) : '';
}

function setupSettings(s) {
  return Object.fromEntries(Object.keys(SHOOT_FIELDS).map((key,index)=>[key,exposure(s).settings[index]]));
}

function cleanTestFrame(value) {
  return typeof value==='string' && value.length<=250000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : '';
}

function cleanShootRecord(item) {
  if (!item || typeof item.id!=='string' || !shortText(item.name,80)) throw Error('Choose a valid LightCraft shoot record.');
  const preset={id:item.id,name:shortText(item.name,80),scene:normalize(item.scene)};
  if(item.asShot) {
    try {
      const scene=normalize(item.asShot.scene);
      const defaults=setupSettings(scene);
      const settings=Object.fromEntries(Object.keys(defaults).map(key=>[key,shortText(item.asShot.settings?.[key],24)||defaults[key]]));
      preset.asShot={scene,settings,notes:shortText(item.asShot.notes,420),frame:cleanTestFrame(item.asShot.frame)};
    } catch { /* Keep the planned scene if an older or damaged record has invalid shoot details. */ }
  }
  return preset;
}

function cleanProfile(profile) {
  const id=shortText(profile?.id,100), name=shortText(profile?.name,80);
  if (!id || !name) throw Error('Enter a name for the studio profile.');
  const result={id,name,inventory:{},ratings:{}};
  for(const [key,[min,max]] of Object.entries(LIMITS)){
    const value=profile[key];
    if(!Number.isFinite(value) || value<min || value>max) throw Error(`Enter a ${key} from ${min} to ${max} m.`);
    result[key]=round(value);
  }
  for(const key of INVENTORY) {
    const value=profile.inventory?.[key];
    result.inventory[key]=Number.isFinite(value)?clamp(Math.floor(value),0,MAX_FIXTURES):0;
  }
  for(const key of SOURCES) {
    const rating=profile.ratings?.[key];
    result.ratings[key]=key==='daylight'?0:Number.isFinite(rating)?clamp(rating,1,2400):EQUIPMENT[key].watts;
  }
  return result;
}

function assignKit(items, kinds, stock, field, choose) {
  const result={};
  const available=Object.fromEntries(kinds.map(key=>[key,stock[key]||0]));
  const take=(id,value)=>{result[id]=value;available[value]--;};
  for(const [id,item] of items) if(available[item[field]]>0) take(id,item[field]);
  for(const [id,item] of items) {
    if(result[id]) continue;
    const replacement=choose(item,kinds.filter(key=>available[key]>0));
    if(replacement) take(id,replacement);
  }
  return {result,available};
}

function fitPosition(item, oldSubject, subject, profile, clearance) {
  const dx=item.x-oldSubject.x, dz=item.z-oldSubject.z;
  const maxX=profile.width/2-clearance, maxZ=profile.depth/2-clearance;
  const scale=Math.max(0,Math.min(1,dx ? ((dx>0?maxX:-maxX)-subject.x)/dx : 1,dz ? ((dz>0?maxZ:-maxZ)-subject.z)/dz : 1));
  return {
    x:round(clamp(subject.x+dx*scale,-maxX,maxX)),
    z:round(clamp(subject.z+dz*scale,-maxZ,maxZ)),
    y:round(clamp(item.y+subject.y-oldSubject.y,.05,profile.height-clearance))
  };
}

function planAdaptation(original, profile) {
  const s=copy(original), notes=[], errors=[];
  const oldSubject=original.subject;
  const modelHeight={standing:1.82,seated:1.40,table:1.31};
  const subjectHeight=()=>modelHeight[s.subject.form]*s.subject.scale/100+.06;
  if(subjectHeight()>profile.height && s.subject.form==='standing') {
    s.subject.form='seated';
    notes.push('The standing subject exceeds the ceiling. The preview uses a seated pose.');
  }
  if(subjectHeight()>profile.height) errors.push('The subject model is too tall for this ceiling. Use a shorter subject or a taller room.');
  s.subject.x=round(clamp(oldSubject.x,-profile.width/2+.55,profile.width/2-.55));
  s.subject.z=round(clamp(oldSubject.z,-profile.depth/2+.55,profile.depth/2-.55));
  s.subject.y=round(clamp(oldSubject.y,0,Math.max(0,profile.height-subjectHeight())));
  if(distance(s.subject,oldSubject)>.015) notes.push('The subject moved to clear the walls or ceiling.');

  const active=LIGHTS.filter(id=>original[id].enabled && original[id].power>0).map(id=>[id,original[id]]);
  const sourceKit=assignKit(active,SOURCES,profile.inventory,'source',(l,options)=>{
    const flash=key=>key==='strobe'||key==='speedlight';
    return options.find(key=>flash(key)===flash(l.source)) || options[0];
  });
  if(active.some(([id])=>id==='key') && !sourceKit.result.key) {
    const donor=LIGHTS.slice(1).reverse().find(id=>sourceKit.result[id]);
    if(donor) {
      sourceKit.result.key=sourceKit.result[donor];
      delete sourceKit.result[donor];
    }
  }
  const keep=active.filter(([id])=>sourceKit.result[id]);
  const modifiers=assignKit(keep.filter(([,l])=>l.modifier!=='bare'),MODIFIERS,profile.inventory,'modifier',(l,options)=>
    options.sort((a,b)=>Math.abs(EQUIPMENT[a].soft-EQUIPMENT[l.modifier].soft)-Math.abs(EQUIPMENT[b].soft-EQUIPMENT[l.modifier].soft))[0]);
  if(active.length && !keep.length) errors.push('No available source can replace the planned lights. Add a source to the studio profile.');
  const controls={...profile.inventory};
  for(const [id,old] of active) {
    const l=s[id], label=OBJECTS[id][0], source=sourceKit.result[id];
    if(!source) {
      l.enabled=false;notes.push(label+' disabled because the studio has no remaining light source.');
      continue;
    }
    l.source=source;
    l.watts=profile.ratings[source];
    if(source!==old.source) notes.push(`${label} uses ${EQUIPMENT[source].name.toLowerCase()} in place of ${EQUIPMENT[old.source].name.toLowerCase()}.`);
    else if(l.watts!==old.watts) notes.push(`${label} uses the studio’s ${l.watts} ${source==='led'?'W':'Ws'} rating.`);
    l.modifier=modifiers.result[id]||'bare';
    const neededY=old.y+s.subject.y-oldSubject.y;
    const smaller=MODIFIERS.find(key=>modifiers.available[key]>0 && neededY+MODIFIER_CLEARANCE[key]<=profile.height);
    if(l.modifier!=='bare' && neededY+MODIFIER_CLEARANCE[l.modifier]>profile.height+.12 && smaller) {
      modifiers.available[smaller]--;
      modifiers.available[l.modifier]++;
      l.modifier=smaller;
    }
    if(l.modifier!==old.modifier) {
      l.softness=EQUIPMENT[l.modifier].soft;
      notes.push(`${label} uses ${EQUIPMENT[l.modifier].name.toLowerCase()} in place of ${EQUIPMENT[old.modifier].name.toLowerCase()}.`);
    }
    if(l.grid && controls.grid--<=0) {l.grid=false;notes.push(label+' grid removed because none is available.');}
    if(l.gel!=='none' && controls[l.gel]--<=0) {l.gel='none';notes.push(label+' gel removed because none is available.');}
    const anchor={...old,y:old.y+(targetOf(s).y-s.subject.y)-(targetOf(original).y-oldSubject.y)};
    Object.assign(l,fitPosition(anchor,oldSubject,s.subject,profile,MODIFIER_CLEARANCE[l.modifier]));
    if(distance(old,l)>.025) notes.push(`${label} moved to ${l.y} m high, ${round(distance(l,targetOf(s)))} m from the subject target.`);
    const flash=key=>key==='strobe'||key==='speedlight';
    if(flash(old.source)&&flash(source)) {
      const ratio=(Math.max(.25,distance(l,targetOf(s)))/Math.max(.25,distance(old,targetOf(original))))**2;
      const losses=light=>(EQUIPMENT[light.modifier].loss+(light.grid?.5:0)+(light.gel==='none'?0:.7));
      const power=old.power*ratio*Math.max(1,old.watts)/l.watts*2**(losses(l)-losses(old));
      l.power=round(clamp(power,.5,100));
      if(power>100) notes.push(label+' would need more than full power to match the original estimate. Check exposure on set.');
      else if(Math.abs(l.power-old.power)>1) notes.push(`${label} power adjusted from ${old.power}% to ${l.power}% as a starting estimate.`);
    } else if(source!==old.source || distance(old,l)>.025 || old.watts!==l.watts) {
      notes.push(label+' uses a different position or output. Meter the continuous or available light on set.');
    }
    if(distance(l,targetOf(s))<.45) errors.push(label+' has less than 0.45 m of clearance from the subject target. Choose a larger room or revise the original placement.');
  }

  const bounces=REFLECTORS.filter(id=>s[id].enabled).map(id=>[id,s[id]]);
  const bounceKit=assignKit(bounces,REFLECTOR_SURFACES,profile.inventory,'finish',(_,options)=>options[0]);
  for(const [id,clearance] of [['camera',.23],...REFLECTORS.map(id=>[id,.42]),['flag',.56]]) {
    const o=s[id], old=original[id];
    if(REFLECTORS.includes(id) && o.enabled) {
      const finish=bounceKit.result[id], label=OBJECTS[id][0];
      if(!finish) {
        o.enabled=false;
        notes.push(label+' disabled because no reflector remains available.');
      } else if(o.finish!==finish) {
        o.finish=finish;
        notes.push(label+' changed to '+EQUIPMENT[finish].name.toLowerCase()+'.');
      }
    }
    if(id==='flag' && o.enabled && !controls.flag) {o.enabled=false;notes.push('Flag disabled because none is available.');}
    if(o.enabled===false) continue;
    Object.assign(o,fitPosition(old,oldSubject,s.subject,profile,clearance));
    if(distance(o,old)>.025) notes.push(OBJECTS[id][0]+' moved to fit the room.');
  }
  const cameraDistance=distance(s.camera,targetOf(s,true));
  if(cameraDistance<.8) errors.push('The camera is too close to the subject. Choose a larger room or reposition the original camera.');
  const originalDistance=Math.max(.2,distance(original.camera,targetOf(original,true)));
  if(cameraDistance>=.8 && cameraDistance/originalDistance<.93) {
    const lens=Math.round(clamp(original.camera.lens*cameraDistance/originalDistance,24,105));
    if(lens!==s.camera.lens) {
      s.camera.lens=lens;
      notes.push(`Try ${lens} mm to recover framing at the shorter camera distance. Confirm the change in perspective on set.`);
    }
  }
  return {scene:normalize(s),notes,errors};
}
