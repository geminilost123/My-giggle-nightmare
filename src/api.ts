import { LoRA } from './types';

// Registry of supported models
export interface ModelRegistryEntry {
  cat: 't2img' | 't2v' | 'edit' | 'img2img' | 'i2v' | 'extend' | 'v2v';
  label: string;
  provider: 'wavespeed' | 'xai-video' | 'xai-image' | 'atlas';
  path: string;
  price?: number;
  pricePerS?: number;
  verified: boolean;
  lora?: boolean;
  loraBase?: string;
  durations?: number[];
  resolutions?: string[];
  timeout?: number;
  buildBody: (params: {
    prompt: string;
    aspectRatio?: string;
    resolution?: string;
    steps?: number;
    guidance?: number;
    loras?: { path: string; scale: number }[];
    image?: string;
    video?: string;
    duration?: number;
  }) => any;
}

export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // ─────────── TEXT-TO-IMAGE ───────────
  'aurora-simple': {
    cat: 't2img',
    label: 'Aurora Simple · xAI [Grok Key]',
    provider: 'xai-image',
    path: 'grok-imagine-image',
    price: 0.02,
    verified: true,
    buildBody: p => ({
      model: 'grok-imagine-image',
      prompt: p.prompt,
      n: 1,
      response_format: 'b64_json',
      aspect_ratio: p.aspectRatio || '1:1'
    })
  },
  'aurora-quality': {
    cat: 't2img',
    label: 'Aurora Quality · xAI [Grok Key]',
    provider: 'xai-image',
    path: 'grok-imagine-image-quality',
    price: 0.05,
    verified: true,
    buildBody: p => ({
      model: 'grok-imagine-image-quality',
      prompt: p.prompt,
      n: 1,
      response_format: 'b64_json',
      aspect_ratio: p.aspectRatio || '1:1'
    })
  },
  'atlas-grok-quality': {
    cat: 't2img',
    label: 'Aurora Quality · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'xai/grok-imagine-image-quality/text-to-image',
    price: 0.05,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, enable_safety_checker: false })
  },
  'atlas-grok-simple': {
    cat: 't2img',
    label: 'Aurora Simple · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'xai/grok-imagine-image/text-to-image',
    price: 0.02,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, enable_safety_checker: false })
  },
  'z-image-turbo': {
    cat: 't2img',
    label: 'Z-Image Turbo · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'z-image/turbo',
    price: 0.01,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, enable_safety_checker: false })
  },
  'z-image-lora': {
    cat: 't2img',
    label: 'Z-Image Turbo · WaveSpeed · LoRA [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/z-image/turbo-lora',
    price: 0.01,
    verified: true,
    lora: true,
    loraBase: 'Z-Image',
    buildBody: p => {
      const b: any = {
        prompt: p.prompt,
        size: wsSize(p.aspectRatio, p.resolution),
        seed: -1,
        enable_base64_output: false,
        enable_safety_checker: false
      };
      if (p.loras && p.loras.length) {
        b.loras = p.loras.slice(0, 3).map(l => ({ path: l.path, scale: Number(l.scale) || 1 }));
      }
      return b;
    }
  },
  'flux-lora': {
    cat: 't2img',
    label: 'Flux Dev · WaveSpeed · LoRA [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/flux-dev-lora',
    price: 0.015,
    verified: true,
    lora: true,
    loraBase: 'Flux',
    buildBody: p => {
      const b: any = {
        prompt: p.prompt,
        size: wsSize(p.aspectRatio, p.resolution),
        num_inference_steps: p.steps && p.steps > 0 ? p.steps : 28,
        guidance_scale: p.guidance != null ? p.guidance : 3.5,
        num_images: 1,
        seed: -1,
        output_format: 'png',
        enable_base64_output: false,
        enable_safety_checker: false
      };
      if (p.loras && p.loras.length) {
        b.loras = p.loras.slice(0, 3).map(l => ({ path: l.path, scale: Number(l.scale) || 1 }));
      }
      return b;
    }
  },
  'chroma': {
    cat: 't2img',
    label: 'Chroma uncensored · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/chroma',
    price: 0.015,
    verified: true,
    buildBody: p => ({
      prompt: p.prompt,
      size: wsSize(p.aspectRatio, p.resolution),
      seed: -1,
      output_format: 'png',
      enable_base64_output: false,
      enable_sync_mode: false
    })
  },
  'klein9b-lora': {
    cat: 't2img',
    label: 'Flux.2 Klein 9B · WaveSpeed · LoRA [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/flux-2-klein-9b/text-to-image-lora',
    price: 0.015,
    verified: true,
    lora: true,
    loraBase: 'Flux2-Klein',
    buildBody: p => {
      const b: any = {
        prompt: p.prompt,
        size: wsSize(p.aspectRatio, p.resolution),
        seed: -1,
        enable_safety_checker: false,
        enable_base64_output: false
      };
      if (p.loras && p.loras.length) {
        b.loras = p.loras.slice(0, 3).map(l => ({ path: l.path, scale: Number(l.scale) || 1 }));
      }
      return b;
    }
  },
  'atlas-flux-dev': {
    cat: 't2img',
    label: 'Flux Dev · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'black-forest-labs/flux-dev',
    price: 0.01,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, num_images: 1, enable_safety_checker: false })
  },
  'atlas-flux-schnell': {
    cat: 't2img',
    label: 'Flux Schnell · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'black-forest-labs/flux-schnell',
    price: 0.003,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, num_images: 1, enable_safety_checker: false })
  },
  'atlas-flux-2-pro': {
    cat: 't2img',
    label: 'Flux 2 Pro · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'black-forest-labs/flux-2-pro/text-to-image',
    price: 0.04,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, num_images: 1, enable_safety_checker: false })
  },
  'atlas-wan27-img': {
    cat: 't2img',
    label: 'Wan 2.7 Image · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'alibaba/wan-2.7/text-to-image',
    price: 0.03,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, enable_safety_checker: false })
  },
  'atlas-flux-kontext': {
    cat: 'edit',
    label: 'Flux Kontext · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'black-forest-labs/flux-kontext-dev',
    price: 0.025,
    verified: true,
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      guidance_scale: 2.5,
      num_inference_steps: 28,
      enable_base64_output: false,
      enable_safety_checker: false
    })
  },
  'atlas-qwen-edit': {
    cat: 'edit',
    label: 'Qwen Edit · Atlas [Atlas Key]',
    provider: 'atlas',
    path: 'atlascloud/qwen-image/edit',
    price: 0.02,
    verified: true,
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      enable_base64_output: false,
      enable_safety_checker: false
    })
  },

  // ─────────── TEXT-TO-VIDEO ───────────
  'aurora-t2v': {
    cat: 't2v',
    label: 'Aurora T2V · xAI [Grok Key]',
    provider: 'xai-video',
    path: 'grok-imagine-video',
    pricePerS: 0.05,
    verified: true,
    durations: [4, 6, 8, 10],
    resolutions: ['480p', '720p'],
    buildBody: p => ({
      prompt: p.prompt,
      duration: Math.min(p.duration || 4, 10),
      aspect_ratio: p.aspectRatio || '16:9',
      resolution: p.resolution || '480p'
    })
  },
  'seedance15-t2v': {
    cat: 't2v',
    label: 'Seedance 1.5 T2V · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'bytedance/seedance-v1.5-pro/text-to-video',
    price: 0.06,
    verified: true,
    durations: [4, 5, 6, 8, 10, 12],
    resolutions: ['720p', '1080p'],
    buildBody: p => ({
      prompt: p.prompt,
      resolution: p.resolution || '720p',
      aspect_ratio: p.aspectRatio || '16:9',
      duration: Math.min(p.duration || 4, 12),
      generate_audio: false,
      seed: -1
    })
  },
  'wan26-t2v': {
    cat: 't2v',
    label: 'Wan 2.6 T2V · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'alibaba/wan-2.6/text-to-video',
    pricePerS: 0.068,
    verified: true,
    durations: [5, 8, 10, 15],
    resolutions: ['720p', '1080p'],
    buildBody: p => ({
      prompt: p.prompt,
      resolution: p.resolution || '720p',
      aspect_ratio: p.aspectRatio || '16:9',
      duration: Math.min(p.duration || 5, 15),
      seed: -1
    })
  },
  'atlas-wan27-t2v': {
    cat: 't2v',
    label: 'Wan 2.7 T2V (Atlas) [Atlas Key]',
    provider: 'atlas',
    path: 'wan-2.7/text-to-video',
    pricePerS: 0.02,
    verified: true,
    durations: [5, 8, 10],
    resolutions: ['720p', '1080p'],
    buildBody: p => ({ prompt: p.prompt, resolution: p.resolution || '720p', duration: Math.min(p.duration || 5, 10) })
  },

  // ─────────── IMAGE EDIT ───────────
  'qwen2-edit': {
    cat: 'edit',
    label: 'Qwen 2.0 Edit · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/qwen-image-2.0/edit',
    price: 0.03,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, images: [p.image], seed: -1, enable_safety_checker: false })
  },
  'qwen-edit': {
    cat: 'edit',
    label: 'Qwen Edit · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/qwen-image/edit',
    price: 0.02,
    verified: true,
    timeout: 180000,
    buildBody: p => ({ prompt: p.prompt, image: p.image, seed: -1, enable_safety_checker: false })
  },
  'flux-kontext': {
    cat: 'edit',
    label: 'Flux Kontext · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/flux-kontext-dev-ultra-fast',
    price: 0.02,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, image: p.image, seed: -1, enable_safety_checker: false })
  },
  'wan27-edit': {
    cat: 'edit',
    label: 'Wan 2.7 Edit · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'alibaba/wan-2.7/image-edit',
    price: 0.03,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, images: [p.image], seed: -1 })
  },
  'wan27pro-edit': {
    cat: 'edit',
    label: 'Wan 2.7 Pro Edit · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'alibaba/wan-2.7/image-edit-pro',
    price: 0.06,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, images: [p.image], seed: -1 })
  },
  'aurora-edit': {
    cat: 'edit',
    label: 'Aurora Edit · xAI [Grok Key]',
    provider: 'xai-image',
    path: 'grok-imagine-image',
    price: 0.04,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, image: p.image })
  },

  // ─────────── IMG2IMG ───────────
  'flux-img2img': {
    cat: 'img2img',
    label: 'Flux img2img · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/flux-dev/image-to-image',
    price: 0.02,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, image: p.image, strength: 0.7, enable_safety_checker: false })
  },

  // ─────────── IMAGE-TO-VIDEO (animate) ───────────
  'aurora-i2v': {
    cat: 'i2v',
    label: 'Aurora I2V · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'x-ai/grok-imagine-video-v1.5/image-to-video',
    price: 0.05,
    verified: true,
    durations: [4, 6, 8, 10],
    resolutions: ['480p', '720p'],
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      resolution: p.resolution || '480p',
      duration: Math.min(p.duration || 4, 10)
    })
  },
  'seedance15-spicy': {
    cat: 'i2v',
    label: 'Seedance 1.5 Spicy · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'bytedance/seedance-v1.5-pro/image-to-video-spicy',
    price: 0.06,
    verified: true,
    durations: [4, 5, 6, 8, 10, 12],
    resolutions: ['480p', '720p', '1080p'],
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      resolution: p.resolution || '480p',
      duration: Math.min(p.duration || 4, 12),
      aspect_ratio: p.aspectRatio || '16:9',
      generate_audio: false,
      seed: -1
    })
  },
  'wan22-spicy': {
    cat: 'i2v',
    label: 'Wan 2.2 Spicy · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/wan-2.2-spicy/image-to-video',
    price: 0.15,
    verified: true,
    durations: [5],
    resolutions: ['480p', '720p'],
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      resolution: p.resolution || '480p',
      duration: 5,
      aspect_ratio: p.aspectRatio || '16:9',
      seed: -1
    })
  },
  'wan27-spicy': {
    cat: 'i2v',
    label: 'Wan 2.7 Spicy · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'alibaba/wan-2.7/image-to-video-spicy',
    price: 0.50,
    verified: true,
    durations: [5, 10, 15],
    resolutions: ['720p', '1080p'],
    buildBody: p => ({
      prompt: p.prompt,
      image: p.image,
      resolution: p.resolution || '720p',
      duration: Math.min(p.duration || 5, 15),
      aspect_ratio: p.aspectRatio || '16:9',
      seed: -1
    })
  },

  // ─────────── VIDEO EXTEND ───────────
  'aurora-extend': {
    cat: 'extend',
    label: 'Aurora Extend · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'x-ai/grok-imagine-video/video-extend',
    price: 0.35,
    verified: true,
    durations: [4, 6, 8, 10],
    resolutions: ['480p', '720p'],
    buildBody: p => ({
      prompt: p.prompt,
      video: p.video,
      resolution: p.resolution || '480p',
      duration: Math.min(p.duration || 4, 10)
    })
  },
  'wan22spicy-extend': {
    cat: 'extend',
    label: 'Wan 2.2 Spicy Extend · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'wavespeed-ai/wan-2.2-spicy/video-extend',
    price: 0.15,
    verified: true,
    durations: [5],
    resolutions: ['480p', '720p'],
    buildBody: p => ({ prompt: p.prompt, video: p.video, resolution: p.resolution || '480p', duration: 5, seed: -1 })
  },
  'wan27-extend': {
    cat: 'extend',
    label: 'Wan 2.7 Extend · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'alibaba/wan-2.7/video-extend',
    price: 0.30,
    verified: true,
    durations: [2, 3, 4, 5, 8, 10, 15],
    resolutions: ['720p', '1080p'],
    buildBody: p => ({
      prompt: p.prompt,
      video: p.video,
      resolution: p.resolution || '720p',
      duration: Math.min(p.duration || 5, 15),
      seed: -1
    })
  },

  // ─────────── VIDEO-TO-VIDEO EDIT ───────────
  'grok-vedit': {
    cat: 'v2v',
    label: 'Aurora Video Edit · WaveSpeed [WaveSpeed Key]',
    provider: 'wavespeed',
    path: 'x-ai/grok-imagine-video/edit-video',
    price: 0.10,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, video: p.video, resolution: p.resolution || '720p' })
  },
  'atlas-wan27-vedit': {
    cat: 'v2v',
    label: 'Wan 2.7 Video Edit (Atlas) [Atlas Key]',
    provider: 'atlas',
    path: 'wan-2.7/video-edit',
    pricePerS: 0.05,
    verified: true,
    buildBody: p => ({ prompt: p.prompt, video: p.video, resolution: p.resolution || '720p' })
  }
};

