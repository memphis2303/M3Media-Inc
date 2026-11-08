'use strict';

const CONCEPT_POSES=[
  ['turned','Three-quarter turn','Rotate away from the camera a few degrees at a time to trace a narrow highlight along the shoulder.'],
  ['chin','Lift the chin','Let the subject choose a comfortable eye line and watch the light move across the collarbone.'],
  ['back','Back to camera','Show the shoulder line and offer a relaxed arm position between frames.'],
  ['detail','Close detail','Move in on the area you agreed to photograph. Keep the rim narrow to emphasize texture.'],
  ['profile','Side profile','Turn toward or away from the stripbox in small steps until the edge separates cleanly.']
];
const GENRE_STUDIES={
  Portrait:[
    ['portrait-seated','Standing Rembrandt portrait','Turn the head toward the key just enough to reveal the lit cheek triangle.'],
    ['portrait-turn','Standing three-quarter turn','Angle the shoulders away and keep the eyes just off-camera. Watch the shadow on the far cheek.'],
    ['portrait-wall','Seated in warm side light','Sit at eye level and let the subject rest their hands naturally. Include the chair and both feet.'],
    ['portrait-stool','Standing three-quarter pose','Turn the shoulders away from camera and bring the face back into the key.'],
    ['portrait-cane','Standing, one hand in a pocket','Keep the weight on one leg, let the free hand hang naturally and frame from head to toe.'],
    ['portrait-step','One easy step forward','Leave space in front of the subject and repeat a short step until the weight shift feels natural.']],
  Headshot:[
    ['headshot-glasses','Straight on with glasses','Raise or feather the source until the reflection clears the pupils. Keep the subject’s eye line level.'],
    ['headshot-turn','Shoulders angled','Turn the shoulders a few degrees, then bring the gaze back toward the camera.'],
    ['headshot-seat','Upright seated posture','Offer a stable chair and let both feet rest. Check the shoulder line before moving in for the headshot.'],
    ['headshot-weight','Relaxed standing stance','Shift weight onto one foot and soften the front knee to release tension in the shoulders.'],
    ['headshot-chin','Chin slightly forward','Ask for a small movement toward the lens, then adjust the chin to keep the neck relaxed.'],
    ['headshot-off-axis','Gaze just off-camera','Give the subject a point near the lens so the eyes stay visible while the gaze shifts.']],
  Fashion:[
    ['fashion-step','Full-length mid-step','Leave room in the direction of movement so the garment’s shape reads at the edge of the frame.'],
    ['fashion-stool','Seated silhouette','Use a stable stool and arrange the jacket, sleeves, and legs so their lines remain visible.'],
    ['fashion-coat','Structured coat pose','Use a grounded stance and check that the arms leave enough space for the coat’s shape to read.'],
    ['fashion-turn','Flowing three-quarter turn','Give the hem room to move, then time the frame as the shoulders and coat settle.'],
    ['fashion-pockets','Hands resting in pockets','Let the elbows relax and use the pocket position to give the garment shape.'],
    ['fashion-lean','Minimal wall lean','Use a small lean and simple background to keep attention on the cut and fit of the clothes.']],
  Maternity:[
    ['maternity-profile','Standing profile','Turn gently into profile and position the key to separate the silhouette from the backdrop.'],
    ['maternity-seat','Supported seated pose','Offer a stable seat and let the subject choose where to rest their hands. Keep takes short.'],
    ['maternity-angle','Standing three-quarter pose','Turn a few degrees toward camera and leave the shoulders and hands relaxed.'],
    ['maternity-step','Gentle step with fabric','Let the subject choose a comfortable pace and leave space to show the full sweep of the gown.'],
    ['maternity-wall','Light wall support','Offer the wall for balance and frame the full stance without asking the subject to lean.'],
    ['maternity-window','Seated near a window','Turn the chair into soft window light and keep the subject’s feet comfortably supported.']],
  Boudoir:[
    ['boudoir-reclined','Under the sheets','Use pillows to support the shoulders and let the subject rest a book in her lap. Light the scene through the sheer curtain.'],
    ['boudoir-bed','On the bed, in lingerie','Lace set, white lace-top stockings or an oversized knit sweater. Lie on the elbows or kneel with one knee drawn up, one hand in the hair, and look at the lens. Keep the camera at bed height.'],
    ['boudoir-couch','On the couch, in lingerie','Kneel or lean over the couch arm with a hand near the lips and the chin lowered. Use a sheer curtain and a floor lamp behind as a soft, bright background. Or perch on the couch arm in an open white shirt, chin on hand, one leg extended.'],
    ['boudoir-window','Standing by the window, in lingerie','Stand just inside the sheer curtain, holding it with one hand, in a nude or cream bra. Let the window glow behind the curtain, expose for the face and turn it slightly into the bounce.'],
    ['boudoir-black','Small studio · black backdrop','Black set, or a bright pink or red lace set with garters for contrast. Sit on a black cube with the legs extended on a diagonal and a hand at the jaw. Keep 1.8 m to the seamless so it stays black.'],
    ['boudoir-brown','Small studio · brown backdrop','Turn the shoulders slightly so the copper satin separates from the brown seamless.'],
    ['boudoir-perch','Perched by the window, open shirt','Sit on the couch arm beside a sheer window, chin on hand, eyes down, one leg extended. Expose for the highlights and let the far wall fall dark.'],
    ['boudoir-seat','On a chair, in lingerie','Turn the chair about 30° to the camera and tilt the shoulders back. Cross the legs, with one hand on the chair back and one at the strap. Heels on, black backdrop or warm room.']],
  Product:[
    ['product-front','Straight-on product shot','Align the camera with the middle of the bottle and turn it slightly to position the reflection.'],
    ['product-angle','Elevated three-quarter view','Raise the camera to reveal the top and use the tray to lead the eye toward the product.'],
    ['product-side','Controlled side reflection','Move the source to the side and use a white card to keep the far edge of the bottle visible.'],
    ['product-pair','Two products on plinths','Separate the bottles in height and depth so both outlines remain readable.'],
    ['product-standing','Standing product presentation','Frame the person from head to toe and place the product near chest height without covering the face.'],
    ['product-seated','Seated lifestyle product portrait','Keep the seated pose and package fully visible. Move the light until the front of the package reads.']],
  Food:[
    ['food-overhead','Low-angle steam study','Keep the full bowl in view and wait for steam to rise through the backlight.'],
    ['food-low','Side-back key and fill','Angle the plate to catch the key and add just enough front fill for the food closest to the camera.'],
    ['food-angle','Overhead plate view','Keep the full rim of the plate in frame and arrange the vegetables into a clear pattern.'],
    ['food-tray','Complete serving arrangement','Use the tray edges to frame both bowls. Leave space around the set so the arrangement reads as a whole.'],
    ['food-chef','Chef at the prep table','Leave enough space to show the chef’s full stance and the plate. Let the face and dish share the key light.'],
    ['food-present','Full-length dish presentation','Ask the chef to hold the plate at a comfortable height and angle it just enough to reveal the dish.']],
  Outdoor:[
    ['outdoor-seat','Seated in open shade','Find a comfortable bench facing open sky and keep bright background patches away from the face.'],
    ['outdoor-backlit','Open shade with flash fill','Place the subject in even shade and bring the fill just close enough to lift the face.'],
    ['outdoor-walk','Walking on a path','Leave room in the direction of travel and choose a stretch with even light and secure footing.'],
    ['outdoor-wall','Standing beside stone','Find a wall that reflects a little light back to the face. Give the subject room to stand comfortably.'],
    ['outdoor-terrace','Seated terrace portrait','Use a stable seat and keep bright background features away from the subject’s outline.'],
    ['outdoor-arch','Framed by an arch','Use the arch to surround the figure and look for open-sky light on the face.']],
  Fitness:[
    ['fitness-lunge','Shallow lunge','Ask the athlete to choose a comfortable range and leave space around their stance.'],
    ['fitness-adaptive','Seated athletic portrait (studio)','Ask how the athlete wants their chair shown and use an edge light to separate the wheels.'],
    ['fitness-stretch','Balanced standing stretch','Let the athlete set their own stretch, then adjust the camera so the hands, feet, and face stay visible.'],
    ['fitness-kettlebell','Standing with a kettlebell','Keep the weight easy to hold and turn the subject so both the posture and the equipment read.'],
    ['fitness-neutral','Neutral athletic stance','Ask the athlete to choose their stance and how they want their prosthesis represented in the frame.'],
    ['fitness-step','Small forward step','Agree on a safe, repeatable step and leave room for the full movement.']],
  Creative:[
    ['creative-turn','Turn into the gels','Turn the face a few degrees to change where the colors meet. Adjust one source at a time.'],
    ['creative-profile','Magenta key and indigo fill','Turn the face a few degrees to adjust where the two colors meet.'],
    ['creative-step','Full-body color blocking','Use wardrobe color on one side and a contrasting gel to separate the other.'],
    ['creative-seat','Seated in mixed color','Use a stable seat and shape warm and cool pools of light around the full pose.'],
    ['creative-complement','Complementary amber and blue','Separate the two sources and check the face for unwanted color overlap.'],
    ['creative-rim','Narrow color rim','Turn the body until the rim outlines the wardrobe while a soft key keeps the face readable.']]
};

