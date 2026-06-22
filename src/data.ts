import { PromptTemplate } from './types';

export const CORRECT_PIN = '2001';
export const PIN_SESSION_KEY = 'gs_unlocked';

export const DEFAULT_PROMPT_LIBRARY: PromptTemplate[] = [
  {
    type: 'image',
    cat: 'Portrait',
    title: 'Realistic close-up portrait',
    text: 'A close-up portrait of [subject] with [hair] and [expression], wearing [wardrobe], in [setting], soft directional light from the [left/right], shot on an 85mm f/1.4 lens, shallow depth of field, photorealistic with natural skin texture and visible pores'
  },
  {
    type: 'image',
    cat: 'Portrait',
    title: 'Full-body / fashion',
    text: 'A full-body photograph of [subject] wearing [outfit], [pose], standing in [setting] during [time of day], soft natural light, editorial fashion photography, sharp focus, natural proportions'
  },
  {
    type: 'image',
    cat: 'Scene',
    title: 'Cinematic scene',
    text: '[subject] [action] in [environment] at [time of day], moody [color] lighting with volumetric light beams, cinematic color grade, shot on a 35mm lens, shallow depth of field, subtle film grain'
  },
  {
    type: 'image',
    cat: 'Scene',
    title: 'Establishing / landscape',
    text: 'A wide photograph of [location] at [time of day], with [key feature] in the foreground, atmospheric haze, dramatic natural light, deep focus, landscape photography, richly detailed'
  },
  {
    type: 'image',
    cat: 'Stylized',
    title: 'Concept / fantasy',
    text: '[subject] reimagined as [concept], set in [environment], dramatic rim lighting, intricate detail, [art style] concept art, [color] palette, epic atmosphere'
  },
  {
    type: 'image',
    cat: 'Consistency',
    title: 'Same-character anchor',
    text: 'The same character as before — keep these identity anchors consistent: [face shape], [hair], [eye color], [distinguishing feature]. New scene: [setting], [action]. Photorealistic, consistent face.'
  },
  {
    type: 'image',
    cat: 'Photoreal',
    title: 'Photoreal · natural-light portrait',
    text: 'A photograph of [subject], [expression], in [setting]. Shot on a Sony A7 IV with an 85mm f/1.4 lens, shallow depth of field, soft natural window light. Photorealistic, sharp focus, visible skin pores and fine texture, natural color, candid'
  },
  {
    type: 'image',
    cat: 'Photoreal',
    title: 'Photoreal · B&W editorial (Lindbergh)',
    text: 'A black and white photograph of [subject], honest unposed expression, plain backdrop, in the raw editorial portrait style of Peter Lindbergh. Shot on medium format film, soft directional light, natural skin with visible texture and imperfections, wide tonal range, fine grain'
  },
  {
    type: 'modifier',
    cat: 'Photoreal',
    title: 'Realism booster (append)',
    text: 'photorealistic, sharp focus, natural skin texture with visible pores, True-to-life color, shot on [camera] with [lens] lens, natural [lighting] light'
  },
  {
    type: 'image',
    cat: 'Artist style',
    title: 'Artist style · blended',
    text: '[subject], [scene], in the combined style of [artist 1] and [artist 2], [medium such as comic-book ink or watercolor], bold linework, [color] palette, dramatic composition'
  },
  {
    type: 'video',
    cat: 'LTX 2.3',
    title: 'LTX cinematic shot (T2V)',
    text: '[Subject] [specific action with a concrete motion verb] in [setting]. [Lighting and atmosphere]. The camera [plain-language move, e.g. slowly dollies from behind the subject to the front]. Sound: [ambient room/outdoor tone], [specific sound effects], [music or dialogue]. Authentic textures, natural directional light.'
  },
  {
    type: 'video',
    cat: 'LTX 2.3',
    title: 'LTX animate (I2V)',
    text: '[One specific motion of the subject], [secondary motion — hair, fabric, light shifting]. The camera [plain-language move]. Sound: [ambient tone], [specific effects], [any music]. Describe only the motion, light changes and sound — not the static scene.'
  },
  {
    type: 'video',
    cat: 'Motion (I2V)',
    title: 'Subtle natural motion',
    text: '[subject] [one small natural motion], camera slowly pushes in, [ambient detail] drifts gently, soft natural lighting, calm and steady pacing'
  },
  {
    type: 'edit',
    cat: 'Edit',
    title: 'Wardrobe change',
    text: 'Keep the face, pose, and background unchanged. Change [current clothing] to [new clothing]. Match the original lighting and shadows.'
  },
  {
    type: 'edit',
    cat: 'Edit',
    title: 'Background swap',
    text: 'Keep the subject exactly as-is. Replace the background with [new background]. Blend the lighting, color temperature, and shadows naturally.'
  },
  {
    type: 'modifier',
    cat: 'Lighting',
    title: 'Golden hour',
    text: 'golden hour, warm directional sunlight, long soft shadows, gentle glow'
  },
  {
    type: 'modifier',
    cat: 'Lighting',
    title: 'Neon / moody',
    text: 'neon accent lighting, colored rim light, moody high contrast, cinematic shadows'
  }
];