export function wsSize(ar?: string, res?: string): string {
  const base = String(res).toLowerCase() === '2k' ? 1536 : 1024;
  const map: Record<string, [number, number]> = {
    '1:1': [1, 1],
    '16:9': [16, 9],
    '9:16': [9, 16],
    '4:3': [4, 3],
    '3:4': [3, 4],
    '3:2': [3, 2],
    '2:3': [2, 3],
    '2:1': [2, 1],
    '1:2': [1, 2]
  };
  const r = map[ar || '1:1'] || [1, 1];
  const long = Math.max(r[0], r[1]);
  const round16 = (n: number) => Math.round(n / 16) * 16;
  return round16((base * r[0]) / long) + '*' + round16((base * r[1]) / long);
}

export function b64ToDataUrl(b64: string): string | null {
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  let mime = 'image/jpeg';
  if (b64.startsWith('iVBOR')) mime = 'image/png';
  else if (b64.startsWith('UklGR')) mime = 'image/webp';
  else if (b64.startsWith('R0lGOD')) mime = 'image/gif';
  return 'data:' + mime + ';base64,' + b64;
}

export function priceLabel(m: ModelRegistryEntry): string {
  if (m.price != null) {
    let s = m.price.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return '$' + s;
  }
  if (m.pricePerS != null) return '$' + m.pricePerS + '/s';
  return 'TBC';
}