const CONCEPT_ASSETS='legacy/assets/';

// Select the files included in this build before rendering a gallery.
const SUPPLIED_BOUDOIR_STUDIES=new Set([
  'boudoir-bed','boudoir-couch','boudoir-window','boudoir-black','boudoir-perch','boudoir-seat'
]);
const BOUDOIR_STANDINS=new Set(['boudoir-reclined','boudoir-brown']);
const STUDY_BRIEFS={
  'portrait-cane':'Standing Rembrandt-style portrait with one hand in a pocket against a brown studio backdrop.',
  'fashion-coat':'Full-length structured coat pose on a charcoal studio backdrop.'
};
const LINGERIE_BRIEFS={
  'boudoir-reclined':'Adult 20–50 in lingerie under white sheets, shoulders on pillows, soft window side light. Low angle at bed height.',
  'boudoir-bed':'Adult 20–50 in lace lingerie and stockings on white linen, on the elbows, camera at bed height, backlit by a sheer window; black and white or warm color.',
  'boudoir-couch':'Adult 20–50 in black lace lingerie kneeling at a gray or brown couch, floor lamp and sheer curtain behind, soft window side light.',
  'boudoir-window':'Adult 20–50 in a nude or cream bra holding a sheer curtain in front of a large window, backlit, white reflector opposite.',
  'boudoir-black':'Adult 20–50 in bright pink lace lingerie seated on a black cube against a black seamless, gridded softbox at 45°.',
  'boudoir-brown':'Adult 20–50 in copper or champagne lingerie against a brown seamless, soft key and a low rear strip.',
  'boudoir-perch':'Adult 20–50 in an open white shirt perched on a couch arm beside a sheer window, strong window side light.',
  'boudoir-seat':'Adult 20–50 in a black cut-out set and heels, seated on an angled chair against black, single side key with fall-off.'
};
const poseSource=id=>'assets/pose-'+id+'.jpg';
const studyFile=id=>SUPPLIED_BOUDOIR_STUDIES.has(id)?'assets/pose-'+id+'-lingerie.jpg':poseSource(id);
const studyFallback=id=>SUPPLIED_BOUDOIR_STUDIES.has(id) && id!=='boudoir-perch'?poseSource(id):'';
const studyBrief=id=>STUDY_BRIEFS[id]||LINGERIE_BRIEFS[id]||'Add a studio frame of an adult aged 20–50.';
const studyBadge=id=>BOUDOIR_STANDINS.has(id)?'<em class="standin-badge">Loungewear reference</em>':'';

