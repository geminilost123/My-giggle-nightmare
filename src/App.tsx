import React, { useState, useEffect, useRef } from 'react';
import { Thread, Message, HistoryItem, Character, StorySetup, LoRA, PromptTemplate } from './types';
import { PinScreen } from './components/PinScreen';
import { Sidebar } from './components/Sidebar';
import { Modals } from './components/Modals';
import { MessageFeed } from './components/MessageFeed';
import { InputControls } from './components/InputControls';
import {
  MODEL_REGISTRY,
  callModel,
  runEdit,
  callWaveSpeed,
  atlasPrepareImage
} from './api';
import {
  PE_SYSTEM_PROMPTS,
  DIRECTOR_SYSTEM,
  directorModelGuide
} from './data';
import {
  Sparkles, Menu, ShieldAlert, Key, Library, Dna, Settings, Users,
  BookOpen, Save, Cpu, RefreshCw, X, Check, HelpCircle, Trash2
} from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Api Keys & Local Storage credentials
  const [keys, setKeys] = useState({
    apiKey: '',
    wavespeedKey: '',
    atlasKey: '',
    cloudinaryCloud: '',
    cloudinaryPreset: '',
    chatModel: 'grok-beta'
  });

  const [storageSizeMB, setStorageSizeMB] = useState<string>('0.0');

  // Active Game State
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Active inputs
  const [prompt, setPrompt] = useState<string>('');
  const [mode, setMode] = useState<'chat' | 'image' | 'video' | 'enhance' | 'edit'>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // LoRA State
  const [loras, setLoras] = useState<LoRA[]>([]);

  // Prompt Templates Drawer
  const [userPrompts, setUserPrompts] = useState<PromptTemplate[]>([]);

  // Style Lock Parameters
  const [styleLockActive, setStyleLockActive] = useState<boolean>(false);
  const [lockedStyle, setLockedStyle] = useState<string>('');

  // Storyboard Configuration Rules
  const [storyboardOn, setStoryboardOn] = useState<boolean>(false);
  const [storyboardModel, setStoryboardModel] = useState<string>('chroma');
  const [storyboardRatio, setStoryboardRatio] = useState<string>('16:9');

  // Image & Video controls state
  const [imageModel, setImageModel] = useState<string>('aurora-simple');
  const [imageRatio, setImageRatio] = useState<string>('1:1');
  const [imageRes, setImageRes] = useState<string>('1K');
  const [imageCount, setImageCount] = useState<number>(1);
  const [imageSteps, setImageSteps] = useState<number>(28);
  const [imageGuidance, setImageGuidance] = useState<number>(3.5);

  const [videoEngine, setVideoEngine] = useState<string>('aurora');
  const [videoDur, setVideoDur] = useState<number>(4);
  const [videoRes, setVideoRes] = useState<string>('480p');
  const [videoRatio, setVideoRatio] = useState<string>('16:9');

  const [cleanModel, setCleanModel] = useState<string>('qwen2-edit');
  const [upscaleModel, setUpscaleModel] = useState<string>('standard');
  const [upscaleRes, setUpscaleRes] = useState<string>('4k');

  const [editModel, setEditModel] = useState<string>('wan27-edit');
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [activeTargetUrl, setActiveTargetUrl] = useState<string | null>(null);

  // Prompt Engineering Prompt Context Builder
  const [promptEngineerMode, setPromptEngineerMode] = useState<boolean>(false);
  const [pinnedPeUrl, setPinnedPeUrl] = useState<string | null>(null);
  const [pinnedPeType, setPinnedPeType] = useState<'image' | 'video' | null>(null);
  const [pinnedPeLabel, setPinnedPeLabel] = useState<string | null>(null);
  const [peUseImage, setPeUseImage] = useState<boolean>(false);
  const [peSelectedModel, setPeSelectedModel] = useState<string>('aurora');

  // Overflow header menu toggle
  const [overflowMenuOpen, setOverflowMenuOpen] = useState<boolean>(false);

  // Rename/Delete game dialog caching
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Cost estimates string
  const [costStr, setCostStr] = useState<string>('');

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    // Keys
    const k = {
      apiKey: localStorage.getItem('xai_key') || '',
      wavespeedKey: localStorage.getItem('ws_key') || '',
      atlasKey: localStorage.getItem('atlas_key') || '',
      cloudinaryCloud: localStorage.getItem('cloudinary_cloud') || '',
      cloudinaryPreset: localStorage.getItem('cloudinary_preset') || '',
      chatModel: localStorage.getItem('xai_chat_model') || 'grok-beta'
    };
    setKeys(k);

    // Threads
    try {
      const stored = JSON.parse(localStorage.getItem('gs_threads') || '[]');
      setThreads(stored);
      if (stored.length > 0) {
        setCurrentThreadId(stored[0].id);
      } else {
        // Build fresh default game thread
        const defaultTh: Thread = {
          id: 'th_' + Date.now(),
          name: 'New Game Scene',
          createdAt: Date.now(),
          messages: [],
          history: [],
          cast: []
        };
        localStorage.setItem('gs_threads', JSON.stringify([defaultTh]));
        setThreads([defaultTh]);
        setCurrentThreadId(defaultTh.id);
      }
    } catch {
      /* fallback blank reset */
    }

    // Style Lock
    const sActive = localStorage.getItem('zaor_style_active') === '1';
    setStyleLockActive(sActive);
    setLockedStyle(localStorage.getItem('zaor_style_lock') || '');

    // Storyboard
    setStoryboardOn(localStorage.getItem('zaor_sb_on') === '1');
    setStoryboardModel(localStorage.getItem('zaor_sb_model') || 'chroma');
    setStoryboardRatio(localStorage.getItem('zaor_sb_ratio') || '16:9');

    // LoRAs
    try {
      const storedLoras = JSON.parse(localStorage.getItem('zaor_loras') || '[]');
      setLoras(storedLoras);
    } catch {
      setLoras([]);
    }

    // Templates Drawer
    try {
      const storedUserPromo = JSON.parse(localStorage.getItem('zaor_user_prompts') || '[]');
      setUserPrompts(storedUserPromo);
    } catch {
      setUserPrompts([]);
    }

    recalcStorageSize();
  }, []);

  // Update keys actions
  const saveKeys = (updatedKeys: typeof keys) => {
    setKeys(updatedKeys);
    localStorage.setItem('xai_key', updatedKeys.apiKey);
    localStorage.setItem('ws_key', updatedKeys.wavespeedKey);
    localStorage.setItem('atlas_key', updatedKeys.atlasKey);
    localStorage.setItem('cloudinary_cloud', updatedKeys.cloudinaryCloud);
    localStorage.setItem('cloudinary_preset', updatedKeys.cloudinaryPreset);
    localStorage.setItem('xai_chat_model', updatedKeys.chatModel);
    recalcStorageSize();
  };

  // Recalc local sizes
  const recalcStorageSize = () => {
    try {
      let used = 0;
      for (const k in localStorage) {
        if (localStorage.hasOwnProperty(k)) used += (localStorage[k] || '').length * 2;
      }
      setStorageSizeMB((used / 1024 / 1024).toFixed(2));
    } catch {
      setStorageSizeMB('0.0');
    }
  };

  // Safe thread retrieval
  const activeThread = threads.find(t => t.id === currentThreadId) || null;

  // Active threads lists update helper
  const updateThreadsList = (updatedList: Thread[]) => {
    setThreads(updatedList);
    localStorage.setItem('gs_threads', JSON.stringify(updatedList));
    recalcStorageSize();
  };

  const updateCurrentThread = (updater: (t: Thread) => Thread) => {
    if (!currentThreadId) return;
    const newList = threads.map(t => {
      if (t.id === currentThreadId) {
        return updater(t);
      }
      return t;
    });
    updateThreadsList(newList);
  };

  // Create new campaign game
  const handleCreateThread = () => {
    const newTh: Thread = {
      id: 'th_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      name: 'New Game Scene',
      createdAt: Date.now(),
      messages: [],
      history: [],
      cast: []
    };
    updateThreadsList([newTh, ...threads]);
    setCurrentThreadId(newTh.id);
    setPrompt('');
    setLastImageUrl(null);
    setActiveTargetUrl(null);
  };

  // Recur pricing calculations
  useEffect(() => {
    if (mode === 'chat') {
       setCostStr('');
     } else if (mode === 'image') {
       const entry = MODEL_REGISTRY[imageModel];
       const costPer = entry ? entry.price || 0.02 : 0.02;
       setCostStr(`$${(costPer * imageCount).toFixed(3)}`);
     } else if (mode === 'video') {
       const hi = videoRes === '720p';
       let rate = 0.05;
       if (videoEngine === 'seedance15t2v' || videoEngine === 'seedance15-t2v') rate = hi ? 0.02 : 0.009;
       else if (videoEngine === 'wan26t2v' || videoEngine === 'wan26-t2v') rate = 0.068;
       else if (videoEngine === 'wan22spicy' || videoEngine === 'wan22-spicy') rate = 0.15;
       else if (videoEngine === 'wan26spicy' || videoEngine === 'wan26-spicy') rate = 0.10;
       setCostStr(`~$${(rate * videoDur).toFixed(2)}`);
     } else if (mode === 'edit') {
       const entry = MODEL_REGISTRY[editModel];
       const rateVal = entry?.price || 0.03;
       setCostStr(`$${rateVal.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`);
     } else if (mode === 'enhance') {
       const upCosts: Record<string, string> = { standard: '0.01', precision: '0.03', premium: '0.06' };
       const entry = MODEL_REGISTRY[cleanModel];
       const cleanCostVal = entry?.price || 0.03;
       setCostStr(`Clean: $${cleanCostVal.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} / Up: $${upCosts[upscaleModel] || '0.01'}`);
     }
  }, [mode, imageModel, imageCount, videoEngine, videoDur, videoRes, editModel, cleanModel, upscaleModel]);

  // Strip logs binaries saving space
  const handleClearMedia = () => {
    const updated = threads.map(t => {
      const cleanedMessages = t.messages.filter(m => m.type !== 'image' && m.type !== 'video' && m.type !== 'storyboard');
      const cleanedHistory = t.history.map(h => {
        if (typeof h.content === 'string' && h.content.startsWith('data:')) {
          return { ...h, content: '[media removed]' };
        }
        return h;
      });
      return {
        ...t,
        messages: cleanedMessages,
        history: cleanedHistory
      };
    });
    updateThreadsList(updated);
    setLastImageUrl(null);
    setActiveTargetUrl(null);
    alert('Heavy binary images stripped from local campaign logs. Conversation texts saved!');
  };

  const handleClearAllChats = () => {
    localStorage.removeItem('gs_threads');
    const defaultTh: Thread = {
      id: 'th_' + Date.now(),
      name: 'New Game Scene',
      createdAt: Date.now(),
      messages: [],
      history: [],
      cast: []
    };
    updateThreadsList([defaultTh]);
    setCurrentThreadId(defaultTh.id);
    setLastImageUrl(null);
    setActiveTargetUrl(null);
    alert('Logs fully wiped.');
  };

  // ── 2. Unified Send Core ──
  const handleSend = async () => {
    const rawText = prompt.trim();
    if (!rawText || isLoading) return;
    if (!keys.apiKey) {
      setActiveModal('api');
      return;
    }

    setIsLoading(true);
    setPrompt('');

    // Pre-naming game if name still defaults (using direct text extraction)
    if (activeThread && activeThread.name === 'New Game Scene') {
      const titleName = rawText.slice(0, 36) + (rawText.length > 36 ? '...' : '');
      updateCurrentThread(t => ({ ...t, name: titleName }));
    }

    // Append User Card segment
    const newUserMsg: Message = { role: 'user', type: 'text', content: rawText };
    if (promptEngineerMode) {
      newUserMsg.isPe = true;
    }
    updateCurrentThread(t => ({
      ...t,
      messages: [...t.messages, newUserMsg],
      history: [...t.history, { role: 'user', content: rawText }]
    }));

    try {
      if (mode === 'edit' && (activeTargetUrl || lastImageUrl)) {
        await executeEditImage(rawText, activeTargetUrl || lastImageUrl || '', editModel);
      } else if (mode === 'image') {
        await executeImageGen(rawText);
      } else if (mode === 'video') {
        await executeVideoGen(rawText, null, videoEngine, null, videoDur, videoRes);
      } else {
        await executeTextChat(rawText);
      }
    } catch (e: any) {
      const errCard: Message = { role: 'assistant', type: 'error', content: e.message };
      updateCurrentThread(t => ({ ...t, messages: [...t.messages, errCard] }));
    } finally {
      setIsLoading(false);
    }
  };

  const buildStorySetupSystem = (s: StorySetup | undefined) => {
    if (!s) return '';
    const parts = [];
    if (s.premise) parts.push('PREMISE: ' + s.premise);
    if (s.tone) parts.push('TONE: ' + s.tone);
    if (s.characters) parts.push('STARTING CHARACTERS:\n' + s.characters);
    if (!parts.length) return '';
    return 'You are running an interactive story campaign for the user. Stay consistent with this setup context:\n\n' + parts.join('\n') + '\n\nNarrate vivid developments keeping matching tones. The user directs campaign turns, you act as storyteller.';
  };

  // Text Completion Engine via direct xAI completions fetch
  const executeTextChat = async (userText: string) => {
    if (!activeThread) return;

    // Compose PE context or Setup directives
    const sysPrompt = promptEngineerMode
      ? PE_SYSTEM_PROMPTS[peSelectedModel] || PE_SYSTEM_PROMPTS.aurora
      : buildStorySetupSystem(activeThread.setup);

    const historyPayload = activeThread.history.map(h => ({
      role: h.role,
      content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content)
    }));

    // Guarantee that userText is represented at the end of history if not already present, preventing empty/invalid payloads
    const finalHistory = [...historyPayload];
    const lastMsg = finalHistory[finalHistory.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userText) {
      finalHistory.push({ role: 'user', content: userText });
    }

    const messagesPayload = sysPrompt
      ? [{ role: 'system', content: sysPrompt }, ...finalHistory]
      : finalHistory;

    // Pin context addition if PE mode active
    if (promptEngineerMode && (pinnedPeUrl || lastImageUrl)) {
      const peUrl = pinnedPeUrl || lastImageUrl;
      const lastIdx = messagesPayload.map(m => m.role).lastIndexOf('user');
      if (lastIdx !== -1 && peUrl) {
        messagesPayload[lastIdx] = {
          role: 'user',
          content: `Visual Reference Context Attached: ${peUrl}\n` + messagesPayload[lastIdx].content
        } as any;
      }
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.apiKey}` },
      body: JSON.stringify({
        model: keys.chatModel || 'grok-beta',
        messages: messagesPayload,
        max_tokens: 2048
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let errMessage = 'Grok direct blocked call.';
      try {
        const errBody = JSON.parse(errText);
        errMessage = errBody.error?.message || errBody.error || errBody.message || errText || errMessage;
      } catch {
        errMessage = errText || errMessage;
      }
      throw new Error(`Chat session error ${res.status}: ${errMessage}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '(Empty Response)';

    const assistCard: Message = { role: 'assistant', type: 'text', content: reply };
    if (promptEngineerMode) {
      assistCard.isPe = true;
    }
    updateCurrentThread(t => ({
      ...t,
      messages: [...t.messages, assistCard],
      history: [...t.history, { role: 'assistant', content: reply }]
    }));

    // Trigger secondary Storyboard Director parse frame call if enabled and not in prompt engineer builder
    if (storyboardOn && !promptEngineerMode) {
      await executeStoryDirectorPass(userText, reply);
    }
  };

  // Image Generators Core Launcher
  const executeImageGen = async (promptText: string) => {
    const registryEntry = MODEL_REGISTRY[imageModel];
    if (!registryEntry) throw new Error('Unsupported image generator selected');

    // Combine Style block
    let fullyStyledPrompt = styleLockActive && lockedStyle.trim()
      ? `${promptText}, ${lockedStyle.trim()}`
      : promptText;

    // Apply any active/matching parameters & trigger words injection
    const activeLorasList = loras.filter(l => l.active && (!l.base || l.base === 'Other' || l.base === registryEntry.loraBase));
    if (activeLorasList.length > 0) {
      activeLorasList.forEach(l => {
        const trigs = l.trigger.split(',').map(t => t.trim()).filter(Boolean);
        trigs.forEach(t => {
          if (!fullyStyledPrompt.toLowerCase().includes(t.toLowerCase())) {
            fullyStyledPrompt = `${t}, ${fullyStyledPrompt}`;
          }
        });
      });
    }

    const reqLoras = activeLorasList.map(l => ({ path: l.url, scale: l.scale }));

    const resArray: string[] = [];

    // Trigger count map
    for (let c = 0; c < imageCount; c++) {
      const outputUrl = await callModel(imageModel, {
        prompt: fullyStyledPrompt,
        aspectRatio: imageRatio,
        resolution: imageRes,
        steps: imageSteps,
        guidance: imageGuidance,
        loras: reqLoras
      });
      if (outputUrl) resArray.push(outputUrl);
    }

    const newCards = resArray.map(url => ({
      role: 'assistant' as const,
      type: 'image' as const,
      src: url,
      hostedUrl: url.startsWith('http') ? url : null,
      alt: promptText,
      modelLabel: registryEntry.label.split('·')[0].trim()
    }));

    setLastImageUrl(resArray[resArray.length - 1]);
    setActiveTargetUrl(resArray[resArray.length - 1]);

    updateCurrentThread(t => ({
      ...t,
      messages: [...t.messages, ...newCards]
    }));
  };

  // Edit models actions
  const executeEditImage = async (promptText: string, srcUrl: string, editMod: string) => {
    // Support legacy key cleanups / lookups
    const normalizedMod = editMod === 'wan27' ? 'wan27-edit'
      : editMod === 'wan27pro' ? 'wan27pro-edit'
      : editMod === 'fluxkontext' ? 'flux-kontext'
      : editMod === 'qwen2' ? 'qwen2-edit'
      : editMod === 'qwen' ? 'qwen-edit'
      : editMod;

    const entry = MODEL_REGISTRY[normalizedMod] || MODEL_REGISTRY['wan27-edit'];
    const finalSrc = srcUrl.startsWith('data:') && entry?.provider === 'atlas'
      ? await atlasPrepareImage(srcUrl, keys.atlasKey)
      : srcUrl;

    const out = await runEdit(promptText, finalSrc, normalizedMod);
    if (!out) throw new Error('Revise returned empty layout');

    const replaceCard: Message = {
      role: 'assistant',
      type: 'image',
      src: out,
      hostedUrl: out.startsWith('http') ? out : null,
      alt: promptText,
      modelLabel: entry?.label.split('·')[0].split('[')[0].trim() + ' Revise'
    };

    setLastImageUrl(out);
    setActiveTargetUrl(out);

    updateCurrentThread(t => ({
      ...t,
      messages: [...t.messages, replaceCard]
    }));
  };

  const runEditFromStoryboard = async (promptText: string, srcUrl: string, editModelId: string) => {
    setIsLoading(true);
    try {
      const out = await runEdit(promptText, srcUrl, editModelId);
      if (!out) throw new Error('No revised output retrieved');
      setLastImageUrl(out);
      setActiveTargetUrl(out);
      return out;
    } catch(e: any) {
      alert('Frame Edit Failed: ' + e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Video Renderer Launcher
  const executeVideoGen = async (
    promptText: string,
    imgContext: string | null = null,
    engineId: string = 'aurora',
    prevVideo: string | null = null,
    customDur: number | null = null,
    customRes: string | null = null
  ) => {
    // WaveSpeed video engines polling or Grok extensions
    const actualEngine = engineId || videoEngine;
    const durRaw = customDur || videoDur;
    const resolution = customRes || videoRes;

    let taskId = '';
    let pollingUrl = '';
    let extractFn: (data: any) => string | null = () => null;

    const normalizedVideoEngine = actualEngine === 'aurora' ? 'aurora-t2v'
      : actualEngine === 'seedance15t2v' ? 'seedance15-t2v'
      : actualEngine === 'wan26t2v' ? 'wan26-t2v'
      : actualEngine;

    const m = MODEL_REGISTRY[normalizedVideoEngine];
    if (m?.provider === 'atlas') {
      if (!keys.atlasKey) throw new Error('Atlas Cloud Key required.');
      const finalSrc = imgContext && imgContext.startsWith('data:')
        ? await atlasPrepareImage(imgContext, keys.atlasKey)
        : imgContext;

      // Build body using registry
      const atlasBody = m.buildBody({
        prompt: promptText,
        image: finalSrc,
        duration: durRaw,
        resolution,
        aspectRatio: videoRatio
      });

      const res = await fetch('https://api.atlascloud.ai/api/v1/model/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keys.atlasKey}`
        },
        body: JSON.stringify({
          model: m.path,
          input: atlasBody
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Atlas cloud error ${res.status}: ${err.message || 'Error occurred.'}`);
      }

      const data = await res.json();
      const outUrl = data.url || data.data?.url || data.outputs?.[0] || data.data?.media_url || data.media_url;
      if (!outUrl) throw new Error('Atlas prediction returned empty output path.');

      const videoCard: Message = {
        role: 'assistant',
        type: 'video',
        src: outUrl,
        alt: promptText,
        modelLabel: m.label.split('·')[0].split('[')[0].trim() || 'Wan 2.7 T2V (Atlas)'
      };

      updateCurrentThread(t => ({
        ...t,
        messages: [...t.messages, videoCard]
      }));
      return;
    }

    if (actualEngine === 'aurora' || actualEngine === 'aurora_extend') {
      if (!keys.apiKey) throw new Error('xAI Keystore key is missing');
      let xaiBody: any;
      let endpoint = 'https://api.x.ai/v1/videos/generations';

      if (prevVideo) {
        endpoint = 'https://api.x.ai/v1/videos/extensions';
        xaiBody = {
          model: 'grok-imagine-video',
          prompt: promptText,
          video_url: prevVideo,
          duration: Math.min(Math.max(durRaw, 2), 10)
        };
      } else {
        xaiBody = {
          model: 'grok-imagine-video',
          prompt: promptText,
          duration: durRaw,
          resolution,
          image: imgContext ? { url: imgContext } : undefined,
          aspect_ratio: imgContext ? undefined : videoRatio
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.apiKey}` },
        body: JSON.stringify(xaiBody)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Aurora Video Failed: ${err.error?.message || 'Server block response.'}`);
      }

      const resData = await res.json();
      const requestId = resData.request_id;
      if (!requestId) throw new Error('Xai failed to dispatch reference parameters ID');

      pollingUrl = `https://api.x.ai/v1/videos/${requestId}`;
      extractFn = d => d.status === 'done' ? d.video?.url || null : (['failed', 'expired', 'error'].includes(d.status) ? 'FAILED' : null);
    } else {
      // WaveSpeed WAN
      if (!keys.wavespeedKey) throw new Error('WaveSpeed Credentials Key required.');
      let body: any;
      let path = '';

      if (prevVideo) {
        path = 'alibaba/wan-2.7/video-extend';
        body = { prompt: promptText, video: prevVideo, resolution, duration: durRaw, seed: -1 };
      } else if (imgContext) {
        path = actualEngine === 'seedance15spicy'
          ? 'bytedance/seedance-v1.5-pro/image-to-video-spicy'
          : actualEngine === 'ltx23spicy'
          ? 'wavespeed-ai/ltx-2.3-spicy/image-to-video'
          : 'wavespeed-ai/wan-2.2-spicy/image-to-video';

        body = {
          prompt: promptText,
          image: imgContext,
          resolution,
          duration: durRaw,
          aspect_ratio: videoRatio,
          seed: -1
        };
      } else {
        path = actualEngine === 'seedance15t2v'
          ? 'bytedance/seedance-v1.5-pro/text-to-video'
          : 'alibaba/wan-2.6/text-to-video';

        body = {
          prompt: promptText,
          resolution,
          aspect_ratio: videoRatio,
          duration: durRaw,
          seed: -1
        };
      }

      const res = await fetch(`https://api.wavespeed.ai/api/v3/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.wavespeedKey}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`WaveSpeed Submit Failed: ${err.message || 'Block validation issue.'}`);
      }

      const resData = await res.json();
      taskId = resData.data?.id || resData.id;
      if (!taskId) throw new Error('taskId retrieval failed');

      pollingUrl = `https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`;
      extractFn = d => {
        const s = d.data?.status || d.status;
        if (s === 'completed') return d.data?.outputs?.[0] || d.outputs?.[0] || null;
        if (s === 'failed') return 'FAILED';
        return null;
      };
    }

    // Call fetch loop
    let loops = 0;
    while (loops < 120) {
      await new Promise(r => setTimeout(r, 5000));
      loops++;

      const pHeaders = actualEngine === 'aurora' || actualEngine === 'aurora_extend'
        ? { Authorization: `Bearer ${keys.apiKey}` }
        : { Authorization: `Bearer ${keys.wavespeedKey}` };

      const check = await fetch(pollingUrl, { headers: pHeaders });
      if (!check.ok) continue;

      const cData = await check.json();
      const extracted = extractFn(cData);

      if (extracted === 'FAILED') throw new Error('Video generation failed at remote backend.');
      if (extracted) {
        const videoCard: Message = {
          role: 'assistant',
          type: 'video',
          src: extracted,
          alt: promptText,
          engineLabel: actualEngine === 'aurora' ? 'Aurora T2V' : 'WaveSpeed WAN 2.2',
          storedDuration: durRaw,
          storedRes: resolution
        };
        updateCurrentThread(t => ({ ...t, messages: [...t.messages, videoCard] }));
        return;
      }
    }
    throw new Error('Video polling timed out after 10 minutes.');
  };

  // Storyboard Director checks & parse sequence
  const executeStoryDirectorPass = async (userBeat: string, aiStoryReply: string) => {
    if (!keys.apiKey) return;
    try {
      const guide = directorModelGuide(storyboardModel);
      const system = DIRECTOR_SYSTEM
        .replace('{MODEL}', storyboardModel)
        .replace('{MODELGUIDE}', guide);

      const castKnownStr = activeThread && activeThread.cast?.length > 0
        ? '\n\nREUSE THESE CAST PROFILE DETAILS IN PROMPTS IF RETURNING CHARACTERS APPEAR:\n' +
          activeThread.cast.map(c => `- ${c.name}: ${c.desc}`).join('\n')
        : '';

      const contentPrompt = `Beat Context Turn:\nUser: ${userBeat}\nStory: ${aiStoryReply}${castKnownStr}`;

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.apiKey}` },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-beta',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: contentPrompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!res.ok) return; // Silent discard so storytelling logic never crashes on parsing

      const data = await res.json();
      const blockText = data.choices?.[0]?.message?.content || '';

      // Match block parameters
      const frameMatch = blockText.match(/FRAME:\s*yes/i);
      if (!frameMatch) return;

      const sec = (name: string) => {
        const re = new RegExp(name + ':\\s*([\\s\\S]*?)(?=\\n\\s*(?:FRAME|REASON|IMAGE_PROMPT|VIDEO_PROMPT|CAST):|$)', 'i');
        const m = blockText.match(re);
        return m ? m[1].trim() : '';
      };

      const reason = sec('REASON');
      const imagePrompt = sec('IMAGE_PROMPT');
      const videoPrompt = sec('VIDEO_PROMPT');
      const castUpdates = sec('CAST');

      // Append updates to game Cast sheets natively
      if (castUpdates && !/^none$/i.test(castUpdates)) {
        mergeCastRoster(castUpdates);
      }

      if (imagePrompt) {
        await executeStoryboardFrameCompile(imagePrompt, videoPrompt, reason);
      }
    } catch {
      /* discard block issue silently */
    }
  };

  const mergeCastRoster = (castBlock: string) => {
    const lines = castBlock.split('\n');
    const existing = activeThread ? [...activeThread.cast] : [];
    const seen = new Set(existing.map(c => c.name.toLowerCase()));

    lines.forEach(l => {
      const clean = l.replace(/^[-*•]\s*/, '').trim();
      if (!clean || /^none$/i.test(clean)) return;

      let name = '';
      let desc = '';

      const dashIdx = clean.indexOf('—');
      const colIdx = clean.indexOf(':');

      if (dashIdx !== -1) {
        name = clean.slice(0, dashIdx).trim();
        desc = clean.slice(dashIdx + 1).trim();
      } else if (colIdx !== -1) {
        name = clean.slice(0, colIdx).trim();
        desc = clean.slice(colIdx + 1).trim();
      } else {
        name = clean;
      }

      if (name && !seen.has(name.toLowerCase())) {
        existing.push({ name, desc });
        seen.add(name.toLowerCase());
      }
    });

    updateCurrentThread(t => ({ ...t, cast: existing }));
  };

  const executeStoryboardFrameCompile = async (imagePrompt: string, videoPrompt: string, reason: string) => {
    try {
      let finalPrompt = imagePrompt;
      const setup = activeThread?.setup;
      if (setup && setup.style) finalPrompt = `${imagePrompt}, ${setup.style}`;

      // Assemble active LoRA details
      const activeLorasList = loras.filter(l => l.active && (!l.base || l.base === 'Other' || l.base === (MODEL_REGISTRY[storyboardModel]?.loraBase || '')));
      const reqLoras = activeLorasList.map(l => ({ path: l.url, scale: l.scale }));

      const outputImageUrl = await callModel(storyboardModel, {
        prompt: finalPrompt,
        aspectRatio: storyboardRatio,
        resolution: '1K',
        loras: reqLoras
      });

      if (!outputImageUrl) return;

      const frameId = 'sbf_' + Date.now();
      const sbFrameMsg: Message = {
        role: 'assistant',
        type: 'storyboard',
        src: outputImageUrl,
        alt: imagePrompt,
        videoPrompt,
        reason,
        frameId,
        modelLabel: MODEL_REGISTRY[storyboardModel]?.label.split('·')[0].trim() || 'Storyboard'
      };

      setLastImageUrl(outputImageUrl);
      setActiveTargetUrl(outputImageUrl);

      updateCurrentThread(t => ({ ...t, messages: [...t.messages, sbFrameMsg] }));
    } catch {
      /* skip frame */
    }
  };

  // Enhance Mode: digital cleaners
  const handleAutoCleanSubmit = async () => {
    const target = activeTargetUrl || lastImageUrl;
    if (!target) {
      alert('Attach an Edit Target image to clean first.');
      return;
    }
    setIsLoading(true);
    try {
      const cleanPrompt = 'Sharpen and clarify details. Remove standard noise, pixels and compression artifacts. Preserve characters, colors and composition exactly.';
      // Run Clean revised
      await executeEditImage(cleanPrompt, target, cleanModel);
    } catch (e: any) {
      alert(`Clean Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhance Mode: upscalers
  const handleUpscaleSubmit = async () => {
    const target = activeTargetUrl || lastImageUrl;
    if (!target) {
      alert('Attach an Edit Target image to upscale first.');
      return;
    }
    if (!keys.wavespeedKey) {
      alert('WaveSpeed credit token key is required.');
      return;
    }

    setIsLoading(true);
    try {
      const modelPath = upscaleModel === 'precision'
        ? 'clarity-ai/pro-upscaler'
        : upscaleModel === 'premium'
        ? 'wavespeed-ai/ultimate-image-upscaler'
        : 'wavespeed-ai/image-upscaler';

      const body = upscaleModel === 'precision'
        ? { image: target, target_megapixels: parseInt(upscaleRes) }
        : { image: target, target_resolution: upscaleRes, creativity: 0, output_format: 'png' };

      const result = await callWaveSpeed(keys.wavespeedKey, modelPath, body);

      const upCard: Message = {
        role: 'assistant',
        type: 'image',
        src: result,
        hostedUrl: result,
        alt: `Upscaled details: ${upscaleRes}`,
        modelLabel: `Upscaled (${upscaleModel.toUpperCase()})`
      };

      setLastImageUrl(result);
      setActiveTargetUrl(result);

      updateCurrentThread(t => ({ ...t, messages: [...t.messages, upCard] }));
    } catch (e: any) {
      alert(`Upscale error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cloud saved to Cloudinary from frontend
  const handleCloudSaveAction = async (srcUrl: string, type: 'image' | 'video', setter: (v: string) => void) => {
    if (!keys.cloudinaryCloud || !keys.cloudinaryPreset) {
      alert('Configure your unsigned Cloudinary credentials in API settings first!');
      return;
    }
    setter('☁ Archiving...');
    try {
      let fileToSend: any = srcUrl;
      if (srcUrl.startsWith('blob:')) {
        fileToSend = await (await fetch(srcUrl)).blob();
      }

      const fd = new FormData();
      fd.append('file', fileToSend);
      fd.append('upload_preset', keys.cloudinaryPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${keys.cloudinaryCloud}/${type}/upload`, {
        method: 'POST',
        body: fd
      });

      if (!res.ok) throw new Error('Cloudinary denied upload preset authorization.');
      const data = await res.json();
      const secureUrl = data.secure_url;
      if (secureUrl) {
        await navigator.clipboard.writeText(secureUrl);
        setter('✓ Link Copied');
        setTimeout(() => setter('☁ Cloud'), 2500);
      }
    } catch (e: any) {
      setter('☁ Cloud');
      alert(`Cloud upload failure: ${e.message}`);
    }
  };

  // Capture final frame from working video via canvas
  const handleGrabVideoFrame = async (videoUrl: string, setter: (v: string) => void) => {
    setter('◳ Capture...');
    try {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true;
      v.preload = 'auto';

      const frameDataUrl = await new Promise<string>((resolve, reject) => {
        v.addEventListener('error', () => reject(new Error('Canvas CORS lock or file issue.')));
        v.addEventListener('loadedmetadata', () => {
          v.currentTime = Math.max(0, v.duration - 0.1);
        });
        v.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
            } else {
              reject(new Error('Canvas ctx empty'));
            }
          } catch (err) {
            reject(err);
          }
        });
        v.src = videoUrl;
      });

      const newFrameCard: Message = {
        role: 'assistant',
        type: 'image',
        src: frameDataUrl,
        hostedUrl: null,
        alt: 'Captured Frame metadata',
        modelLabel: 'Captured Video Frame'
      };

      setLastImageUrl(frameDataUrl);
      setActiveTargetUrl(frameDataUrl);

      updateCurrentThread(t => ({ ...t, messages: [...t.messages, newFrameCard] }));
      setter('✓ Complete');
      setTimeout(() => setter('◳ Last frame'), 2000);
    } catch (e: any) {
      setter('◳ Last frame');
      alert(`Could not draw frame locally: ${e.message}`);
    }
  };

  // Run Prompt Engineering finalizer model completions pass
  const handleFinalizePromptEng = async () => {
    if (!keys.apiKey) {
      setActiveModal('api');
      return;
    }
    if (!activeThread || activeThread.history.length === 0) {
      alert('Prompt chat box log is empty. Refine concepts with PE builder first!');
      return;
    }

    setIsLoading(true);
    try {
      const systemGuide = PE_SYSTEM_PROMPTS[peSelectedModel] || PE_SYSTEM_PROMPTS.aurora;
      const sysPrompt = systemGuide + "\n\nOutput only the compiled optimized prompt in this exact format:\nBEST: <optimized results sentence>";

      const cleanHist = activeThread.history.map(h => ({ role: h.role, content: h.content }));

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.apiKey}` },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-beta',
          messages: [{ role: 'system', content: sysPrompt }, ...cleanHist, { role: 'user', content: 'Output finalized BEST prompt immediately.' }],
          temperature: 0.6,
          max_tokens: 500
        })
      });

      if (!res.ok) throw new Error('Could not contact finalizer builder.');
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      const bestMatch = content.match(/BEST:\s*([\s\S]*)$/i) || content.match(/BEST:\s*([\s\S]*?)(?=\n|$)/i);
      let best = bestMatch ? bestMatch[1].trim() : '';
      if (!best && content) {
        best = content.replace(/BEST:/i, '').trim();
      }

      if (best) {
        const textCard: Message = {
          role: 'assistant',
          type: 'text',
          content: `🎯 **Prompt Engineering Finalized Optimized Target!**\n\n\`\`\`\n${best}\n\`\`\``
        };
        updateCurrentThread(t => ({ ...t, messages: [...t.messages, textCard] }));
      }
    } catch (e: any) {
      alert(`Finalizer Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Character descriptive autocomplete help AI completes
  const handleCharacterAutoHelp = async (idx: number, charName: string, currentDesc: string, updateCb: (val: string) => void) => {
    if (!keys.apiKey) {
      alert('xAI token missing.');
      return;
    }
    try {
      const messagesPayload = getHistoryMessages();
      const refLogs = messagesPayload.slice(-6).map((m: any) => m.content).join('\n').slice(-1500);

      const sys = 'Generate a detailed but concise single-paragraph physical profile description card matching characters present inside recent roleplay texts (sex, eye/hair shapes, clothing styles, age). Output description values only.';
      const prompt = `Character Name: ${charName}\nExisting details: ${currentDesc || '(none)'}\n\nRecent game logs:\n${refLogs}`;

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.apiKey}` },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-beta',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error('API down');
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      if (reply) {
        updateCb(reply.trim());
      }
    } catch {
      alert('Grok described generation failed.');
    }
  };

  const getHistoryMessages = () => {
    return activeThread ? activeThread.messages || [] : [];
  };

  // Setup Serialization Code bases
  const handleSerializeGame = () => {
    if (!activeThread) return null;
    const saveState = {
      v: '1.1',
      name: activeThName(),
      history: activeThread.history || [],
      cast: activeThread.cast || [],
      setup: activeThread.setup || {},
      sb: { model: storyboardModel, ratio: storyboardRatio, on: storyboardOn }
    };
    return 'ZAOR1:' + btoa(unescape(encodeURIComponent(JSON.stringify(saveState))));
  };

  const activeThName = () => (activeThread ? activeThread.name : '');

  const handleDeserializeAndLoad = (code: string) => {
    let clean = code.trim();
    if (clean.startsWith('ZAOR1:')) clean = clean.slice(6);
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(clean))));
      const newTh: Thread = {
        id: 'th_' + Date.now(),
        name: payload.name || 'Imported Game',
        createdAt: Date.now(),
        messages: (payload.history || []).map((h: any) => ({
          role: h.role,
          type: 'text',
          content: h.content
        })),
        history: payload.history || [],
        cast: payload.cast || [],
        setup: payload.setup || {}
      };

      setThreads([newTh, ...threads]);
      setCurrentThreadId(newTh.id);

      if (payload.sb) {
        setStoryboardOn(!!payload.sb.on);
        setStoryboardModel(payload.sb.model || 'chroma');
        setStoryboardRatio(payload.sb.ratio || '16:9');
        localStorage.setItem('zaor_sb_on', payload.sb.on ? '1' : '0');
        localStorage.setItem('zaor_sb_model', payload.sb.model || 'chroma');
        localStorage.setItem('zaor_sb_ratio', payload.sb.ratio || '16:9');
      }

      alert('Creative game logs fully loaded! Frames are ready to regenerate.');
    } catch {
      throw new Error('Game check payload failed decoding parameters.');
    }
  };

  // Rename actions
  const executeRename = (val: string) => {
    const updated = threads.map(t => {
      if (t.id === renameId) {
        return { ...t, name: val };
      }
      return t;
    });
    updateThreadsList(updated);
    setRenameId(null);
  };

  const executeDelete = () => {
    const updated = threads.filter(t => t.id !== deleteId);
    if (updated.length === 0) {
      const freshTh: Thread = {
        id: 'th_' + Date.now(),
        name: 'New Game Scene',
        createdAt: Date.now(),
        messages: [],
        history: [],
        cast: []
      };
      updateThreadsList([freshTh]);
      setCurrentThreadId(freshTh.id);
    } else {
      updateThreadsList(updated);
      if (currentThreadId === deleteId) {
        setCurrentThreadId(updated[0].id);
      }
    }
    setDeleteId(null);
  };

  // Re-locks pins on tab hide
  useEffect(() => {
    const lockOnBG = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.removeItem('gs_unlocked');
      }
    };
    document.addEventListener('visibilitychange', lockOnBG);
    return () => document.removeEventListener('visibilitychange', lockOnBG);
  }, []);

  // Upload hooks trigger file clicker
  const handleRegisterUpload = () => {
    const el = document.getElementById('local_upload_file');
    if (el) el.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Images must stay under 8MB to preserve Local Storage performance limits.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const uploadedCard: Message = {
        role: 'user',
        type: 'image',
        src: dataUrl,
        hostedUrl: null,
        alt: 'Local Image upload context',
        modelLabel: 'Uploaded Asset'
      };

      setLastImageUrl(dataUrl);
      setActiveTargetUrl(dataUrl);

      updateCurrentThread(t => ({ ...t, messages: [...t.messages, uploadedCard] }));
      setMode('edit');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Gate PIN screen
  if (!isUnlocked) {
    return <PinScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  const handleToggleStyleLock = (active: boolean, style: string) => {
    setStyleLockActive(active);
    setLockedStyle(style);
    localStorage.setItem('zaor_style_active', active ? '1' : '0');
    localStorage.setItem('zaor_style_lock', style);
  };

  const handleClearStyleLock = () => {
    setStyleLockActive(false);
    setLockedStyle('');
    localStorage.setItem('zaor_style_active', '0');
    localStorage.removeItem('zaor_style_lock');
  };

  const handleAnimateImageWrapped = async (src: string, promptText: string, engine: string, duration: number, res: string) => {
    setIsLoading(true);
    try {
      await executeVideoGen(promptText, src, engine, null, duration, res);
    } catch(e: any) {
      alert('Animate trigger failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertPromptText = (val: string) => {
    setPrompt(prev => prev ? `${prev}, ${val}` : val);
  };

  const handleAddLora = (l: Omit<LoRA, 'id' | 'active'>) => {
    const lorasClone = [...loras];
    const item: LoRA = {
      ...l,
      id: Date.now(),
      active: false
    };
    lorasClone.unshift(item);
    setLoras(lorasClone);
    localStorage.setItem('zaor_loras', JSON.stringify(lorasClone));
    recalcStorageSize();
  };

  const handleToggleLora = (id: number, val: boolean) => {
    const list = loras.map(l => {
      if (l.id === id) return { ...l, active: val };
      return l;
    });
    setLoras(list);
    localStorage.setItem('zaor_loras', JSON.stringify(list));
  };

  const handleUpdateLoraScale = (id: number, scale: number) => {
    const list = loras.map(l => {
      if (l.id === id) return { ...l, scale };
      return l;
    });
    setLoras(list);
    localStorage.setItem('zaor_loras', JSON.stringify(list));
  };

  const handleDeleteLora = (id: number) => {
    const list = loras.filter(l => l.id !== id);
    setLoras(list);
    localStorage.setItem('zaor_loras', JSON.stringify(list));
    recalcStorageSize();
  };

  const handleImportLoras = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        setLoras(parsed);
        localStorage.setItem('zaor_loras', JSON.stringify(parsed));
        alert('LoRA mappings imported successfully!');
        recalcStorageSize();
      }
    } catch {
      alert('Format error: Invalid Backup JSON structure provided.');
    }
  };

  const handleAddCharacter = (char: Character) => {
    const castList = [...(cast || [])];
    castList.push(char);
    updateCurrentThread(t => ({ ...t, cast: castList }));
  };

  const handleUpdateCharacterDesc = (index: number, desc: string) => {
    const castList = [...(cast || [])];
    if (castList[index]) {
      castList[index].desc = desc;
      updateCurrentThread(t => ({ ...t, cast: castList }));
    }
  };

  const handleUpdateCharacterImage = (index: number, imageUrl: string) => {
    const castList = [...(cast || [])];
    if (castList[index]) {
      castList[index].imageUrl = imageUrl;
      updateCurrentThread(t => ({ ...t, cast: castList }));
    }
  };

  const handleDeleteCharacter = (index: number) => {
    const castList = [...(cast || [])];
    castList.splice(index, 1);
    updateCurrentThread(t => ({ ...t, cast: castList }));
  };

  const cast = activeThread ? activeThread.cast || [] : [];
  const currentSetup = activeThread ? activeThread.setup || { premise: '', tone: '', style: '', characters: '' } : { premise: '', tone: '', style: '', characters: '' };

  const handleSaveSetup = (sb: StorySetup) => {
    updateCurrentThread(t => ({ ...t, setup: sb }));
  };

  const storyboardFrames = activeThread ? activeThread.messages.filter(m => m.type === 'storyboard') : [];

  return (
    <div className="flex h-full w-full overflow-hidden select-none bg-[#1a1a2e] text-[#f0ece4]">
      {/* File Upload hidden triggers */}
      <input
        type="file"
        id="local_upload_file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Campaign Sidebar */}
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={(id) => setCurrentThreadId(id)}
        onCreateThread={handleCreateThread}
        onDeleteThreadClick={(id, name) => {
          setDeleteId(id);
          setDeleteName(name);
          setActiveModal('delete');
        }}
        onRenameThreadClick={(id, name) => {
          setRenameId(id);
          setRenameName(name);
          setActiveModal('rename');
        }}
        storageSizeMB={storageSizeMB}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Central View Sandbox Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Navigation Core Header Header */}
        <header className="flex justify-between items-center p-3 border-b border-white/5 bg-[#1a1a2e] relative z-25">
          <div className="flex items-center gap-2 max-w-xs md:max-w-xl">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 px-2 rounded-lg bg-[#252538] text-[#9a96a8] hover:text-[#f0ece4] md:hidden cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <span className="text-xs text-[#9a96a8] font-serif truncate">
              {activeThread ? activeThread.name : 'Decryption Engine'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Story Campaign Setup */}
            <button
              onClick={() => {
                setActiveModal('setup');
              }}
              className="p-1.5 rounded-lg border bg-[#252538] border-white/5 text-[#9a96a8] hover:text-[#f0ece4] hover:bg-[#2e2e48] transition-colors cursor-pointer"
              title="Story campaign scenario setup / premise"
            >
              <BookOpen size={15} />
            </button>

            {/* Casting & Characters */}
            <button
              onClick={() => {
                setActiveModal('cast');
              }}
              className="p-1.5 rounded-lg border bg-[#252538] border-white/5 text-[#9a96a8] hover:text-[#f0ece4] hover:bg-[#2e2e48] transition-colors cursor-pointer"
              title="Casting sheets & character profiles"
            >
              <Users size={15} />
            </button>

            {/* Quick Storyboard Toggles Direct Access */}
            <button
              onClick={() => {
                setActiveModal('storyboard');
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                storyboardOn ? 'bg-[#c9b8e8]/10 border-[#c9b8e8]/20 text-[#c9b8e8]' : 'bg-[#252538] border-white/5 text-[#9a96a8] hover:text-white'
              }`}
              title="Storyboard director trigger state settings"
            >
              🎬
            </button>

            {/* Overflow Expansion Options trigger */}
            <div className="relative">
              <button
                onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
                className="p-1.5 px-3 bg-[#252538] border border-white/5 text-[#9a96a8] hover:text-[#f0ece4] rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                •••
              </button>

              {overflowMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#252538] border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('setup');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen size={12} className="text-[#c9b8e8]" /> Setup Scenario Premise
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('cast');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Users size={12} className="text-[#c9b8e8]" /> Casting & Characters
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('library');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Library size={12} className="text-[#c9b8e8]" /> Prompt Templates Log
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('lora');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Dna size={12} className="text-[#c9b8e8]" /> LoRA Setup Matrix
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('savegame');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={12} className="text-[#c9b8e8]" /> Port codes / Save Backup
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('drawthings');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#f0ece4] hover:bg-[#2e2e48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Cpu size={12} className="text-[#c9b8e8]" /> Draw Things Code Compile
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      window.location.reload();
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-[#c47a8a] hover:bg-neutral-800/10 border-t border-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Force Flush Cache
                  </button>
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setActiveModal('api');
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key size={12} /> Set Credentials API Keys
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Message logs panel */}
        <MessageFeed
          messages={activeThread ? activeThread.messages : []}
          isLoading={isLoading}
          promptEngineerMode={promptEngineerMode}
          onRetryText={async () => {
            if (activeThread && activeThread.history.length > 0) {
              const lastUser = [...activeThread.history].reverse().find(h => h.role === 'user');
              if (lastUser) {
                setIsLoading(true);
                try {
                  await executeTextChat(lastUser.content);
                } catch (e: any) {
                  const errCard: Message = { role: 'assistant', type: 'error', content: e.message };
                  updateCurrentThread(t => ({ ...t, messages: [...t.messages, errCard] }));
                } finally {
                  setIsLoading(false);
                }
              }
            }
          }}
          onAnimateImage={onAnimateImage}
          onEditImage={onEditImage}
          styleLockActive={styleLockActive}
          lockedStyle={lockedStyle}
          onPinForPE={(src, type, label) => {
            setPinnedPeUrl(src);
            setPinnedPeType(type);
            setPinnedPeLabel(label);
            setPeUseImage(true);
            setPromptEngineerMode(true);
          }}
          pinnedPeUrl={pinnedPeUrl}
          activeTargetUrl={activeTargetUrl}
          onSetEditTarget={(src) => {
            if (activeTargetUrl === src) {
              setActiveTargetUrl(null);
            } else {
              setActiveTargetUrl(src);
              setLastImageUrl(src);
            }
          }}
          onCloudSave={handleCloudSaveAction}
          onGrabLastFrame={handleGrabVideoFrame}
          onRetryVideo={(promptTxt, parentEngine, dur, resolution) => {
            executeVideoGen(promptTxt, null, parentEngine === 'WaveSpeed WAN 2.2' ? 'wan22spicy' : 'aurora', null, dur, resolution);
          }}
          onSaveToFiles={onSaveToFiles}
          editModelsHtml=""
        />

        {/* Controller Input Row */}
        <InputControls
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
          }}
          prompt={prompt}
          onPromptChange={(val) => setPrompt(val)}
          onSubmit={handleSend}
          isLoading={isLoading}
          styleLockActive={styleLockActive}
          lockedStyle={lockedStyle}
          onToggleStyleLock={handleToggleStyleLock}
          onClearStyleLock={handleClearStyleLock}
          imageModel={imageModel}
          onChangeImageModel={setImageModel}
          imageRatio={imageRatio}
          onChangeImageRatio={setImageRatio}
          imageRes={imageRes}
          onChangeImageRes={setImageRes}
          imageCount={imageCount}
          onChangeImageCount={setImageCount}
          imageSteps={imageSteps}
          onChangeImageSteps={setImageSteps}
          imageGuidance={imageGuidance}
          onChangeImageGuidance={setImageGuidance}
          videoEngine={videoEngine}
          onChangeVideoEngine={setVideoEngine}
          videoDur={videoDur}
          onChangeVideoDur={setVideoDur}
          videoRes={videoRes}
          onChangeVideoRes={setVideoRes}
          videoRatio={videoRatio}
          onChangeVideoRatio={setVideoRatio}
          cleanModel={cleanModel}
          onChangeCleanModel={setCleanModel}
          onAutoClean={handleAutoCleanSubmit}
          upscaleModel={upscaleModel}
          onChangeUpscaleModel={setUpscaleModel}
          upscaleRes={upscaleRes}
          onChangeUpscaleRes={setUpscaleRes}
          onUpscaleSubmit={handleUpscaleSubmit}
          hasEditTarget={!!lastImageUrl}
          editModel={editModel}
          onChangeEditModel={setEditModel}
          onUploadClick={handleRegisterUpload}
          costEstimate={costStr}
          promptEngineerMode={promptEngineerMode}
          onTogglePromptEngineerMode={setPromptEngineerMode}
        />

        {/* Prompt Engineer - Glassmorphic Floating Action Dock */}
        {promptEngineerMode && (
          <div className="absolute bottom-[92px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-[#1b1b2f]/85 backdrop-blur-xl border border-[#c9b8e8]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(201,184,232,0.15)] rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header Badge & Title */}
            <div className="flex items-center justify-between md:justify-start gap-2 border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-3 shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#c9b8e8] tracking-widest flex items-center gap-1.5 bg-[#c9b8e8]/10 px-2.5 py-1 rounded-full border border-[#c9b8e8]/20">
                <Sparkles size={11} className="text-[#c9b8e8] animate-pulse" /> Prompt Eng.
              </span>
              <button
                onClick={() => setPromptEngineerMode(false)}
                className="md:hidden text-white/40 hover:text-white/80 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                title="Deactivate PE Mode"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main Controls Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs items-center">
              {/* Target Synthesis Selection */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[9px] text-[#9a96a8] uppercase font-bold tracking-wider">
                  <span>Target Synthesis Model</span>
                </div>
                <select
                  value={peSelectedModel}
                  onChange={(e) => setPeSelectedModel(e.target.value)}
                  className="bg-[#121222]/90 border border-white/10 focus:border-[#c9b8e8]/50 outline-none rounded-lg p-1.5 text-xs text-[#dcd7ec] hover:bg-[#121222]/100 transition-colors cursor-pointer"
                >
                  <option value="aurora">Flux/Aurora Image</option>
                  <option value="zimage">Z-Image (No-Negatives)</option>
                  <option value="wan26t2v">Wan 2.6 Image</option>
                  <option value="seedance15t2v">Seedance T2V</option>
                  <option value="aurora_i2v">Aurora Video (I2V)</option>
                  <option value="ltx23">Lightricks LTX 2.3 Video (With Audio)</option>
                </select>
              </div>

              {/* Visual Sandbox Anchor Context */}
              <div className="flex flex-col gap-1 justify-center">
                <span className="text-[9px] text-[#9a96a8] uppercase font-bold tracking-wider">Visual Anchor Context</span>
                <div className="flex items-center gap-2 bg-[#121222]/55 border border-white/5 p-1.5 rounded-lg h-[34px]">
                  {pinnedPeUrl ? (
                    <>
                      <div className="relative w-6 h-6 rounded overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                        {pinnedPeType === 'video' ? (
                          <div className="text-[8px] text-white">🎬</div>
                        ) : (
                          <img src={pinnedPeUrl} className="w-full h-full object-cover" alt="Anchor Preview" referrerPolicy="no-referrer" />
                        )}
                        <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <span className="text-[11px] text-[#c9b8e8] font-mono truncate max-w-[110px] md:max-w-[130px]" title={pinnedPeLabel || 'Asset'}>
                        {pinnedPeLabel || 'Pinned Frame'}
                      </span>
                      <button
                        onClick={() => {
                          setPinnedPeUrl(null);
                          setPinnedPeType(null);
                          setPinnedPeLabel(null);
                        }}
                        className="ml-auto p-1 text-white/40 hover:text-[#c47a8a] hover:bg-[#c47a8a]/10 rounded transition-all cursor-pointer"
                        title="Clear Context Pin"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/40 italic flex items-center gap-1 pl-1">
                      📌 No anchor (all roleplay text)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Finalizers */}
            <div className="flex items-center gap-2 border-t md:border-t-0 border-white/10 pt-2 md:pt-0 shrink-0">
              <button
                onClick={handleFinalizePromptEng}
                disabled={isLoading}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-[#c9b8e8] to-[#9a86cc] text-[#1a1a2e] rounded-xl text-xs font-bold hover:shadow-[0_0_12px_rgba(201,184,232,0.4)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-[#1a1a2e] border-t-transparent rounded-full" />
                ) : (
                  <span>🚀</span>
                )}
                <span>Finalize Architect</span>
              </button>

              <button
                onClick={() => setPromptEngineerMode(false)}
                className="hidden md:flex p-2 text-[#9a96a8] hover:text-[#f0ece4] hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                title="Close PE Deck"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Dialog Overlays */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        keys={keys}
        onSaveKeys={saveKeys}
        storageSizeMB={storageSizeMB}
        onClearMedia={handleClearMedia}
        onClearAllChats={handleClearAllChats}
        userPrompts={userPrompts}
        onSaveUserPrompt={(title, text) => {
          const item: PromptTemplate = { type: 'modifier', cat: 'Mine', title, text, isUser: true };
          const list = [item, ...userPrompts];
          setUserPrompts(list);
          localStorage.setItem('zaor_user_prompts', JSON.stringify(list));
          recalcStorageSize();
        }}
        onDeleteUserPrompt={(id) => {
          const list = userPrompts.filter((p: any) => p.id !== id);
          setUserPrompts(list);
          localStorage.setItem('zaor_user_prompts', JSON.stringify(list));
          recalcStorageSize();
        }}
        onInsertPromptText={handleInsertPromptText}
        loras={loras}
        onAddLora={handleAddLora}
        onToggleLora={handleToggleLora}
        onUpdateLoraScale={handleUpdateLoraScale}
        onDeleteLora={handleDeleteLora}
        onImportLoras={handleImportLoras}
        storyboardOn={storyboardOn}
        onToggleStoryboard={(val) => {
          setStoryboardOn(val);
          localStorage.setItem('zaor_sb_on', val ? '1' : '0');
        }}
        storyboardModel={storyboardModel}
        onChangeStoryboardModel={(val) => {
          setStoryboardModel(val);
          localStorage.setItem('zaor_sb_model', val);
        }}
        storyboardRatio={storyboardRatio}
        onChangeStoryboardRatio={(val) => {
          setStoryboardRatio(val);
          localStorage.setItem('zaor_sb_ratio', val);
        }}
        cast={cast}
        onAddCharacter={handleAddCharacter}
        onUpdateCharacterDesc={handleUpdateCharacterDesc}
        onUpdateCharacterImage={handleUpdateCharacterImage}
        onDeleteCharacter={handleDeleteCharacter}
        onHelpWriteCharacter={handleCharacterAutoHelp}
        setup={currentSetup}
        onSaveSetup={handleSaveSetup}
        onSerializeGame={handleSerializeGame}
        onDeserializeGame={handleDeserializeAndLoad}
        storyboardFrames={storyboardFrames}
        onExportDT={() => {}}
        renameId={renameId}
        renameName={renameName}
        onSaveRename={executeRename}
        deleteId={deleteId}
        deleteName={deleteName}
        onConfirmDelete={executeDelete}
      />
    </div>
  );

  async function executeEditFromStoryboard(promptText: string, srcUrl: string, editModelId: string) {
     return await runEditFromStoryboard(promptText, srcUrl, editModelId);
  }

  async function onAnimateImage(src: string, p: string, engine: string, duration: number, res: string) {
     return await handleAnimateImageWrapped(src, p, engine, duration, res);
  }

  async function onEditImage(promptText: string, srcUrl: string, editModelId: string) {
    setIsLoading(true);
    try {
      await executeEditImage(promptText, srcUrl, editModelId);
    } catch (e: any) {
      alert('Edit failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  function onSaveToFiles(src: string, altText: string) {
    const safeName = (altText || 'image').slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `zaor_rendered_${safeName}_${Date.now()}.mp4`;
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {
        window.open(src, '_blank');
      });
  }
}