export function modelsByCat(cat: ModelRegistryEntry['cat']): [string, ModelRegistryEntry][] {
  return Object.entries(MODEL_REGISTRY).filter(([_, m]) => m.cat === cat && m.verified);
}

// Model execution gateway callModel
export async function callModel(modelId: string, params: {
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  steps?: number;
  guidance?: number;
  loras?: { path: string; scale: number }[];
  image?: string;
}): Promise<string> {
  const m = MODEL_REGISTRY[modelId];
  if (!m) throw new Error('Unsupported model identifier.');

  const xaiKey = localStorage.getItem('xai_key') || '';
  const wsKey = localStorage.getItem('ws_key') || '';
  const atlasKey = localStorage.getItem('atlas_key') || '';

  const body = m.buildBody(params);

  if (m.provider === 'xai-image') {
    if (!xaiKey) throw new Error('xAI credentials missing.');
    const res = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`xAI error ${res.status}: ${err.error?.message || 'Unauthorized or rate limited.'}`);
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image payload returned from xAI.');
    const dUrl = b64ToDataUrl(b64);
    if (!dUrl) throw new Error('Failed to encode image to base64 URL.');
    return dUrl;
  }

  if (m.provider === 'wavespeed') {
    if (!wsKey) throw new Error('WaveSpeed credentials token is missing.');
    return await callWaveSpeed(wsKey, m.path, body);
  }

  if (m.provider === 'atlas') {
    if (!atlasKey) throw new Error('Atlas Cloud credentials missing.');
    const res = await fetch('https://api.atlascloud.ai/api/v1/model/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${atlasKey}`
      },
      body: JSON.stringify({
        model: m.path,
        input: body
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Atlas cloud error ${res.status}: ${err.message || 'Error occurred.'}`);
    }
    const data = await res.json();
    const outUrl = data.url || data.data?.url || data.outputs?.[0] || data.data?.media_url || data.media_url;
    if (!outUrl) throw new Error('Atlas prediction returned empty output path.');
    return outUrl;
  }

  throw new Error('Unsupported provider.');
}

// Revision execution gateway runEdit
export async function runEdit(prompt: string, imageSrc: string, modelId: string): Promise<string> {
  const m = MODEL_REGISTRY[modelId];
  if (!m) throw new Error(`Unsupported edit model identifier: ${modelId}`);

  const xaiKey = localStorage.getItem('xai_key') || '';
  const wsKey = localStorage.getItem('ws_key') || '';
  const atlasKey = localStorage.getItem('atlas_key') || '';

  const body = m.buildBody({ prompt, image: imageSrc });

  if (m.provider === 'xai-image') {
    if (!xaiKey) throw new Error('xAI credentials missing for image edit.');
    const res = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`xAI error ${res.status}: ${err.error?.message || 'Network call error.'}`);
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('No b64 payload returned from xAI.');
    const dUrl = b64ToDataUrl(b64);
    if (!dUrl) throw new Error('b64ToDataUrl returned null');
    return dUrl;
  }

  if (m.provider === 'wavespeed') {
    if (!wsKey) throw new Error('WaveSpeed credentials token missing for image edit.');
    return await callWaveSpeed(wsKey, m.path, body);
  }

  if (m.provider === 'atlas') {
    if (!atlasKey) throw new Error('Atlas Cloud credentials missing for edit.');
    const preparedImage = await atlasPrepareImage(imageSrc, atlasKey);
    const atlasBody = m.buildBody({ prompt, image: preparedImage });

    const res = await fetch('https://api.atlascloud.ai/api/v1/model/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${atlasKey}`
      },
      body: JSON.stringify({
        model: m.path,
        input: atlasBody
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Atlas edit failed ${res.status}: ${err.message || 'Internal issue.'}`);
    }
    const data = await res.json();
    const outUrl = data.url || data.data?.url || data.outputs?.[0] || data.data?.media_url || data.media_url;
    if (!outUrl) throw new Error('Atlas prediction returned empty output path for edit.');
    return outUrl;
  }

  throw new Error('Unsupported edit provider.');
}

// Prepare image for Atlas Cloud
export async function atlasPrepareImage(src: string, atlasKey: string): Promise<string> {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    const fd = new FormData();
    fd.append('file', blob, 'source.png');
    const up = await fetch('https://api.atlascloud.ai/api/v1/model/uploadMedia', {
      method: 'POST',
      headers: { Authorization: `Bearer ${atlasKey}` },
      body: fd
    });
    if (up.ok) {
      const j = await up.json().catch(() => ({}));
      const u = j.url || j.data?.url || j.data?.media_url || j.media_url;
      if (u) return u;
    }
  } catch (e) {
    /* fallback to raw src */
  }
  return src;
}

// Local polling helper
export async function pollForVideo(
  fetchFn: () => Promise<Response>,
  extractFn: (data: any) => string | null,
  onStatus: (status: string) => void,
  isCancelled: () => boolean,
  intervalMs = 5000,
  timeoutMs = 600000
): Promise<string | null> {
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    await new Promise(r => setTimeout(r, intervalMs));
    elapsed += intervalMs;

    if (isCancelled()) return null;

    try {
      const res = await fetchFn();
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status) {
        onStatus(data.status);
      }
      const result = extractFn(data);
      if (result === 'FAILED') throw new Error('Video generation failed');
      if (result === null && (data.status === 'done' || data.status === 'completed')) {
        throw new Error('Video finished but no URL found ' + JSON.stringify(data).slice(0, 100));
      }
      if (result) return result;
    } catch (e: any) {
      if (e.message.includes('failed') || e.message.includes('finished but')) throw e;
    }
  }
  throw new Error('Video generation timed out');
}

// WaveSpeed helper
export async function callWaveSpeed(
  wavespeedKey: string,
  modelPath: string,
  body: any,
  timeoutMs = 120000,
  intervalMs = 2500
): Promise<string> {
  if (!wavespeedKey) throw new Error('WaveSpeed API key required.');

  const submitRes = await fetch(`https://api.wavespeed.ai/api/v3/${modelPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wavespeedKey}` },
    body: JSON.stringify(body)
  });

  if (!submitRes.ok) {
    const e = await submitRes.json().catch(() => ({}));
    throw new Error(`WaveSpeed error ${submitRes.status}: ${e.message || e.error || JSON.stringify(e)}`);
  }

  const submitData = await submitRes.json();
  const taskId = submitData.data?.id || submitData.id;
  if (!taskId) throw new Error('No task ID returned from WaveSpeed');

  let elapsed = 0;
  while (elapsed < timeoutMs) {
    await new Promise(r => setTimeout(r, intervalMs));
    elapsed += intervalMs;

    const pollRes = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`, {
      headers: { Authorization: `Bearer ${wavespeedKey}` }
    });
    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const status = pollData.data?.status || pollData.status;

    if (status === 'completed') {
      const out = pollData.data?.outputs?.[0] || pollData.outputs?.[0];
      if (!out) throw new Error(`WaveSpeed completed empty output`);
      return out;
    }
    if (status === 'failed') {
      const errMsg = pollData.data?.error || pollData.data?.message || JSON.stringify(pollData).slice(0, 150);
      throw new Error(`WaveSpeed generation failed: ${errMsg}`);
    }
  }
  throw new Error('WaveSpeed request timed out');
}