// Missing image: try the stand-in, then show the shoot brief for the slot.
document.addEventListener('error',e=>{
  const img=e.target;
  if(!(img instanceof HTMLImageElement) || !img.dataset.slot) return;
  const fallback=img.dataset.fallback;
  if(fallback && !img.dataset.triedFallback){
    img.dataset.triedFallback='1';
    img.src=fallback;
    const badge=document.createElement('em');
    badge.className='standin-badge';
    badge.textContent='Stand-in · replace with a lingerie frame';
    if(img.id==='pose-dialog-image') {$('pose-dialog-slot')?.remove(); img.before(Object.assign(badge,{id:'pose-dialog-slot'}));}
    else img.after(badge);
    return;
  }
  const slot=document.createElement('div');
  slot.className='image-slot';
  const file=studyFile(img.dataset.slot);
  slot.innerHTML=`<strong>IMAGE SLOT</strong><p>${studyBrief(img.dataset.slot)}</p><code>${file}</code>`;
  if(img.id==='pose-dialog-image'){$('pose-dialog-slot')?.remove(); slot.id='pose-dialog-slot'; img.hidden=true; img.before(slot);}
  else img.replaceWith(slot);
},true);
const studyImg=(id,title,lazy)=>`<img src="${studyFile(id)}" data-slot="${id}" data-fallback="${studyFallback(id)}" alt="${title}"${lazy?' loading="lazy"':''}>${studyBadge(id)}`;
const isBodyscapeGuide=s=>s.genre==='Bodyscape' && s.style==='low';

