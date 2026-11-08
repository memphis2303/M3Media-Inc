'use strict';

const TECHNIQUES = {
  rembrandt: {name:'Rembrandt', angle:45, elevation:30, modifier:'softbox', fill:14, hint:'Raise the key and move it sideways until the nose and cheek shadows meet, leaving a small triangle of light on the far cheek.'},
  loop: {name:'Loop', angle:32, elevation:21, modifier:'softbox', fill:24, hint:'Look for a short nose shadow that angles toward the cheek and stays separate from the cheek shadow.'},
  butterfly: {name:'Butterfly', angle:0, elevation:38, modifier:'dish', fill:10, hint:'Center the key over the lens and look for a small, symmetrical shadow beneath the nose.'},
  clamshell: {name:'Clamshell', angle:0, elevation:34, modifier:'softbox', fill:40, hint:'Place the main source above the face and bounce light up from below to lift the shadows.'},
  split: {name:'Split', angle:90, elevation:8, modifier:'bare', fill:4, hint:'Bring the key level with the subject and look for a clear division between lit and shaded sides.'},
  rim: {name:'Rim / backlight', angle:137, elevation:24, modifier:'strip', fill:22, hint:'Aim from behind the subject toward the shoulder or edge. Shield the lens from spill.'},
  high: {name:'High key', angle:25, elevation:22, modifier:'umbrella', fill:55, hint:'Use broad sources and a pale background. Check that light surfaces retain detail.'},
  low: {name:'Low key', angle:78, elevation:13, modifier:'strip', fill:3, hint:'Feather a narrow source across the subject and keep its spill off the background.'},
  short: {name:'Short', angle:58, elevation:26, modifier:'softbox', fill:12, yaw:-28, hint:'Turn the subject so the cheek farther from the camera faces the key and the nearer cheek stays in shadow.'},
  broad: {name:'Broad', angle:38, elevation:18, modifier:'softbox', fill:34, yaw:25, hint:'Turn the subject until the cheek most visible to the camera catches the key.'},
  shade: {name:'Open shade', angle:35, elevation:26, modifier:'umbrella', fill:38, hint:'Face the open sky near the edge of shade and check for unwanted patches of direct sun.'},
  gel: {name:'Two-tone gels', angle:45, elevation:22, modifier:'dish', fill:42, hint:'Start with the colored sources independently. Check how their colors mix where the beams overlap.'}
};