export const PE_CONVO =
  "You are an expert prompt engineer collaborating with the user to craft the best possible prompt for a specific generation model. How you work: 1) If the user's idea is vague or missing important details (subject specifics, setting, mood, or style), ask 1-2 SHORT clarifying questions first and stop — do not write a prompt yet. 2) Once you have enough, you may give one short sentence of guidance, then output the final prompts clearly labelled, each on its own line, in EXACTLY this format:\nPROMPT: <the optimized prompt>\nVARIATION A: <a meaningfully different take>\nVARIATION B: <another different take>\n3) If the user asks to adjust anything ('moodier', 'wider shot', 'add rain'), revise and re-output in the same labelled format. 4) Keep commentary minimal — the prompts are the product. Never wrap prompts in quotes or markdown. ";

const peSys = (g: string) => PE_CONVO + g;

export const PE_SYSTEM_PROMPTS: Record<string, string> = {
  aurora: peSys(
    "MODEL: FLUX / Aurora (image). Write each prompt as a single flowing natural-language description, NOT a comma-separated tag list. Order it: subject → action/pose → setting → lighting → camera. For photorealism, name a lens and/or film stock (e.g. 'shot on 85mm f/1.4', 'Fujifilm X-T5') and add 'visible skin pores, vellus hair' to avoid waxy AI skin. Aim for 30-80 words. Avoid contradictory directions like 'wide-angle close-up'. If the user is generating on Flux (especially with a LoRA) and fine detail or anatomy matters, you may also suggest generation settings: raise inference steps to ~36-45 (slower but sharper) and keep guidance scale around 3-4. Note that Flux's base model is weak on explicit anatomy, so a single close subject works better than multiple interacting figures."
  ),
  zimage: peSys(
    "MODEL: Z-Image Turbo (image, Tongyi). Write a detailed natural-language description and front-load the subject (and any on-image text) at the very start. CRITICAL: Z-Image ignores negative prompts — phrase EVERY constraint positively (write 'clean seamless backdrop, sharp focus' NOT 'no clutter, not blurry'). Name the medium explicitly (camera/lens or film stock, e.g. 'shot on Hasselblad X2D, 80mm' or 'Kodak Portra 400 film grain'). Always specify lighting — it's Z-Image's biggest strength (volumetric, rim light, golden hour, chiaroscuro). Add texture words ('skin pores, fabric detail, film grain') to avoid a plastic look. Keep to 3-5 strong visual concepts in one style family; never mix contradictory styles. Z-Image renders text accurately, so put any sign/poster text in quotes."
  ),
  wan26t2v: peSys(
    "MODEL: Wan (image). Natural-language description, specific and concrete (avoid bare tag dumps). Cover: subject, scene/environment, style, lighting, and quality. Be vivid but coherent."
  ),
  qwen2: peSys(
    "MODEL: Qwen Image 2.0 (EDIT). Write an instruction, not a description. State clearly: what to KEEP unchanged, what to CHANGE, and constraints (match lighting, preserve identity). Be surgical and specific."
  ),
  qwen: peSys(
    "MODEL: Qwen (EDIT). Write an edit instruction: what to change, what to preserve, desired outcome. Specific and direct."
  ),
  wan27: peSys(
    "MODEL: Wan 2.7 (EDIT). Instruction style: state the subject, the precise change, what to preserve, and the visual style. Be explicit."
  ),
  fluxkontext: peSys(
    "MODEL: Flux Kontext (EDIT). Use the form 'Keep [what stays unchanged]. Change [what to edit]. Ensure [style/lighting constraints].' Flux Kontext excels at preserving identity while making targeted edits."
  ),
  aurora_i2v: peSys(
    "MODEL: Aurora image-to-video. Describe MOTION, not appearance (the still already defines looks). Order: subject motion → camera move → mood/pacing. Use cinematic camera verbs ('slow push in', 'gentle parallax', 'subject turns to camera'). Keep under ~80 words."
  ),
  seedance15t2v: peSys(
    "MODEL: Seedance text-to-video. Order: subject → one clear action (present tense) → camera → style. One main movement per shot. Vivid, physical language. Under ~100 words."
  ),
  ltx23: peSys(
    "MODEL: LTX 2.3 (Lightricks video — T2V/I2V/extend with NATIVE AUDIO). Write the prompt as a flowing cinematic NARRATIVE in prose — never labelled fields like 'Subject:/Camera:'. Structure first, style second: give a clear subject, ONE specific action with concrete motion verbs ('hands moving with practiced precision', not 'cooking'), and the setting; then layer lighting and style words last. Describe the camera move in plain language, usually near the end ('the camera slowly dollies from behind the subject to in front'). CRUCIAL: LTX generates sound natively — explicitly describe the audio: ambient room tone, specific sound effects, and any music or dialogue (e.g. 'the strong thud of the hammer, soft country blues from an old gramophone'). Add realism cues (natural directional light, authentic skin texture). If animating from an image (I2V), describe ONLY the motion, light changes and audio — do NOT redescribe what is already in the frame. Keep to one coherent beat."
  ),
  seedance_i2v: peSys(
    "MODEL: Seedance image-to-video. Describe the motion, camera behaviour, emotional tone and visual style. Seedance handles bold, expressive motion well. Describe motion not appearance. Under ~100 words."
  ),
  wan22spicy_i2v: peSys(
    "MODEL: Wan 2.2 image-to-video. Lead with subject + motion, then camera. Pick ONE clear motion — avoid complex multi-action. Use motion-intensity words (subtle/gentle, smooth/flowing, dynamic/sweeping). Under ~60 words."
  ),
  ltx23spicy: peSys(
    "MODEL: LTX 2.3 Spicy image-to-video with synchronized audio. Describe ONE clear action/motion plus the camera move, and explicitly describe any audio you want (e.g. 'soft ambient music', 'waves', 'breathing') since this model generates sound. Keep motion focused — one action per prompt. Under ~60 words."
  ),
  wan27spicy_i2v: peSys(
    "MODEL: Wan 2.7 image-to-video. Supports a short arc: opening motion → development → resolution. Order subject → motion → camera → scene. Include camera work and clear motion-intensity. Under ~100 words."
  ),
  aurora_extend: peSys(
    "MODEL: Aurora video EXTEND. Describe what happens NEXT as a natural continuation: follow-on action, camera movement, mood. Match the original's style. Phrases like 'continues into', 'camera pulls back to reveal'. Under ~80 words."
  ),
  wan27extend: peSys(
    "MODEL: Wan 2.7 video EXTEND. Describe what happens next: motion, camera, atmosphere, scene development. Specific and directional, continuing the prior mood. Under ~80 words."
  ),
  wan22spicy_extend: peSys(
    "MODEL: Wan 2.2 video EXTEND. Keep it simple — one or two clear continuation actions, matching the prior shot's mood. Direct, under ~50 words."
  )
};