function setupReference(genre,index) {
  if(genre==='Bodyscape'){
    const photos=['bodyscape-one-light-example.jpg','bodyscape-two-light-example.jpg'];
    return {photo:CONCEPT_ASSETS+photos[index],alt:index?'Front-facing portrait with soft key and edge light':'Three-quarter back view with a narrow highlight'};
  }
  const study=GENRE_STUDIES[genre][genre==='Boudoir'?index+4:index];
  return {photo:studyFile(study[0]),fallback:studyFallback(study[0]),slot:study[0],alt:study[1]};
}

function setRecipeForm(s,form) {
  const previous=targetOf(s).y;
  s.subject.form=form;
  const delta=targetOf(s).y-previous;
  for(const id of [...LIGHTS,'camera']) s[id].y=round(clamp(s[id].y+delta,0,4));
}

function editorialRecipes(active) {
  const one=createScene(active.genre,active.style);
  one.subject.skin=active.subject.skin;
  one.space=active.space;
  one.experience=active.experience;
  one.key.enabled=true;
  one.fill.enabled=false;
  one.rim.enabled=false;
  one.reflector.enabled=false;
  one.flag.enabled=false;
  const two=copy(one);
  const title=TECHNIQUES[active.style].name;
  if(isBodyscapeGuide(active)) {
    const aim=targetOf(two);
    Object.assign(two.key,keyPosition(aim,45,30,1.50),{modifier:'softbox',softness:75,grid:false,power:42});
    Object.assign(two.rim,keyPosition(aim,-135,25,1.50),{modifier:'strip',grid:true,softness:25,power:17,enabled:true});
    Object.assign(two.flag,position(.91,1.36,.32),{yaw:-36,enabled:true});
    return [
      {id:'one',scene:one,title:'Dramatic low-key',description:'A single gridded stripbox traces the contour and lets the unlit side fall into shadow.',
        photo:CONCEPT_ASSETS+'bodyscape-one-light-example.jpg',alt:'Three-quarter back view with a narrow highlight tracing the shoulder and back',
        caption:'Narrow rim light and deep camera-side shadows.'},
      {id:'two',scene:two,title:'Two-light editorial',description:'A soft key shapes the subject. A lower-powered stripbox separates the edge and a black flag controls spill.',
        photo:CONCEPT_ASSETS+'bodyscape-two-light-example.jpg',alt:'Front-facing portrait showing a soft main light and a separate edge highlight',
        caption:'Soft front light with a separate rim on the shadow side.'}
    ];
  }
  if(active.genre==='Boudoir' && active.style==='low') {
    setRecipeForm(one,'standing');
    setRecipeForm(two,'standing');
    Object.assign(one.key,keyPosition(targetOf(one),45,30,1.45),{modifier:'softbox',softness:54,grid:true,power:42});
    Object.assign(two.key,keyPosition(targetOf(two),45,30,1.50),{modifier:'softbox',softness:76,grid:false,power:42});
    Object.assign(two.rim,keyPosition(targetOf(two),-135,22,1.55),{enabled:true,grid:true,softness:32,power:17});
    return [
      {id:'one',scene:one,title:'Black backdrop · One light',description:'Feather a gridded softbox from the side and keep its spill off the black seamless.',
        ...setupReference('Boudoir',0),caption:'A single side key with deep shadows.'},
      {id:'two',scene:two,title:'Brown backdrop · Two lights',description:'Use a broad side key and a lower-powered rear stripbox for separation from the brown seamless.',
        ...setupReference('Boudoir',1),caption:'A soft key and subtle rear edge on a warm backdrop.'}
    ];
  }
  if(active.genre==='Outdoor' && active.style==='shade'){
    setRecipeForm(one,'seated');
    Object.assign(two.fill,keyPosition(targetOf(two),-28,14,1.8),
      {enabled:true,source:'speedlight',watts:60,power:18});
  } else if(active.style==='rim' || active.style==='clamshell' || active.style==='gel') {
    two.fill.enabled=true;
    if(two.fill.power===0) two.fill.power=22;
  } else {
    const a=TECHNIQUES[active.style].angle>=0?-135:135;
    Object.assign(two.rim,keyPosition(targetOf(two),a,23,1.65),{enabled:true,grid:true,softness:35,power:17});
  }
  const defaultStyle=GENRES[active.genre].styles[0], defaultLook=active.style===defaultStyle;
  if(defaultLook && active.genre==='Headshot') {
    setRecipeForm(one,'standing');
    setRecipeForm(two,'standing');
  }
  if(defaultLook && active.genre==='Fashion') setRecipeForm(two,'seated');
  if(defaultLook && active.genre==='Maternity') setRecipeForm(one,'standing');
  if(defaultLook && ['Fitness','Product'].includes(active.genre)) Object.assign(two.key,kitFieldPatch('modifier','softbox'));
  const isFill=two.fill.enabled;
  const reference=defaultLook?'AI-generated example of the proposed setup.':
    `Genre reference illustrating ${TECHNIQUES[defaultStyle].name.toLowerCase()}. The diagram shows the selected technique.`;
  const shade=active.genre==='Outdoor' && active.style==='shade';
  return [
    {id:'one',scene:one,title:shade?'Open shade · Available light':title+' with one light',
      description:shade?'Set the subject just inside open shade and use the sky as a broad key.':'Isolate the key to see what the direction and modifier do on their own.',
      ...setupReference(active.genre,0),caption:reference},
    {id:'two',scene:two,title:shade?'Open shade · Flash fill':title+' with two lights',
      description:shade?'Use daylight as the key and add a low-powered off-camera flash near the lens side.':
        isFill?'Add a second source toward the front to lift or color the shadows.':'Add a lower-powered rim light to separate the subject from the background.',
      ...setupReference(active.genre,1),caption:reference}
  ];
}

