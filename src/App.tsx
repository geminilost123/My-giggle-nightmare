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
  atlasPrepareImage,
  extractAtlasUrl,
  pollAtlasPrediction,
  resolveKey
} from './api';
import {
  PE_SYSTEM_PROMPTS,
  DIRECTOR_SYSTEM,
  directorModelGuide
} from './data';
import { loadThreadsIDB, saveThreadsIDB, clearThreadsIDB } from './storage';
import {
  Sparkles, Menu, ShieldAlert, Key, Library, Dna, Settings, Users,
  BookOpen, Save, Cpu, RefreshCw, X, Check, HelpCircle, Trash2
} from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) setIsUnlocked(true);
      })
      .catch(console.error);
  }, []);

  // Api Keys & Local Storage credentials
  const [keys, setKeys] = useState(() => {
    let chatStr = resolveKey('xai_chat_model', import.meta.env.VITE_XAI_CHAT_MODEL || 'grok-2-latest');
    // Sanitize old breaking models from localStorage
    if (chatStr === 'grok-2-1212' || chatStr === 'grok-beta' || chatStr === 'grok-2') {
      chatStr = 'grok-2-latest';
    }
    return {
      apiKey: resolveKey('xai_key', import.meta.env.VITE_XAI_KEY || ''),
      wavespeedKey: resolveKey('ws_key', import.meta.env.VITE_WAVESPEED_KEY || ''),
      atlasKey: resolveKey('atlas_key', import.meta.env.VITE_ATLAS_KEY || ''),
      cloudinaryCloud: resolveKey('cloudinary_cloud', import.meta.env.VITE_CLOUDINARY_CLOUD || ''),
      cloudinaryPreset: resolveKey('cloudinary_preset', import.meta.env.VITE_CLOUDINARY_PRESET || ''),
      chatModel: chatStr
    };
  });

  const [storageSizeMB, setStorageSizeMB] = useState<string>('0.0');

  // Active Game State
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Active inputs
  const [prompt, setPrompt] = useState<string>('');
  const [mode, setMode] = useState<'chat' | 'image' | 'video' | 'enhance' | 'edit'>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingCastImage, setPendingCastImage] = useState<{ src: string, alt: string } | null>(null);

  // LoRA State
  const [loras, setLoras] = useState<LoRA[]>([]);

  // Prompt Templates Drawer
  const [userPrompts, setUserPrompts] = useState<PromptTemplate[]>([]);

  // Style Lock Parameters
  const [styleLockActive, setStyleLockActive] = useState<boolean>(false);
  const [lockedStyle, setLockedStyle] = useState<string>('');

  useEffect(() => {
    // Keep chat model flexible but sanitize invalid ones
    if (keys.chatModel === 'grok-2-1212' || keys.chatModel === 'grok-beta' || keys.chatModel === 'grok-2') {
      setKeys(k => ({ ...k, chatModel: 'grok-2-latest' }));
    }
  }, [keys.chatModel]);

  // Storyboard Configuration Rules
  const [storyboardOn, setStoryboardOn] = useState<boolean>(false);
  const [storyboardModel, setStoryboardModel] = useState<string>('chroma');
  const [storyboardRatio, setStoryboardRatio] = useState<string>('16:9');
  const [storyParaLimit, setStoryParaLimit] = useState<number>(2);

  // Image & Video controls state
  const [imageModel, setImageModel] = useState<string>('aurora-simple');
  const [imageRatio, setImageRatio] = useState<string>('1:1');
  const [imageRes, setImageRes] = useState<string>('1K');
  const [imageCount, setImageCount] = useState<number>(1);
  const [imageSteps, setImageSteps] = useState<number>(28);
  const [imageGuidance, setImageGuidance] = useState<number>(3.5);

  const [videoEngine, setVideoEngine] = useState<string>('aurora-t2v');
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

  // 1. Initial Load from LocalStorage / IDB
  useEffect(() => {
    // Threads
    const loadThreads = async () => {
      try {
        const stored = await loadThreadsIDB();
        if (stored && Array.isArray(stored) && stored.length > 0) {
          const patched = stored.map(t => ({
            ...t,
            messages: Array.isArray(t.messages) ? t.messages : [],
            history: Array.isArray(t.history) ? t.history : [],
            cast: Array.isArray(t.cast) ? t.cast : [],
            setup: t.setup || {}
          }));
          setThreads(patched);
          setCurrentThreadId(patched[0].id);
        } else {
          const defaultTh: Thread = {
            id: 'th_' + Date.now(),
            name: 'New Game Scene',
            createdAt: Date.now(),
            messages: [],
            history: [],
            cast: []
          };
          await saveThreadsIDB([defaultTh]);
          setThreads([defaultTh]);
          setCurrentThreadId(defaultTh.id);
        }
      } catch (e) {
        console.error('Thread loading error:', e);
      }
    };
    loadThreads();

    // Style Lock
    try {
      const sActive = localStorage.getItem('zaor_style_active') === '1';
      setStyleLockActive(sActive);
      setLockedStyle(localStorage.getItem('zaor_style_lock') || '');
    } catch {
      setStyleLockActive(false);
      setLockedStyle('');
    }

    // Storyboard
    try {
      setStoryboardOn(localStorage.getItem('zaor_sb_on') === '1');
      setStoryboardModel(localStorage.getItem('zaor_sb_model') || 'chroma');
      setStoryboardRatio(localStorage.getItem('zaor_sb_ratio') || '16:9');
      setStoryParaLimit(parseInt(localStorage.getItem('zaor_sb_para') || '2', 10));
    } catch {}

    // LoRAs
    try {
      const defaultHardcodedLoras = [
        { id: 90001, name: 'Z-Image Anime 01', url: 'https://civitai.com/api/download/models/2448896', trigger: '', base: 'Z-Image', category: 'style', scale: 0.85, notes: 'Flat, vibrant 2D anime style', active: false },
        { id: 90002, name: 'Z-Image-Turbo-Anime', url: 'https://civitai.com/api/download/models/2543657', trigger: '', base: 'Z-Image', category: 'style', scale: 0.85, notes: 'Foundational anime style for turbo', active: false },
        { id: 90003, name: 'Z-IMAGE ANIME - ILL', url: 'https://civitai.com/api/download/models/2463859', trigger: '', base: 'Z-Image', category: 'style', scale: 0.85, notes: 'High-contrast digital illustration', active: false },
        { id: 90004, name: 'Milo Manara', url: 'https://civitai.com/api/download/models/2545735', trigger: '', base: 'Z-Image', category: 'style', scale: 0.85, notes: 'Comic-book ink and color style', active: false },
        { id: 90005, name: 'samdoearts', url: 'https://civitai.com/api/download/models/2541753', trigger: '', base: 'Z-Image', category: 'style', scale: 0.85, notes: 'Semi-realistic 3D-cartoon digital painting', active: false },
        { id: 90006, name: 'SNOFS (Klein 9B)', url: 'https://civitai.red/api/download/models/2960556?fileId=2839878', trigger: '', base: 'Flux2-Klein', category: 'realism', scale: 0.85, notes: 'NSFW Training - High flexibility', active: false },
        { id: 90007, name: 'Lenovo styles real', url: 'https://civitai.com/api/download/models/2545735', trigger: '', base: 'Flux2-Klein', category: 'realism', scale: 0.85, notes: 'Highly realistic details for Klein', active: false },
        { id: 90008, name: 'Anatomy detail fix', url: 'https://civitai.com/api/download/models/2541753', trigger: '', base: 'Flux2-Klein', category: 'realism', scale: 0.85, notes: 'Improves body proportions and anatomical details', active: false }
      ];

      const storedStr = localStorage.getItem('zaor_loras');
      let loadedLoras: any[] = [];
      if (storedStr && storedStr !== 'null' && storedStr !== 'undefined') {
        const parsed = JSON.parse(storedStr);
        if (Array.isArray(parsed)) {
          loadedLoras = parsed.map(l => {
            let updated = { ...l };
            if (updated.base === 'Klein') updated.base = 'Flux2-Klein';
            // Fix cached dummy URLs
            if (updated.url === 'https://civitai.com/api/download/models/1234567') {
              updated.url = 'https://civitai.com/api/download/models/2545735';
            }
            if (updated.url === 'https://civitai.com/api/download/models/8765432') {
              updated.url = 'https://civitai.com/api/download/models/2541753';
            }
            return updated;
          });
        }
      } else {
        const envLoras: LoRA[] = [];
        const lora1Url = import.meta.env.VITE_LORA_1_URL;
        if (lora1Url) {
          envLoras.push({
            id: Date.now() + 1,
            name: import.meta.env.VITE_LORA_1_NAME || `Env LoRA 1`,
            url: lora1Url,
            trigger: import.meta.env.VITE_LORA_1_TRIGGER || '',
            base: import.meta.env.VITE_LORA_1_BASE || 'Flux',
            scale: 1,
            notes: 'Loaded from Secrets',
            active: true
          });
        }
        const lora2Url = import.meta.env.VITE_LORA_2_URL;
        if (lora2Url) {
          envLoras.push({
            id: Date.now() + 2,
            name: import.meta.env.VITE_LORA_2_NAME || `Env LoRA 2`,
            url: lora2Url,
            trigger: import.meta.env.VITE_LORA_2_TRIGGER || '',
            base: import.meta.env.VITE_LORA_2_BASE || 'Flux',
            scale: 1,
            notes: 'Loaded from Secrets',
            active: true
          });
        }
        const lora3Url = import.meta.env.VITE_LORA_3_URL;
        if (lora3Url) {
          envLoras.push({
            id: Date.now() + 3,
            name: import.meta.env.VITE_LORA_3_NAME || `Env LoRA 3`,
            url: lora3Url,
            trigger: import.meta.env.VITE_LORA_3_TRIGGER || '',
            base: import.meta.env.VITE_LORA_3_BASE || 'Flux',
            scale: 1,
            notes: 'Loaded from Secrets',
            active: true
          });
        }
        loadedLoras = envLoras;
      }

      const toAdd = defaultHardcodedLoras.filter(dl => !loadedLoras.find(l => l.url === dl.url));
      const finalList = [...loadedLoras, ...toAdd];
      setLoras(finalList);
      
      if (finalList.length > 0) {
        localStorage.setItem('zaor_loras', JSON.stringify(finalList));
      }
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
    saveThreadsIDB(updatedList);
    recalcStorageSize();
  };

  const updateCurrentThread = (updater: (t: Thread) => Thread) => {
    if (!currentThreadId) return;
    setThreads(prev => {
      const newList = prev.map(t => {
        if (t.id === currentThreadId) {
          return updater(t);
        }
        return t;
      });
      
      // Defer side-effects so React updater remains pure
      setTimeout(() => {
        saveThreadsIDB(newList);
        recalcStorageSize();
      }, 0);
      
      return newList;
    });
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
       const entry = MODEL_REGISTRY[videoEngine];
       const rate = entry ? (entry.pricePerS || entry.price || 0.05) : 0.05;
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

  const handleClearAllChats = async () => {
    await clearThreadsIDB();
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
    let parts = [];
    if (s && s.premise) parts.push('PREMISE: ' + s.premise);
    if (s && s.tone) parts.push('TONE: ' + s.tone);
    
    let baseStr = parts.length > 0
      ? 'You are running an interactive story campaign for the user. Stay consistent with this setup context:\n\n' + parts.join('\n') + '\n\nNarrate vivid developments keeping matching tones. The user directs campaign turns, you act as storyteller.'
      : 'You are running an interactive story campaign for the user. Narrate vivid developments. The user directs campaign turns, you act as storyteller.';
      
    baseStr += '\n\nCRITICAL AI STORY DIRECTIVE: Do NOT introduce ANY new characters into the story unless the user explicitly prompts for them or they are essential generic background extras. Stick to the current cast. If the user introduces a character, you may adopt them.';
    
    return baseStr;
  };

  // Text Completion Engine via direct xAI completions fetch
  const executeTextChat = async (userText: string) => {
    if (!activeThread) return;

    // Compose PE context or Setup directives
    const sysPromptBase = promptEngineerMode
      ? PE_SYSTEM_PROMPTS[peSelectedModel] || PE_SYSTEM_PROMPTS.aurora
      : (storyboardOn 
          ? buildStorySetupSystem(activeThread.setup) 
          : 'You are an exceptionally capable AI assistant. Be direct, helpful, and concise. CRITICAL: The user has disabled story mode. Even if prior chat history contains narrative story prose, you MUST NOT continue the story or narrate. Respond directly and functionally to the user\'s latest prompt.');
      
    const sysPrompt = !promptEngineerMode && storyboardOn && storyParaLimit > 0
      ? sysPromptBase + `\n\nCRITICAL RULE: For pacing, limit your narration replies to a MAXIMUM of ${storyParaLimit} paragraphs. Do not write huge walls of text.`
      : sysPromptBase;

    const historyPayload = activeThread.history.slice(-3).map(h => {
      let payloadContent: any = h.content;
      if (typeof h.content === 'string' && h.content.startsWith('data:')) {
        payloadContent = [
          { type: 'image_url', image_url: { url: h.content, detail: 'high' } }
        ];
      } else if (typeof h.content !== 'string') {
        payloadContent = JSON.stringify(h.content);
      }
      return {
        role: h.role,
        content: payloadContent
      };
    });

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
          content: [
            { type: 'text', text: typeof messagesPayload[lastIdx].content === 'string' ? messagesPayload[lastIdx].content : 'Prompt Engineer Request' },
            { type: 'image_url', image_url: { url: peUrl, detail: 'high' } }
          ]
        } as any;
      }
    }

    const res = await fetch('/api/proxy/xai/v1/chat/completions', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: keys.chatModel || 'grok-2-latest',
        messages: messagesPayload,
        max_tokens: 2048
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let errMessage = 'Grok direct blocked call.';
      try {
        const errBody = JSON.parse(errText);
        errMessage = errBody?.error?.message || errBody?.error || errBody?.message || errText || errMessage;
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
    const activeLorasList = loras.filter(l => l.active);
    const hasMismatch = activeLorasList.some(l => {
      if (!l.base || l.base === 'Other' || !registryEntry.loraBase) return false;
      if (registryEntry.loraBase === 'Z-Image' && l.base === 'Flux') return false;
      if (registryEntry.loraBase === 'Flux' && l.base === 'Z-Image') return false;
      return l.base !== registryEntry.loraBase;
    });
    if (hasMismatch) {
      setTimeout(() => alert("Warning: Model / LoRA mismatch. Expect unexpected results or API errors."), 10);
    }
    
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

    // Trigger count map in parallel
    const promises = Array.from({ length: imageCount }).map(() => 
      callModel(imageModel, {
        prompt: fullyStyledPrompt,
        aspectRatio: imageRatio,
        resolution: imageRes,
        steps: imageSteps,
        guidance: imageGuidance,
        loras: reqLoras
      })
    );
    const urls = await Promise.all(promises);
    urls.forEach(url => {
      if (url) resArray.push(url);
    });

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
    engineId: string = 'aurora-t2v',
    prevVideo: string | null = null,
    customDur: number | null = null,
    customRes: string | null = null
  ) => {
    // WaveSpeed video engines polling or Grok extensions
    const actualEngine = engineId || videoEngine || 'aurora-t2v';
    const durRaw = customDur || videoDur;
    const resolution = customRes || videoRes;

    let taskId = '';
    let pollingUrl = '';
    let extractFn: (data: any) => string | null = () => null;

    const m = MODEL_REGISTRY[actualEngine];
    if (m?.provider === 'atlas') {
      if (!keys.atlasKey) throw new Error('Atlas Cloud Key required.');
      const finalSrc = imgContext && imgContext.startsWith('data:')
        ? await atlasPrepareImage(imgContext, keys.atlasKey)
        : imgContext;

      // Build body using registry
      const atlasBody = m.buildBody({
        prompt: promptText,
        image: finalSrc || undefined,
        video: prevVideo || undefined,
        duration: durRaw,
        resolution,
        aspectRatio: videoRatio
      });

      const res = await fetch('/api/proxy/atlas/api/v1/model/generateImage', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m.path,
          ...atlasBody
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Atlas cloud error ${res.status}: ${err?.message || 'Error occurred.'}`);
      }

      const data = await res.json();
      
      let outUrl = extractAtlasUrl(data);
      if (!outUrl) {
        const predId = data.id || data.data?.id || data.outputs?.[0]?.id || data.task_id || data.data?.task_id;
        if (predId) {
          outUrl = await pollAtlasPrediction(predId, keys.atlasKey);
        }
      }

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

    if (m?.provider === 'xai-video') {
      if (!keys.apiKey) throw new Error('xAI Keystore key is missing');
      let endpoint = prevVideo ? '/api/proxy/xai/v1/videos/extensions' : '/api/proxy/xai/v1/videos/generations';
      const xaiBody = {
        model: m.path,
        ...m.buildBody({
          prompt: promptText,
          image: imgContext || undefined,
          video: prevVideo || undefined,
          resolution,
          duration: durRaw,
          aspectRatio: videoRatio
        })
      };

      const res = await fetch(endpoint, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xaiBody)
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('xAI returned 404 Not Found. This endpoint or feature might not be available yet. Try a different model like Wan 2.2 for extending.');
        }
        let errText = await res.text();
        let errMsg = 'Server block response.';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.message || errJson?.message || errText;
        } catch (e) {
          errMsg = errText.slice(0, 50); // limit chars
        }
        throw new Error(`Aurora Video Failed (${res.status}): ${errMsg}`);
      }

      const resData = await res.json();
      const requestId = resData.request_id || resData.id;
      let syncUrl = null;
      if (resData.url || resData.video_url || (resData.video && resData.video.url)) {
        syncUrl = resData.url || resData.video_url || resData.video.url;
        extractFn = () => syncUrl;
      }

      if (!requestId && !syncUrl) {
        throw new Error(`xAI failed to dispatch reference parameters ID. Response: ${JSON.stringify(resData).slice(0, 50)}`);
      }

      pollingUrl = requestId ? `/api/proxy/xai/v1/videos/${requestId}` : '';
      extractFn = d => {
        if (syncUrl) return syncUrl;
        const s = String(d.status || d.state || '').toLowerCase();
        if (s === 'done' || s === 'completed') {
          const out = d.video?.url || d.video_url || d.url || null;
          return typeof out === 'string' ? out : null;
        }
        if (['failed', 'expired', 'error'].includes(s)) {
          if (d.error?.message) return `FAILED: ${d.error.message}`;
          return 'FAILED';
        }
        return null;
      };
    } else {
      // WaveSpeed WAN & Extended Edits
      if (!keys.wavespeedKey) throw new Error('WaveSpeed Credentials Key required.');
      let body: any;
      let path = '';

      if (m && m.provider === 'wavespeed') {
        path = m.path;
        body = m.buildBody({
          prompt: promptText,
          image: imgContext || undefined,
          video: prevVideo || undefined,
          resolution,
          duration: durRaw,
          aspectRatio: videoRatio
        });
      } else {
        throw new Error(`Unsupported model or missing registry definition: ${actualEngine}`);
      }

      const res = await fetch(`/api/proxy/wavespeed/api/v3/${path}`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`WaveSpeed Submit Failed: ${err?.message || 'Block validation issue.'}`);
      }

      const resData = await res.json();
      taskId = resData.data?.id || resData.id;
      if (!taskId) throw new Error('taskId retrieval failed');

      pollingUrl = `/api/proxy/wavespeed/api/v3/predictions/${taskId}/result`;
      extractFn = d => {
        const s = d.data?.status || d.status;
        if (s === 'completed') return d.data?.outputs?.[0] || d.outputs?.[0] || null;
        if (s === 'failed') return 'FAILED';
        return null;
      };
    }

    // Support synchronous success 
    let syncOutUrl = null;
    if (m?.provider === 'xai-video' && !pollingUrl) {
       syncOutUrl = extractFn({}); 
    }

    // Call fetch loop
    let loops = 0;
    while (loops < 120) {
      if (syncOutUrl) break;
      await new Promise(r => setTimeout(r, 5000));
      loops++;

      const pHeaders = {};

      const check = await fetch(pollingUrl, { credentials: 'include', headers: pHeaders }).catch(() => null);
      if (!check) continue;
      if (!check.ok) {
        if (check.status === 401 || check.status === 403 || check.status === 404) {
          const errBody = await check.text().catch(() => 'Unknown polling error');
          throw new Error(`Video polling failed (${check.status}): ${errBody}`);
        }
        continue; // Retro/transient server errors
      }

      const cData = await check.json().catch(() => ({}));
      const extracted = extractFn(cData);

      if (typeof extracted === 'string' && extracted.startsWith('FAILED')) {
        throw new Error(`Video generation failed at remote backend: ${extracted.replace('FAILED', '')}`);
      }
      if (extracted) {
        syncOutUrl = extracted;
        break;
      }
    }
    
    if (syncOutUrl) {
      const videoCard: Message = {
        role: 'assistant',
        type: 'video',
        src: syncOutUrl,
        alt: promptText,
        engineLabel: m?.label ? m.label.split('·')[0].split('[')[0].trim() : 'Video',
        storedDuration: durRaw,
        storedRes: resolution
      };
      updateCurrentThread(t => ({ ...t, messages: [...t.messages, videoCard] }));
      return;
    }

    throw new Error('Video polling timed out after 10 minutes.');
  };

  // Storyboard Director checks & parse sequence
  const executeStoryDirectorPass = async (userBeat: string, aiStoryReply: string, force: boolean = false) => {
    if (!keys.apiKey) {
      if (force) throw new Error("xAI API key is missing. Required for director pass.");
      return;
    }
    try {
      const guide = directorModelGuide(storyboardModel);
      let system = DIRECTOR_SYSTEM
        .replace('{MODEL}', storyboardModel)
        .replace('{MODELGUIDE}', guide);

      if (activeThread?.setup?.style) {
        system += `\n\nCRITICAL ENFORCED AESTHETIC STYLE: ${activeThread.setup.style}. CRITICAL RULE: Make sure all your image prompts adopt terminology that supports this style. (e.g. if the style is "watercolor", do NOT use terms like "35mm photograph" or "cinematic lighting").`;
      }

      if (force) {
        system += `\n\nCRITICAL OVERRIDE: The user has manually requested a frame generation for this exact beat. You MUST output FRAME: yes and provide a vivid IMAGE_PROMPT and VIDEO_PROMPT.`;
      }

      const castKnownStr = activeThread && activeThread.cast?.length > 0
        ? '\n\nREUSE THESE CAST PROFILE DETAILS IN PROMPTS IF RETURNING CHARACTERS APPEAR:\n' +
          activeThread.cast.map(c => `- ${c.name}: ${c.desc}`).join('\n')
        : '';

      const contentPrompt = `Beat Context Turn:\nUser: ${userBeat}\nStory: ${aiStoryReply}${castKnownStr}`;

      const res = await fetch('/api/proxy/xai/v1/chat/completions', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-2-latest',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: contentPrompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!res.ok) {
        if (force) {
          const errText = await res.text();
          throw new Error(`API returned ${res.status}: ${errText}`);
        }
        return; // Silent discard so storytelling logic never crashes on parsing
      }

      const data = await res.json();
      const blockText = data.choices?.[0]?.message?.content || '';

      const cleanBlockText = blockText.replace(/[*#]/g, '');

      // Match block parameters
      const frameMatch = cleanBlockText.match(/FRAME:\s*yes/i);
      if (!frameMatch) {
        if (!force) return; // Silent discard so storytelling logic never crashes on parsing
      }

      const sec = (name: string) => {
        const re = new RegExp(name + ':\\s*([\\s\\S]*?)(?=\\n\\s*(?:FRAME|REASON|IMAGE_PROMPT|VIDEO_PROMPT|CAST):|$)', 'i');
        const m = cleanBlockText.match(re);
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
        await executeStoryboardFrameCompile(imagePrompt, videoPrompt, reason, force);
      } else {
        if (force) throw new Error("Director generated no IMAGE_PROMPT. Output: " + blockText);
      }
    } catch (e: any) {
      if (force) throw new Error("Story Director error: " + e.message);
      /* discard block issue silently */
    }
  };

  const mergeCastRoster = (castBlock: string) => {
    // Disabled automatic guessing of cast characters based on user feedback.
    // Characters must be added manually or dynamically via frame generation.
  };

  const executeStoryboardFrameCompile = async (imagePrompt: string, videoPrompt: string, reason: string, force: boolean = false) => {
    try {
      let finalPrompt = imagePrompt;
      const setup = activeThread?.setup;
      if (setup && setup.style) finalPrompt = `${imagePrompt}, ${setup.style}`;

      // Assemble active LoRA details
      const activeLorasList = loras.filter(l => l.active);
      const sbModelBase = MODEL_REGISTRY[storyboardModel]?.loraBase || '';
      const hasMismatch = activeLorasList.some(l => {
        if (!l.base || l.base === 'Other' || !sbModelBase) return false;
        if (sbModelBase === 'Z-Image' && l.base === 'Flux') return false;
        if (sbModelBase === 'Flux' && l.base === 'Z-Image') return false;
        return l.base !== sbModelBase;
      });
      if (hasMismatch) {
        console.warn("Storyboard Model / LoRA mismatch detected.");
      }
      const reqLoras = activeLorasList.map(l => ({ path: l.url, scale: l.scale }));

      // Find ANY character match for IP-Adapter injection (identity preservation) using whole-word matching
      let imageRefUrl: string | undefined = undefined;
      if (activeThread?.cast) {
        for (const c of activeThread.cast) {
          if (c.imageUrl && c.name) {
            const re = new RegExp('\\b' + c.name + '\\b', 'i');
            if (re.test(finalPrompt)) {
              imageRefUrl = c.imageUrl;
              break; // Standard implementation allows 1 IP-Adapter target safely per prompt
            }
          }
        }
      }

      const outputImageUrl = await callModel(storyboardModel, {
        prompt: finalPrompt,
        aspectRatio: storyboardRatio,
        resolution: '1K',
        loras: reqLoras,
        imageReference: imageRefUrl
      });

      if (!outputImageUrl) {
        if (force) throw new Error("Model returned empty image URL.");
        return;
      }

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
    } catch (e: any) {
      if (force) throw new Error(`Storyboard Engine Error: ${e.message}`);
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
      // Fetch as blob first to completely avoid remote canvas CORS pollution issues
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error('Video fetch failed');
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);

      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'auto';
      v.playsInline = true;

      const frameDataUrl = await new Promise<string>((resolve, reject) => {
        const cleanup = () => URL.revokeObjectURL(localUrl);

        v.addEventListener('error', () => {
          cleanup();
          reject(new Error('Canvas CORS lock or file issue.'));
        });
        v.addEventListener('loadeddata', () => {
          // Some browsers need the video to be drawn to canvas when it's fully ready
          if (v.duration && v.duration !== Infinity) {
             v.currentTime = Math.max(0, v.duration - 0.1);
          } else {
             // Fallback for infinite duration streams
             v.currentTime = 1;
          }
        });
        v.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth || 640;
            canvas.height = v.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
            } else {
              reject(new Error('Canvas ctx empty'));
            }
          } catch (err) {
            reject(err);
          } finally {
            cleanup();
          }
        });
        v.src = localUrl;
        v.load();
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

      const res = await fetch('/api/proxy/xai/v1/chat/completions', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-2-latest',
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

  // Auto help text complete for various meta fields
  const handleAutoHelpWrite = async (
    promptHint: string,
    contextType: 'premise' | 'tone' | 'style' | 'character',
    existingValue: string,
    extraContext?: string
  ): Promise<string> => {
    if (!keys.apiKey) {
      alert('xAI token missing. Please set your xAI API Key in settings.');
      throw new Error('Missing API Key');
    }

    try {
      const messagesPayload = getHistoryMessages();
      const refLogs = messagesPayload.slice(-6).map((m: any) => m.content).join('\n').slice(-1500);

      let sys = '';
      let prompt = '';
      let max_tokens = 300;

      if (contextType === 'character') {
        sys = 'Generate a detailed but concise single-paragraph character physical description (eye/hair shapes, clothing, age). Output the description directly with NO conversational filler. MAX 40 words.';
        prompt = `Character Name: ${extraContext || 'Unknown'}\nExisting details: ${existingValue || '(none)'}\n\nRecent game logs (optional reference):\n${refLogs}`;
        max_tokens = 75;
      } else if (contextType === 'premise') {
        sys = 'Generate a compelling story premise or campaign setting. Output only the premise directly (no intro/outro). MAX 50 words.';
        prompt = `Existing premise: ${existingValue || '(none)'}`;
        max_tokens = 100;
      } else if (contextType === 'tone') {
        sys = 'Generate a concise description of a story tone or mood. Output only the tone directly. MAX 6 words.';
        prompt = `Existing tone: ${existingValue || '(none)'}`;
        max_tokens = 15;
      } else if (contextType === 'style') {
        sys = 'Generate a concise aesthetic style directive for image generation. Output only the style directly (e.g. "dark fantasy watercolor", "1980s anime", "cinematic lighting"). MAX 10 words.';
        prompt = `Existing style: ${existingValue || '(none)'}`;
        max_tokens = 25;
      }

      const res = await fetch('/api/proxy/xai/v1/chat/completions', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: keys.chatModel || 'grok-2-latest',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ],
          max_tokens,
          temperature: 0.8
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        console.error('API Error:', res.status, errData);
        throw new Error(`API returned ${res.status}: ${errData}`);
      }
      const data = await res.json();
      return (data.choices?.[0]?.message?.content || '').trim();
    } catch (e: any) {
      console.error(e);
      alert(`Generation failed. ${e.message}`);
      throw new Error('Generation failed');
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

  // Upload hooks trigger file clicker
  const handleRegisterUpload = () => {
    const el = document.getElementById('local_upload_file');
    if (el) el.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Images must stay under 8MB to preserve Local Storage performance limits.');
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const maxSize = 1024; // Compress to 1024px to save localStorage space
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              } else {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            } else {
              resolve(ev.target?.result as string);
            }
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

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
    } catch (err) {
      console.error(err);
    }
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
  const currentSetup = activeThread ? activeThread.setup || { premise: '', tone: '', style: '' } : { premise: '', tone: '', style: '' };

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
            <div className="flex items-center rounded-lg border border-white/5 bg-[#252538] overflow-hidden">
              <button
                onClick={() => {
                  const newVal = !storyboardOn;
                  setStoryboardOn(newVal);
                  localStorage.setItem('zaor_sb_on', newVal ? '1' : '0');
                }}
                className={`p-1.5 transition-colors cursor-pointer ${
                  storyboardOn ? 'bg-[#c9b8e8]/20 text-[#c9b8e8]' : 'text-[#9a96a8] hover:text-[#f0ece4]'
                }`}
                title="Toggle Storyboard Director"
              >
                🎬
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button
                onClick={() => setActiveModal('storyboard')}
                className="p-1.5 text-[#9a96a8] hover:text-[#f0ece4] hover:bg-[#2e2e48] transition-colors cursor-pointer"
                title="Storyboard Director Settings"
              >
                <Settings size={13} />
              </button>
            </div>

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
                      if(window.confirm("Are you sure you want to nuke the session? This will delete all threads, messages, and casts, but keep your API keys and LoRA settings.")) {
                        setOverflowMenuOpen(false);
                        handleClearAllChats();
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-neutral-800/10 border-t border-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={12} /> Nuke Session
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
          onRetryVideo={async (promptTxt, parentEngine, dur, resolution, targetVid) => {
            let engine = parentEngine === 'WaveSpeed WAN 2.2' ? 'wan22spicy' : (parentEngine || 'aurora');
            engine = engine.toLowerCase();
            
            // Add temporary typing indicator for video generations so users have direct immediate visual feedback
            const tempLoadingId = `vid-ext-${Date.now()}`;
            const loadingMsg: Message = { role: 'assistant', content: '⏳ Processing video extension... this can take up to a minute.', type: 'text', id: tempLoadingId } as any;
            updateCurrentThread(t => ({ ...t, messages: [...t.messages, loadingMsg] }));
            
            setIsLoading(true);
            try {
              await executeVideoGen(promptTxt, null, engine, targetVid || null, dur, resolution);
            } catch (e: any) {
              const errCard: Message = { role: 'assistant', type: 'error', content: e.message };
              updateCurrentThread(t => ({ ...t, messages: [...t.messages, errCard] }));
            } finally {
              updateCurrentThread(t => ({ ...t, messages: t.messages.filter((m: any) => m.id !== tempLoadingId) }));
              setIsLoading(false);
            }
          }}
          onSaveToFiles={onSaveToFiles}
          editModelsHtml=""
          onRetryFrame={async (m) => {
            setIsLoading(true);
            try {
              await executeStoryboardFrameCompile(m.alt || '', m.videoPrompt || '', m.reason || 'retry');
            } catch (e: any) {
              const errCard: Message = { role: 'assistant', type: 'error', content: e.message };
              updateCurrentThread(t => ({ ...t, messages: [...t.messages, errCard] }));
            } finally {
              setIsLoading(false);
            }
          }}
          onUseAsCast={async (m) => {
            setPendingCastImage({ src: m.src, alt: m.alt || '' });
            setActiveModal('cast');
          }}
          onForceFrame={async (m) => {
            if (activeThread) {
              const msgIndex = activeThread.messages.indexOf(m);
              let userPrompt = "Continued scene...";
              for (let i = msgIndex - 1; i >= 0; i--) {
                if (activeThread.messages[i].role === 'user' && activeThread.messages[i].type === 'text') {
                  userPrompt = activeThread.messages[i].content || "Continued scene...";
                  break;
                }
              }
              setIsLoading(true);
              try {
                await executeStoryDirectorPass(userPrompt, m.content || "", true);
              } catch (e: any) {
                const errCard: Message = { role: 'assistant', type: 'error', content: e.message };
                updateCurrentThread(t => ({ ...t, messages: [...t.messages, errCard] }));
              } finally {
                setIsLoading(false);
              }
            }
          }}
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
                  <option value="chroma">Chroma (Stylized)</option>
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
        onToggleAllLoras={(active) => {
          const list = loras.map(l => ({ ...l, active }));
          setLoras(list);
          localStorage.setItem('zaor_loras', JSON.stringify(list));
        }}
        onUpdateLoraScale={handleUpdateLoraScale}
        onDeleteLora={handleDeleteLora}
        onImportLoras={handleImportLoras}
        imageGuidance={imageGuidance}
        onChangeImageGuidance={setImageGuidance}
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
        storyParaLimit={storyParaLimit}
        onChangeStoryParaLimit={(val: number) => {
          setStoryParaLimit(val);
          localStorage.setItem('zaor_sb_para', val.toString());
        }}
        cast={cast}
        pendingCastImage={pendingCastImage}
        onConsumePendingImage={() => setPendingCastImage(null)}
        onAddCharacter={handleAddCharacter}
        onUpdateCharacterDesc={handleUpdateCharacterDesc}
        onUpdateCharacterImage={handleUpdateCharacterImage}
        onDeleteCharacter={handleDeleteCharacter}
        onHelpWriteField={handleAutoHelpWrite}
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