const GENRES = {
  Portrait: {title:'A portrait in shaped light', styles:['rembrandt','loop','split','short','broad','butterfly','clamshell','rim','high','low'], skin:'deep', form:'standing', f:'5.6', lens:75,
    pose:'Invite the subject to settle their weight, then direct the eyes and chin a little at a time.',
    variation:'Try a seated subject or a standing portrait. With consent, let the subject choose what expression and framing feel like them.',
    access:'Offer spoken or visual cues, a stable chair and breaks. Bring the light to the subject if moving is difficult.'},
  Headshot: {title:'A professional headshot with an open gaze', styles:['loop','clamshell','butterfly','rembrandt','broad','high'], skin:'light', form:'seated', f:'5.6', lens:85,
    pose:'Relax the shoulders and bring the forehead slightly toward the lens. Try both direct and off-camera eye lines.',
    variation:'Try different camera heights for a seated subject, and check reflections if the subject wears glasses.',
    access:'Provide a chair with back support. Ask what instructions, breaks and feedback the subject prefers.'},
  Fashion: {title:'Edge light for a tailored silhouette', styles:['rim','high','butterfly','gel','split'], skin:'brown', form:'standing', f:'8', lens:35,
    pose:'Give the garment room to fall naturally. Try a relaxed stance and a gentle turn so the fabric catches the edge light.',
    variation:'Include different body proportions and gender expressions. Fit the garment to the subject and check the frame with mobility aids in view.',
    access:'Give the model a private changing area and offer stable alternatives to standing poses.'},
  Maternity: {title:'A seated maternity portrait', styles:['broad','loop','rim','high'], skin:'brown', form:'seated', f:'5.6', lens:55,
    pose:'Offer a stable seat and let the subject choose a comfortable angle and hand position.',
    variation:'Try a loose garment, a side view or a frame that includes a partner when invited.',
    access:'Plan short takes, offer water and breaks, and avoid asking the subject to hold a tiring pose.'},
  Bodyscape: {title:'A study in shape and texture', styles:['low','split','rim'], skin:'tan', form:'standing', f:'8', lens:85,
    pose:'Try a close crop of a clothed shoulder or forearm and shift the key until the texture becomes visible.',
    variation:'Compare fabric, visible scars or other details only when the subject wants to include them. Try several bodies and crops.',
    access:'Agree on the crop and wardrobe before shooting. Offer a seated position and show the subject test frames.'},
  Boudoir: {title:'Lingerie portraits in low light', styles:['low','short','rim','clamshell'], skin:'light', form:'seated', f:'4', lens:70,
    pose:'Offer a robe between looks. Work through the sheets, the bed, the couch, a chair, the window and two small-studio backdrops (black and brown), and let the subject direct how much is visible.',
    variation:'Models are adults aged 20–50. Wardrobe is lingerie chosen by the subject: black lace for the black backdrop, copper or cream satin for the brown. Vary body types and skin tones.',
    access:'Small studio (about 3 × 4 m): keep the subject 1.5–2 m from the seamless, flag the spill and use a closed set. Agree on boundaries, image review and storage before shooting, and ask before adjusting clothing or pose.'},
  Product: {title:'Soft reflections on glass', styles:['high','low','rim','split'], skin:'medium', form:'table', f:'8', lens:60,
    pose:'Raise the item to a comfortable working height and rotate it until the reflection outlines its shape.',
    variation:'Compare polished glass with matte packaging. Reposition white cards until the highlight reads clearly.',
    access:'Keep the table adjustable, leave clear floor space and secure cables away from the working area.'},
  Food: {title:'Backlight for texture and steam', styles:['rim','split','high','low'], skin:'medium', form:'table', f:'5.6', lens:55,
    pose:'Rotate the plate to catch the side-back light. Use a low camera angle for steam or move higher for plating.',
    variation:'Try glossy and matte dishes and recipes from different food traditions. Keep styling choices appropriate to the dish.',
    access:'Keep hot items on a stable surface. Check reach and camera clearance before placing food.'},
  Outdoor: {title:'A portrait at the edge of open shade (the only outdoor genre)', styles:['shade','loop','rim'], skin:'deep', form:'standing', f:'4', lens:65,
    pose:'Turn toward the open sky while keeping direct sun off the face. Try a seated version near an accessible path.',
    variation:'Compare different skin tones in the same spot. Check the direction of the light and retain natural skin texture in the edit.',
    access:'Confirm route surfaces, shade, seating and a way to reach the location without stairs if needed.'},
  Fitness: {title:'Hard side light for an athletic portrait in the photo studio', styles:['split','rim','low','high'], skin:'brown', form:'standing', f:'8', lens:42,
    pose:'Ask the athlete to demonstrate a comfortable stance or movement. Use repeated short takes to catch the shape.',
    variation:'Feature different body types and adaptive athletes. Ask how the athlete wants their equipment and movement represented.',
    access:'Agree on a safe range of motion and clear a route around the equipment. Use an audible or visual cue the athlete prefers.'},
  Creative: {title:'Color contrast with two gelled lights', styles:['gel','rim','split','low','high','butterfly','clamshell'], skin:'deep', form:'standing', f:'5.6', lens:55,
    pose:'Try a simple silhouette first, then add a turn of the head to reveal the color on the far cheek.',
    variation:'Try color combinations on varied skin tones and fabrics, then check where mixed light desaturates important details.',
    access:'Discuss light sensitivity beforehand and offer a steady-light setup with an agreed cue before changing lights.'}
};

const EQUIPMENT = {
  strobe: {name:'Studio strobe', group:'Source', watts:200, detail:'Flash output in watt-seconds. Useful for freezing movement and working at smaller apertures.'},
  speedlight: {name:'Speedlight', group:'Source', watts:60, detail:'Compact flash for smaller spaces. Effective output varies with zoom and modifier.'},
  led: {name:'Continuous LED', group:'Source', watts:100, detail:'See shadows as you work. Exposure depends on fixture output, beam and shutter speed.'},
  daylight: {name:'Window / daylight', group:'Source', watts:0, detail:'Use the open sky or a window as a broad source and meter the available light on location.'},
  softbox: {name:'Softbox', group:'Modifier', soft:66, loss:1, detail:'Softens the transition into shadow while keeping spill fairly controlled.'},
  umbrella: {name:'Umbrella', group:'Modifier', soft:88, loss:1.2, detail:'Provides wide coverage for groups, full-length subjects or a bright background.'},
  dish: {name:'Beauty dish', group:'Modifier', soft:36, loss:.6, detail:'Defined shadows with a gradual edge when placed close to the subject.'},
  strip: {name:'Stripbox', group:'Modifier', soft:49, loss:1.2, detail:'Long and narrow, useful for edge highlights and controlled reflections.'},
  bare: {name:'Bare reflector', group:'Modifier', soft:5, loss:0, detail:'A small, directional source with a harder shadow edge.'},
  white: {name:'White reflector', group:'Bounce', detail:'Soft, neutral bounce for lifting shadows.'},
  silver: {name:'Silver reflector', group:'Bounce', detail:'A stronger, more directional return than white.'},
  gold: {name:'Gold reflector', group:'Bounce', detail:'Adds warm bounce without another powered source.'},
  grid: {name:'Grid', group:'Control', detail:'Narrows the beam to contain spill. The effective spread depends on the grid angle.'},
  flag: {name:'Black flag', group:'Control', detail:'Blocks selected light or absorbs bounce on the shadow side.'},
  warm: {name:'Amber gel', group:'Gel', rgb:[1,.60,.31], detail:'Warms a source for an amber highlight or mixed-color setup.'},
  rose: {name:'Magenta gel', group:'Gel', rgb:[1,.26,.64], detail:'Adds a saturated magenta cast.'},
  blue: {name:'Indigo gel', group:'Gel', rgb:[.28,.43,1], detail:'Adds a cool, saturated fill or edge.'},
  cyan: {name:'Cyan gel', group:'Gel', rgb:[.22,.84,1], detail:'Adds a cool blue-green accent.'},
  green: {name:'Green gel', group:'Gel', rgb:[.35,1,.32], detail:'Adds a saturated green accent for color separation.'},
  red: {name:'Red gel', group:'Gel', rgb:[1,.18,.22], detail:'Adds a deep red accent or background wash.'}
};