function editorialPhoto(s) {
  if(!isBodyscapeGuide(s) || !s.key.enabled || s.fill.enabled) return null;
  const lights=kitCounts(s).lights;
  const one=lights===1 && s.key.modifier==='strip' && s.key.grid;
  const two=lights===2 && s.key.modifier==='softbox' && s.rim.enabled && s.rim.modifier==='strip' && s.rim.grid;
  if(!one && !two) return null;
  const example=editorialRecipes(s)[one?0:1];
  return {id:'bodyscape-guide-'+example.id,genre:s.genre,style:s.style,src:example.photo,
    alt:example.alt,note:example.caption,sourceLabel:'Supplied AI-generated guide'};
}

function editorialPlan(s) {
  const lightIds=LIGHTS.filter(id=>s[id].enabled);
  const placed=[s.subject,s.camera,...lightIds.map(id=>s[id]),...(s.flag.enabled?[s.flag]:[])];
  const minX=Math.min(...placed.map(p=>p.x)), maxX=Math.max(...placed.map(p=>p.x));
  const minZ=Math.min(...placed.map(p=>p.z),s.subject.z-2), maxZ=Math.max(...placed.map(p=>p.z));
  const factor=Math.min(69,201/Math.max(.8,maxX-minX),226/Math.max(1,maxZ-minZ));
  const xCenter=(minX+maxX)/2,zCenter=(minZ+maxZ)/2;
  const map=p=>[round(135+(p.x-xCenter)*factor),round(162+(p.z-zCenter)*factor)];
  const [sx,sz]=map(s.subject), [cx,cz]=map(s.camera);
  const backdrop=map({x:s.subject.x,z:s.subject.z-2})[1];
  const lightShapes=lightIds.map(id=>{
    const [x,z]=map(s[id]), a=Math.atan2(sx-x,sz-z)*180/Math.PI;
    const light=s[id], tint=id==='key'?'#eec47a':'#afc9da';
    const strip=light.modifier==='strip', width=strip?35:45;
    const hint=light.grid?'2 4':'6 4';
    return `<path d="M${x} ${z} L${sx-12} ${sz-6} L${sx+12} ${sz+6} Z" fill="${tint}" opacity=".09"/>
      <line x1="${x}" y1="${z}" x2="${sx}" y2="${sz}" stroke="${tint}" stroke-opacity=".63" stroke-dasharray="${hint}"/>
      <g transform="translate(${x} ${z}) rotate(${a})">
        <rect x="${-width/2}" y="-7" width="${width}" height="14" rx="3" fill="#28272b" stroke="${tint}" stroke-width="1.6"/>
        <path d="M${-width/2+4} 2 h${width-8}" stroke="${tint}" opacity=".54"/>
      </g>
      <text x="${clamp(x,35,235)}" y="${z-16}" fill="${tint}" text-anchor="middle" class="plan-label">${OBJECTS[id][0].toUpperCase()}</text>`;
  }).join('');
  let flag='';
  if(s.flag.enabled) {
    const [x,z]=map(s.flag);
    flag=`<rect x="${x-16}" y="${z-4}" width="32" height="8" rx="2" fill="#101012" stroke="#878185" transform="rotate(${s.flag.yaw} ${x} ${z})"/>
      <text x="${clamp(x,40,230)}" y="${z+19}" fill="#bdb8be" text-anchor="middle" class="plan-label">BLACK FLAG</text>`;
  }
  const backdropLabel=s.genre==='Outdoor'?'OPEN SHADE EDGE':isBodyscapeGuide(s)?'BLACK BACKDROP':'BACKDROP';
  const lighting=lightIds.map(id=>OBJECTS[id][0]+' with '+EQUIPMENT[s[id].modifier].name).join('; ');
  return `<svg class="editorial-plan" viewBox="0 0 270 326" role="img" aria-label="Overhead studio plan. ${lighting}. ${s.flag.enabled?'Black flag on the shadow side. ':''}The camera faces the subject.">
    <rect width="270" height="326" fill="#141518"/>
    <path d="${Array.from({length:13},(_,i)=>'M20 '+(45+i*20)+'H250').join(' ')} ${Array.from({length:12},(_,i)=>'M'+(25+i*20)+' 45V286').join(' ')}" stroke="#27272b" stroke-width=".65"/>
    <path d="M34 ${backdrop}H236" stroke="#77747d" stroke-width="2.3"/>
    <text x="135" y="${backdrop-8}" fill="#aaa6ae" text-anchor="middle" class="plan-label">${backdropLabel}</text>
    <line x1="${cx}" y1="${cz}" x2="${sx}" y2="${sz}" stroke="#9c97a4" stroke-dasharray="3 5" stroke-opacity=".65"/>
    ${lightShapes}${flag}
    <ellipse cx="${sx}" cy="${sz+4}" rx="17" ry="8" fill="#69646d" stroke="#aaa4ad"/>
    <circle cx="${sx}" cy="${sz-2}" r="8" fill="#b98f75" stroke="#f3c8a3"/>
    <text x="${sx}" y="${sz+23}" fill="#d8d3d9" text-anchor="middle" class="plan-label">SUBJECT</text>
    <g transform="translate(${cx} ${cz}) rotate(${Math.atan2(sx-cx,cz-sz)*180/Math.PI})">
      <rect x="-12" y="-7" width="24" height="14" rx="3" fill="#c3bec7"/>
      <rect x="-5" y="-12" width="10" height="6" rx="1" fill="#a7a3b0"/>
      <circle r="4" fill="#5b5662"/>
    </g>
    <text x="${cx}" y="${cz+22}" fill="#d8d3d9" text-anchor="middle" class="plan-label">CAMERA</text>
    <path d="M24 309h${factor}" stroke="#aaa6ae" stroke-width="1.3"/>
    <text x="${31+factor}" y="312" fill="#bdb8be" class="plan-label">1 m</text>
  </svg>`;
}