export const DIRECTOR_SYSTEM = `You are a hidden film director's eye watching a roleplay story. You NEVER speak to the user and NEVER write story prose. Your only job: look at the latest story beat and decide whether it warrants a new storyboard frame (a single image), then output prompts.

Set FRAME: yes if ANY of these just appeared in the beat — a NEW character, a NEW setting/location, or a WARDROBE change on any character. If the director forced a frame, FRAME is always yes. Otherwise FRAME: no.

When multiple triggers occur, choose ONE subject by this strict priority: (1) a wardrobe change, (2) a new female character, (3) a new male character, (4) the current action happening.

If FRAME: yes, write:
- IMAGE_PROMPT: a vivid {MODEL} text-to-image prompt depicting that exact moment, grounded ONLY in the story text. CRITICAL RULE: DO NOT invent details, themes, or setting elements that are not explicitly described in the beat. DO NOT summarize the story. Instead, write a strictly visual literal description of who is present, what they look like, wardrobe, setting, lighting, mood, and camera framing based ONLY on the current beat. {MODELGUIDE}
- VIDEO_PROMPT: a short Wan 2.2 image-to-video prompt describing the MOTION to animate that image (subject motion first, then camera). Describe motion, not appearance.
- CAST: for any NEW character or wardrobe change, one line each: "Name — sex, approx age, hair, build, distinguishing features | wardrobe: ...". Use "none" if nothing changed.

Output ONLY this exact format and nothing else:
FRAME: yes
REASON: wardrobe|new-female|new-male|action|none
IMAGE_PROMPT: ...
VIDEO_PROMPT: ...
CAST: ...`;

export function directorModelGuide(modelId: string): string {
  const id = modelId || '';
  if (id.includes('z-image')) return 'Positive descriptions only (no negatives); name the medium, lighting, and textures.';
  if (id.includes('chroma')) return 'Front-load photographic language ("a photograph of..."), name a camera/lens and the lighting, add natural skin texture; avoid words like illustration, cartoon, or render.';
  if (id.includes('flux')) return 'Write clear, detailed natural-language prose — Flux follows full sentences well. Name lighting, composition, and mood; avoid keyword spam.';
  if (id.includes('aurora') || id.includes('grok')) return 'Concise, vivid natural-language description of subject, setting, and mood (note: this model is content-moderated, so keep it non-explicit).';
  if (id.includes('wan')) return 'Describe the scene plainly: clear subject, wardrobe, setting, and lighting.';
  return 'Write a vivid natural-language scene description: subject, wardrobe, setting, lighting, and mood.';
}