const SKIN = {light:['Light','#efc1a2'], medium:['Medium light','#d79b76'], tan:['Tan','#b57353'], brown:['Brown','#8f513b'], deep:['Deep','#593225']};
const OBJECTS = {key:['Key light','◉'],fill:['Fill light','◉'],rim:['Rim light','◉'],subject:['Subject','◍'],camera:['Camera','▣'],reflector:['Reflector','◈'],flag:['Flag','◧']};
const MAX_FIXTURES=8;
const MAIN_LIGHTS=['key','fill','rim'];
const LIGHTS=[...MAIN_LIGHTS,...Array.from({length:MAX_FIXTURES-MAIN_LIGHTS.length},(_,i)=>'light-'+(i+4))];
const REFLECTORS=['reflector',...Array.from({length:MAX_FIXTURES-1},(_,i)=>'reflector-'+(i+2))];
const MODIFIERS=['softbox','umbrella','dish','strip'];
const GELS=Object.keys(EQUIPMENT).filter(id=>EQUIPMENT[id].group==='Gel');
const REFLECTOR_SURFACES=['white','silver','gold'];
for(const [i,id] of LIGHTS.entries()) if(i>=3) OBJECTS[id]=['Light '+(i+1),'◉'];
for(const [i,id] of REFLECTORS.entries()) if(i>0) OBJECTS[id]=['Reflector '+(i+1),'◈'];

const MOODS = {native:['Genre default',null],soft:['Soft / open','loop'],dramatic:['Dramatic / low key','low'],editorial:['Editorial / sculpted','short'],bright:['Bright / high key','high'],silhouette:['Silhouette / edge','rim'],color:['Colored light','gel']};

const PHOTOS = [
  ['portrait','Portrait','rembrandt','A deep-skinned adult with short natural hair in a charcoal blazer against a tobacco-brown backdrop.','Check the small lit patch below the eye on the shadow side.'],
  ['fashion','Fashion','rim','An adult in a cobalt suit with a bright edge around the garment.','Watch how edge light separates the suit from the background.'],
  ['maternity','Maternity','broad','A pregnant adult wearing a rust gown, seated against a clay backdrop.','Notice how the broad source wraps across the visible cheek.'],
  ['bodyscape','Bodyscape','low','A close crop of a clothed shoulder and arm against a dark background.','The narrow highlight reveals the texture while most of the frame stays dark.'],
  ['product','Product','high','An amber glass bottle against a bright ivory background.','Use the long bright reflections to judge the size and placement of the source.'],
  ['food','Food','rim','Glazed pears on a ceramic plate with light catching their edges.','Place the key behind the dish to reveal surface detail and steam.'],
  ['butterfly','Portrait','butterfly','A curly-haired adult against an olive background.','Check for the small centered shadow under the nose.'],
  ['clamshell','Headshot','clamshell','A deep-skinned adult in a white shirt against lavender.','Compare the shadows beneath the chin and around the eyes.'],
  ['short','Portrait','short','A freckled, red-haired adult turned away from the light.','The farther cheek catches the key while the cheek nearest the camera stays darker.'],
  ['high','Fashion','high','An adult in an ivory suit in a bright white studio.','Keep texture in the ivory fabric while the background stays bright.'],
  ['creative','Creative','gel','An adult with a pale buzz cut and a purple overshirt lit by magenta and indigo light.','Notice where the two colors mix across the face.']
].map(([id,genre,style,alt,note]) => ({id,genre,style,alt,note,src:'assets/'+id+'.jpg'}));