function sameRecipe(a,b) {
  return Object.keys(OBJECTS).every(id=>JSON.stringify(a[id])===JSON.stringify(b[id]));
}

function editorialCard(recipe,index,active) {
  const {scene:s}=recipe;
  const loaded=sameRecipe(s,active);
  const rig=LIGHTS.filter(id=>s[id].enabled).map(id=>{
    const light=s[id];
    if(light.source==='daylight') return 'Key: open sky in shade';
    const target=targetOf(s), angle=Math.round(Math.atan2(target.x-light.x,light.z-target.z)*180/Math.PI);
    const side=angle===0?'centered':Math.abs(angle)+'° camera-'+(angle>0?'left':'right');
    return `${OBJECTS[id][0]}: ${light.grid?'gridded ':''}${EQUIPMENT[light.modifier].name.toLowerCase()}, ${side}, ${light.y} m high, ${fixed(distance(light,target))} m from target`;
  }).join(' · ');
  const pair=recipe.photo?`<figure class="recipe-photo">
    <span class="recipe-image-label">02 / IMAGE REFERENCE</span>
    <img src="${recipe.photo}" alt="${recipe.alt}"${recipe.slot?` data-slot="${recipe.slot}" data-fallback="${recipe.fallback||''}"`:''}>
    ${studyBadge(recipe.slot)}<figcaption>${recipe.caption}</figcaption>
  </figure>`:'';
  const tech=TECHNIQUES[active.style];
  const technique=`<section class="recipe-technique" aria-label="Lighting technique">
    <h3>Lighting technique · ${tech.name}</h3><p>${tech.hint}</p>
    <p class="recipe-sync">Keep the shutter at or below your flash sync speed (about 1/200 s). Stop down or lower the strobe power instead of raising the shutter.</p>
  </section>`;
  return `<article class="card recipe-card">
    <header class="recipe-heading">
      <div class="recipe-kicker"><p class="eyebrow">SETUP 0${index+1}</p>${loaded?'<span>In Studio</span>':''}</div>
      <h2>${recipe.title}</h2>
      <p>${recipe.description}</p>
    </header>
    <div class="recipe-visuals${pair?' has-photo':''}">
      <figure class="recipe-diagram"><span class="recipe-image-label">01 / LIGHT PLACEMENT</span>
        ${editorialPlan(s)}<figcaption>Overhead placement · Camera faces subject</figcaption>
      </figure>
      ${pair}
    </div>
    ${technique}
    ${recipeExposure(s)}
    <div class="recipe-actions">
      <p>${rig}${s.flag.enabled?' · Black flag':''}</p>
      <button class="button primary" type="button" data-apply-recipe="${recipe.id}" aria-label="Apply ${recipe.title}">Apply setup</button>
    </div>
  </article>`;
}

function poseStudyCard([id,title,note],clickable,genre,index) {
  const img=studyImg(id,title,true);
  const preview=clickable?`<button type="button" class="pose-zoom" data-pose-study="${id}" aria-label="View full image: ${title}">
    ${img}<span aria-hidden="true">View full image <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2H2v4m8-4h4v4M2 10v4h4m8-4v4h-4"/></svg></span>
  </button>`:img;
  return `<figure class="card">${preview}<figcaption><strong>${title}</strong><p>${note}</p>${clickable?studyLighting(genre,index):''}</figcaption></figure>`;
}

let visibleStudies=[], visibleStudyIndex=0, visibleGenre='';

function showPoseStudy(index) {
  visibleStudyIndex=(index+visibleStudies.length)%visibleStudies.length;
  const [id,title,note]=visibleStudies[visibleStudyIndex];
  $('pose-dialog-title').textContent=title;
  $('pose-dialog-note').textContent=note;
  $('pose-dialog-position').textContent=`${visibleStudyIndex+1} / ${visibleStudies.length}`;
  const dialogImg=$('pose-dialog-image');
  $('pose-dialog-slot')?.remove();
  dialogImg.hidden=false;
  delete dialogImg.dataset.triedFallback;
  dialogImg.alt=title;
  dialogImg.dataset.slot=id;
  dialogImg.dataset.fallback=studyFallback(id);
  $('pose-dialog-standin').hidden=!BOUDOIR_STANDINS.has(id);
  dialogImg.src=studyFile(id);
  $('pose-dialog-lighting').innerHTML=studyLighting(visibleGenre,visibleStudyIndex);
}

function openPoseStudy(id,genre) {
  const studies=GENRE_STUDIES[genre];
  const index=studies?.findIndex(item=>item[0]===id) ?? -1;
  if(index<0) return;
  visibleStudies=studies;
  visibleGenre=genre;
  showPoseStudy(index);
  $('pose-dialog').showModal();
}

function stepPoseStudy(direction) {
  if(visibleStudies.length) showPoseStudy(visibleStudyIndex+direction);
}

function editorialBody(s) {
  const recipes=editorialRecipes(s), g=GENRES[s.genre], t=TECHNIQUES[s.style], special=isBodyscapeGuide(s);
  const isBodyscape=s.genre==='Bodyscape';
  const studies=isBodyscape?CONCEPT_POSES:GENRE_STUDIES[s.genre];
  const tabletop=['Product','Food'].includes(s.genre);
  const gallery=`<section class="pose-section" aria-labelledby="pose-title">
      <p class="eyebrow">${tabletop?'COMPOSITION STUDIES':'POSE STUDIES'}</p>
      <h2 id="pose-title">${tabletop?'More angles and compositions':'More angles and poses'}</h2>
      <div class="pose-grid${isBodyscape?'':' genre-poses'}">${studies.map((study,index)=>poseStudyCard(study,!isBodyscape,s.genre,index)).join('')}</div>
      ${!isBodyscape?`<p class="field-note">${s.genre==='Boudoir'?'Supplied photographs and two AI-generated loungewear references.':'AI-generated studies of adults aged 20–50.'} Select any image to view the full frame. ${s.genre==='Outdoor'?'Outdoor is the only genre shot outside.':s.genre==='Fitness'?'All fitness frames are shot in a photo studio.':'Shot indoors.'}</p>`:''}
    </section>`;
  const exposureLabels=special?['ISO 100','1/160–1/200 s','f/5.6–f/8','50–85 mm','5000–5600 K']:exposure(s).settings;
  return `<div class="editorial-intro">
      <div><p class="eyebrow">FIELD GUIDE / ${s.genre.toUpperCase()}</p><h2>${special?'Bodyscape lighting guide':s.genre+' lighting guide'}</h2></div>
      <p>Compare both recipes, then load the one you want to work with.</p>
    </div>
    <div class="recipe-grid">${recipes.map((recipe,index)=>editorialCard(recipe,index,s)).join('')}</div>
    <div class="editorial-active" aria-label="Active studio setup">
      <div><p class="eyebrow">ACTIVE STUDIO SETUP</p><p>${summary(s)}</p></div>
      <a class="button" href="#studio">Open active setup in Studio <span aria-hidden="true">→</span></a>
    </div>
    ${gallery}
    <section class="editorial-notes" aria-label="Settings, gear and shoot notes">
      <article class="card content-card"><p class="eyebrow">01 / STARTING EXPOSURE</p><h2>Camera settings</h2>
        <div class="settings">${exposureLabels.map(value=>'<span>'+value+'</span>').join('')}</div>
        <p>${special?'Set a black backdrop about 1.8–2.4 m behind the subject when space allows.':'Use the camera settings as a starting point for the active scene.'} Strobe powers are starting estimates for the stated fixture output. Confirm exposure with a meter or test frame and stay within your flash sync speed.</p>
      </article>
      <article class="card content-card"><p class="eyebrow">02 / GEAR & PLACEMENT</p><h2>Build the set</h2>
        <p>${special?'Start with a gridded 30 × 90 cm stripbox. For the two-light recipe, add a large softbox and a black flag. Start the rim roughly one to one and a half stops below the key.':t.hint}</p>
        <p>${g.pose}</p>
      </article>
      <article class="card content-card"><p class="eyebrow">03 / ON-SET NOTES</p><h2>Direct the shot</h2>
        <p>${g.variation}</p><p>${g.access}</p>
      </article>
    </section>
    ${special?`<div class="editorial-source"><p>The supplied V8 guide labels its images as AI-generated editorial illustrations. The diagrams here show the positions loaded by each recipe.</p>
      <a href="${CONCEPT_ASSETS}bodyscape-premium-guide.png" class="button compact">Open supplied image guide</a></div>`:''}`;
}
