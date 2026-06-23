import React, { useState } from 'react';
import { Message } from '../types';
import {
  Copy, Image, Video, Film, Trash, Sparkles, Send, Lock,
  Unlock, HelpCircle, Check, Camera, RefreshCcw, Download, Cloud, ChevronRight, X, Loader2
} from 'lucide-react';

interface MessageFeedProps {
  messages: Message[];
  isLoading: boolean;
  promptEngineerMode?: boolean;
  onRetryText: () => void;
  onAnimateImage: (src: string, prompt: string, engine: string, duration: number, res: string) => Promise<void>;
  onEditImage: (prompt: string, src: string, model: string) => Promise<void>;
  styleLockActive: boolean;
  lockedStyle: string;
  onPinForPE: (src: string, type: 'image' | 'video', label: string) => void;
  pinnedPeUrl: string | null;
  activeTargetUrl: string | null;
  onSetEditTarget: (src: string) => void;
  onCloudSave: (src: string, type: 'image' | 'video', btnSetter: (txt: string) => void) => Promise<void>;
  onGrabLastFrame: (src: string, btnSetter: (txt: string) => void) => Promise<void>;
  onRetryVideo: (prompt: string, parentEngine: string, duration: number, res: string) => Promise<void>;
  onSaveToFiles: (src: string, altText: string) => void;
  editModelsHtml: string; // fallback select markup if needed, but we can write react selects directly!
  onRetryFrame?: (m: Message) => void;
  onUseAsCast?: (m: Message) => void;
  onForceFrame?: (m: Message) => void;
}

export const MessageFeed: React.FC<MessageFeedProps> = ({
  messages,
  isLoading,
  promptEngineerMode = false,
  onRetryText,
  onAnimateImage,
  onEditImage,
  styleLockActive,
  lockedStyle,
  onPinForPE,
  pinnedPeUrl,
  activeTargetUrl,
  onSetEditTarget,
  onCloudSave,
  onGrabLastFrame,
  onRetryVideo,
  onSaveToFiles,
  onRetryFrame,
  onUseAsCast,
  onForceFrame
}) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9a96a8]/40 selection-none select-none">
        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-[#c9b8e8]/30 mb-4 animate-pulse">
          <Sparkles size={24} />
        </div>
        <h3 className="font-serif text-lg text-[#c9b8e8]/50 mb-1">Decrypted Creative Sandbox</h3>
        <p className="text-xs leading-relaxed max-w-[320px]">
          Begin roleplay narratives with Zaor, or select tools to draft bespoke media frames instantly.
        </p>
      </div>
    );
  }

  // Segment contiguous PE dialogue messages into group blocks
  const groupedItems: { type: 'single' | 'pe_group'; messages: Message[] }[] = [];
  let currentPeGroup: Message[] = [];

  messages.forEach((m) => {
    if (m.isPe) {
      currentPeGroup.push(m);
    } else {
      if (currentPeGroup.length > 0) {
        groupedItems.push({ type: 'pe_group', messages: currentPeGroup });
        currentPeGroup = [];
      }
      groupedItems.push({ type: 'single', messages: [m] });
    }
  });

  if (currentPeGroup.length > 0) {
    groupedItems.push({ type: 'pe_group', messages: currentPeGroup });
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 flex flex-col gap-6 scroll-smooth">
      {groupedItems.map((item, groupIdx) => {
        if (item.type === 'pe_group') {
          // If this is the latest group, and active PE mode is enabled, let it default to expanded
          const isLatestGroup = groupIdx === groupedItems.length - 1;
          const isPeModeActive = isLatestGroup && promptEngineerMode;

          return (
            <PEMessageGroupCard
              key={`pe_group_${groupIdx}`}
              messages={item.messages}
              isPeModeActive={isPeModeActive}
              onRetryText={onRetryText}
              onAnimateImage={onAnimateImage}
              onEditImage={onEditImage}
              styleLockActive={styleLockActive}
              lockedStyle={lockedStyle}
              onPinForPE={onPinForPE}
              pinnedPeUrl={pinnedPeUrl}
              activeTargetUrl={activeTargetUrl}
              onSetEditTarget={onSetEditTarget}
              onCloudSave={onCloudSave}
              onGrabLastFrame={onGrabLastFrame}
              onRetryVideo={onRetryVideo}
              onSaveToFiles={onSaveToFiles}
              isLoading={isLoading}
              onRetryFrame={onRetryFrame}
              onUseAsCast={onUseAsCast}
              onForceFrame={onForceFrame}
            />
          );
        } else {
          const m = item.messages[0];
          return (
            <MessageCard
              key={`single_${groupIdx}`}
              m={m}
              onRetryText={onRetryText}
              onAnimateImage={onAnimateImage}
              onEditImage={onEditImage}
              styleLockActive={styleLockActive}
              lockedStyle={lockedStyle}
              onPinForPE={onPinForPE}
              pinnedPeUrl={pinnedPeUrl}
              activeTargetUrl={activeTargetUrl}
              onSetEditTarget={onSetEditTarget}
              onCloudSave={onCloudSave}
              onGrabLastFrame={onGrabLastFrame}
              onRetryVideo={onRetryVideo}
              onSaveToFiles={onSaveToFiles}
              isLoading={isLoading}
              onRetryFrame={onRetryFrame}
              onUseAsCast={onUseAsCast}
              onForceFrame={onForceFrame}
            />
          );
        }
      })}
      
      {isLoading && (
        <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-[#c47a8a]/20 bg-[#c47a8a]/5 text-[#c9b8e8]/80 max-w-[280px] self-start mr-auto anim-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <Loader2 size={13} className="animate-spin text-[#c47a8a]" />
            <span className="font-semibold tracking-wider text-[10px] uppercase text-[#c47a8a] flex items-center gap-1">
              ✦ Zaor Active
            </span>
          </div>
          <p className="text-xs text-[#9a96a8]/80 leading-relaxed font-sans font-light">
            Crafting story arc or rendering media stream...
          </p>
        </div>
      )}
    </div>
  );
};

// Collapsible Group Wrapper for prompt engineering dialogues
const PEMessageGroupCard = ({
  messages,
  isPeModeActive,
  onRetryText,
  onAnimateImage,
  onEditImage,
  styleLockActive,
  lockedStyle,
  onPinForPE,
  pinnedPeUrl,
  activeTargetUrl,
  onSetEditTarget,
  onCloudSave,
  onGrabLastFrame,
  onRetryVideo,
  onSaveToFiles,
  isLoading,
  onRetryFrame,
  onUseAsCast,
  onForceFrame
}: any) => {
  const [isOpen, setIsOpen] = useState<boolean>(isPeModeActive);

  // Auto-expand latest active interaction when entering the PE mode
  React.useEffect(() => {
    if (isPeModeActive) {
      setIsOpen(true);
    }
  }, [isPeModeActive]);

  return (
    <div className="w-full max-w-[95%] my-1 self-stretch border border-[#bfadff]/20 bg-[#121222]/30 rounded-2xl p-2.5 flex flex-col transition-all duration-300">
      {/* Interactive Title Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 cursor-pointer py-2 px-3 bg-[#1e1e30]/75 hover:bg-[#25253e]/85 hover:border-[#c1b5db]/30 rounded-xl border border-white/5 transition-all text-xs select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#c9b8e8]/20 flex items-center justify-center border border-[#bfadff]/40">
            <Sparkles size={8} className="text-[#bfadff]" />
          </div>
          <span className="font-sans font-semibold tracking-wide text-[#c9b8e8]">
            Prompt Architect Design Log
          </span>
          <span className="text-[#9a96a8] text-[9.5px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
            {messages.length} interaction{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-white/40 font-mono hidden sm:inline text-[9px] uppercase tracking-wider">
            {isOpen ? 'Minimize path' : 'Inspect path'}
          </span>
          <ChevronRight
            size={14}
            className={`transform transition-transform duration-200 text-[#bfadff] ${
              isOpen ? 'rotate-90' : 'rotate-0'
            }`}
          />
        </div>
      </div>

      {/* Expandable chat dialogues list */}
      {isOpen && (
        <div className="flex flex-col gap-4 mt-3 pl-3 border-l-2 border-[#bfadff]/20 ml-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {messages.map((m: any, idx: number) => (
            <MessageCard
              key={idx}
              m={m}
              onRetryText={onRetryText}
              onAnimateImage={onAnimateImage}
              onEditImage={onEditImage}
              styleLockActive={styleLockActive}
              lockedStyle={lockedStyle}
              onPinForPE={onPinForPE}
              pinnedPeUrl={pinnedPeUrl}
              activeTargetUrl={activeTargetUrl}
              onSetEditTarget={onSetEditTarget}
              onCloudSave={onCloudSave}
              onGrabLastFrame={onGrabLastFrame}
              onRetryVideo={onRetryVideo}
              onSaveToFiles={onSaveToFiles}
              isLoading={isLoading}
              onRetryFrame={onRetryFrame}
              onUseAsCast={onUseAsCast}
              onForceFrame={onForceFrame}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ────────── NESTED CARD HANDLERS ──────────

const MessageCard = ({
  m, onRetryText, onAnimateImage, onEditImage, styleLockActive, lockedStyle,
  onPinForPE, pinnedPeUrl, activeTargetUrl, onSetEditTarget, onCloudSave,
  onGrabLastFrame, onRetryVideo, onSaveToFiles, isLoading,
  onRetryFrame, onUseAsCast, onForceFrame
}: any) => {
  const isUser = m.role === 'user';

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start animate-fadeUp'}`}>
      {/* Label */}
      <span className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-widest px-1">
        {isUser ? 'You' : m.modelLabel || m.engineLabel || 'Zaor'}
      </span>

      {/* Renders Based on Message Type */}
      {(m.type === 'text' || m.type === 'error') && (
        <TextMessage 
          role={m.role} 
          text={m.type === 'error' ? `Error: ${m.content}` : m.content} 
          onRetry={m.type === 'error' ? undefined : onRetryText} 
          onForceFrame={m.type === 'error' ? undefined : (() => onForceFrame?.(m))}
        />
      )}

      {m.type === 'image' && (
        <ImageMessage
          src={m.src}
          alt={m.alt || ''}
          hostedUrl={m.hostedUrl}
          isActiveTarget={activeTargetUrl === (m.hostedUrl || m.src)}
          styleLockActive={styleLockActive}
          lockedStyle={lockedStyle}
          onSetTarget={onSetEditTarget}
          onAnimate={(p, engine, dur, res) => onAnimateImage(m.src, p, engine, dur, res)}
          onApplyStyle={(p, model) => onEditImage(p, m.src, model)}
          onRetry={() => onEditImage(m.alt || '', m.src, m.modelLabel || 'fluxkontext')}
          onPin={() => onPinForPE(m.hostedUrl || m.src, 'image', m.alt || 'Visual Context')}
          isPePinned={pinnedPeUrl === (m.hostedUrl || m.src)}
          onCloud={(cloudUrl: string, type: string, btnSetter: any) => onCloudSave(m.hostedUrl || m.src, 'image', btnSetter)}
          onAddCast={onUseAsCast ? () => onUseAsCast(m) : undefined}
        />
      )}

      {m.type === 'video' && (
        <VideoMessageCard
          m={m}
          onCloud={onCloudSave}
          onSave={onSaveToFiles}
          onGrabLast={onGrabLastFrame}
          onRetryVid={onRetryVideo}
          onPin={onPinForPE}
          pinned={pinnedPeUrl === (m.hostedUrl || m.src)}
          isLoading={isLoading}
        />
      )}

      {m.type === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm max-w-sm">
          <strong className="block mb-1">Error</strong>
          {m.content}
        </div>
      )}

      {m.type === 'storyboard' && (
        <StoryboardFrameCard
          m={m}
          onAnimate={onAnimateImage}
          onEdit={onEditImage}
          onCloud={onCloudSave}
          onSave={onSaveToFiles}
          isLoading={isLoading}
          onRetryFrame={onRetryFrame}
          onUseAsCast={onUseAsCast}
        />
      )}

      {m.type === 'error' && (
        <div className="bg-[#c47a8a]/12 border border-red-500/20 text-rose-300 rounded-xl px-4 py-3 text-xs flex items-center gap-2 max-w-full">
          <span className="shrink-0 text-rose-400">⚠</span>
          <span>{m.content}</span>
        </div>
      )}
    </div>
  );
};

// ── 1. Text Message ──
const TextMessage: React.FC<{ role: string; text: string; onRetry?: () => void; onForceFrame?: () => void }> = ({ role, text, onRetry, onForceFrame }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy text:', text);
    }
  };

  return (
    <div className="flex flex-col group">
      <div
        className={`px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed break-words whitespace-pre-wrap select-text ${
          role === 'user' ? 'bg-[#c9b8e8] text-[#1a1a2e] rounded-br-[4px]' : 'bg-[#252538] text-[#f0ece4] border border-[#2e2e48] rounded-bl-[4px]'
        }`}
      >
        {text}
      </div>
      <div className="flex gap-4 mt-1 opacity-60 hover:opacity-100 transition-opacity">
        <button className="text-[11px] text-[#9a96a8] hover:text-[#c9b8e8]" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        {role === 'assistant' && onRetry && (
          <button className="text-[11px] text-[#9a96a8] hover:text-white" onClick={onRetry}>
            ↺ Retry
          </button>
        )}
        {role === 'assistant' && onForceFrame && (
          <button className="text-[11px] text-[#9a96a8] hover:text-[#c9b8e8]" onClick={() => onForceFrame()}>
            🎬 Draw Frame
          </button>
        )}
      </div>
    </div>
  );
};

// ── 2. Image Message ──
const ImageMessage: React.FC<{
  src: string;
  alt: string;
  hostedUrl?: string | null;
  label?: string;
  isActiveTarget: boolean;
  styleLockActive: boolean;
  lockedStyle: string;
  onSetTarget: (url: string) => void;
  onAnimate: (prompt: string, engine: string, dur: number, res: string) => void;
  onApplyStyle: (prompt: string, model: string) => void;
  onRetry: () => void;
  onPin: () => void;
  isPePinned: boolean;
  onCloud: (cloudUrl: string, type: string, btnSetter: any) => void;
  onAddCast?: () => void;
}> = ({ src, alt, hostedUrl, label, isActiveTarget, styleLockActive, lockedStyle, onSetTarget, onAnimate, onApplyStyle, onRetry, isPePinned, onPin, onCloud, onAddCast }) => {
  const [animOpen, setAnimOpen] = useState(false);
  const [styleOpen, setStylePanelOpen] = useState(false);
  const [animEngine, setAnimEngine] = useState('aurora');
  const [animDur, setDur] = useState(4);
  const [animRes, setRes] = useState('480p');
  const [animPrompt, setAnimPrompt] = useState('');

  const [styleModel, setStyleModel] = useState('fluxkontext');
  const [cloudStatus, setCloudStatus] = useState('☁ Cloud');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  return (
    <div className="flex flex-col gap-2 max-w-full">
      <div
        className={`relative inline-block max-w-full rounded-xl overflow-hidden cursor-pointer transition-all ${
          isActiveTarget ? 'ring-2 ring-[#c9b8e8] ring-offset-2' : 'border border-white/5'
        }`}
        onClick={() => {
          onSetTarget(hostedUrl || src);
        }}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="max-w-full rounded-xl block max-h-[420px] object-cover"
        />
      </div>

      <div className="flex gap-2 flex-wrap text-xs font-medium">
        <button
          onClick={() => saveImageToFiles(src, alt)}
          className="px-3 py-1.5 rounded-full bg-[#252538] border border-white/10 hover:border-lavender text-dim hover:text-lavender transition-all cursor-pointer"
        >
          ⬇ Save
        </button>
        <button
          onClick={() => onCloud(hostedUrl || src, 'image', setCloudStatus)}
          className="px-3 py-1.5 rounded-full bg-[#252538] border border-white/10 hover:border-lavender text-dim hover:text-lavender transition-all cursor-pointer"
        >
          {cloudStatus}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(alt).then(() => {
              setCopiedPrompt(true);
              setTimeout(() => setCopiedPrompt(false), 2000);
            });
          }}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer duration-200 ${
            copiedPrompt
              ? 'bg-[#c9b8e8]/20 border-[#c9b8e8] text-[#c9b8e8] font-bold scale-[0.98]'
              : 'bg-[#252538] border-white/10 hover:border-lavender text-dim hover:text-lavender'
          }`}
        >
          {copiedPrompt ? '✓ Copied ✓' : '📋 Copy prompt'}
        </button>
        <button
          onClick={onPin}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            isPePinned
              ? 'bg-[#c9b8e8]/20 border-[#c9b8e8] text-[#c9b8e8] font-semibold'
              : 'bg-[#252538] border-white/10 text-dim hover:border-lavender hover:text-lavender'
          }`}
        >
          ✦ PE {isPePinned && '✓'}
        </button>
        <button
          onClick={() => onSetTarget(hostedUrl || src)}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            isActiveTarget
              ? 'bg-[#c9b8e8]/20 border-[#c9b8e8] text-[#c9b8e8] font-semibold'
              : 'bg-transparent border-white/5 text-[#9a96a8] hover:border-lavender hover:text-lavender'
          }`}
        >
          🎯 {isActiveTarget ? 'Target Set' : 'Edit Target'}
        </button>
        <button
          onClick={() => setAnimOpen(!animOpen)}
          className="px-3 py-1.5 rounded-full bg-[#252538] border border-white/10 hover:border-[#64b4ff] hover:text-[#64b4ff] text-[#9a96a8] transition-all cursor-pointer"
        >
          ▶ Animate
        </button>
        {onAddCast && (
          <button
            onClick={onAddCast}
            className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-dim hover:text-[#c9b8e8] transition-all cursor-pointer"
          >
            👤 Add to Cast
          </button>
        )}
        <button
          onClick={() => {
            if (!styleLockActive) return alert('Lock a visual style in Settings/Style Lock first!');
            setStylePanelOpen(!styleOpen);
          }}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            styleLockActive
              ? 'bg-[#252538] border-white/10 hover:border-lavender text-dim hover:text-lavender'
              : 'opacity-40 border-white/5 text-dim/50 cursor-not-allowed'
          }`}
          title={styleLockActive ? 'Apply locked style' : 'No style active'}
        >
          🔒 Style Lock
        </button>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-full bg-[#252538] border border-white/10 hover:border-lavender text-dim hover:text-lavender transition-all cursor-pointer"
        >
          ↺ Retry
        </button>
      </div>

      {/* Inline Animate Drawer */}
      {animOpen && (
        <div className="bg-[#252538] border border-white/10 rounded-xl p-3 flex flex-col gap-2 mt-1 w-full max-w-[480px] animate-in slide-in-from-top-2 duration-150">
          <input
            type="text"
            placeholder="Describe motion... (e.g. slow zoom in, hair fluttering)"
            value={animPrompt}
            onChange={(e) => setAnimPrompt(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none"
          />
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[10px] text-[#9a96a8] uppercase font-bold pr-1">Engine:</span>
            <select
              value={animEngine}
              onChange={(e) => setAnimEngine(e.target.value)}
              className="bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px] text-[#c9b8e8]"
            >
              <option value="aurora">Aurora &middot; xAI — $0.05/s</option>
              <option value="seedance15spicy">Seedance Spicy — $0.06/s</option>
              <option value="wan22spicy">Wan 2.2 Spicy — $0.15/s</option>
              <option value="wan26spicy">Wan 2.7 Spicy — $0.50/s</option>
              <option value="ltx23spicy">LTX 2.3 Spicy — $0.10/s</option>
            </select>

            <span className="text-[10px] uppercase font-bold text-[#9a96a8]">Duration</span>
            <select
              value={animDur}
              onChange={(e) => setDur(parseInt(e.target.value))}
              className="img-control-select bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px]"
            >
              <option value="4">4s</option>
              <option value="5">5s</option>
              <option value="8">8s</option>
              <option value="10">10s</option>
              <option value="15">15s</option>
            </select>

            <button
              onClick={() => {
                onAnimate(animPrompt, animEngine, animDur, animRes);
                setAnimOpen(false);
              }}
              className="bg-[#64b4ff] hover:bg-[#64b4ff]/90 text-[#1a1a2e] px-3.5 py-1 rounded-full text-[11px] font-bold ml-auto cursor-pointer"
            >
              Animate ▶
            </button>
          </div>
        </div>
      )}

      {/* Style applying drawer */}
      {styleOpen && (
        <div className="bg-[#252538] border border-white/10 rounded-xl p-3 flex flex-col gap-2 mt-1 w-full max-w-[480px] animate-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] text-[#c9b8e8] bg-[#c9b8e8]/5 p-2 rounded border border-[#c9b8e8]/10 line-clamp-1 italic">
            Locked: {lockedStyle}
          </div>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Model</span>
              <select
                value={styleModel}
                onChange={(e) => setStyleModel(e.target.value)}
                className="bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px] text-[#c9b8e8]"
              >
                <option value="fluxkontext">Flux Kontext — $0.02</option>
                <option value="qwen">Qwen Edit — $0.02</option>
                <option value="wan27">Wan 2.7 — $0.03</option>
                <option value="wan27pro">Wan 2.7 Pro — $0.06</option>
                <option value="klein9b-edit-lora">Klein 9B — $0.021</option>
              </select>
            </div>
            <button
              onClick={() => {
                const prompt = `Apply this visual style to the image: ${lockedStyle}. Preserve characters and composition exactly.`;
                onApplyStyle(prompt, styleModel);
                setStylePanelOpen(false);
              }}
              className="bg-[#c9b8e8] hover:bg-[#c9b8e8]/90 text-[#1a1a2e] px-4 py-1 rounded-full text-[10px] font-bold cursor-pointer"
            >
              Apply Style ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 3. Video Message ──
const VideoMessageCard = ({ m, onCloud, onSave, onGrabLast, onRetryVid, onPin, pinned, isLoading }: any) => {
  const [extendOpen, setExtendOpen] = useState(false);
  const [extPrompt, setExtPrompt] = useState('');
  const [extEngine, setExtEngine] = useState('aurora-extend');
  const [extDur, setExtDur] = useState(4);
  const [extRes, setExtRes] = useState('480p');
  const [cloudStatus, setCloudStatus] = useState('☁ Cloud');
  const [grabStatus, setGrabStatus] = useState('◳ Last frame');

  return (
    <div className="flex flex-col gap-2 max-w-full">
      <div className="relative inline-block max-w-[480px] rounded-xl overflow-hidden border border-white/5 shadow-md">
        <video
          controls
          loop
          playsInline
          referrerPolicy="no-referrer"
          className="w-full h-auto max-h-[320px] rounded-xl object-contain bg-black"
          src={m.src}
        />
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            onClick={() => onSave(m.src, m.alt)}
            className="bg-black/85 text-xs text-[#f0ece4] border border-white/10 hover:border-lavender px-3 py-1 rounded-full hover:text-lavender transiton-colors cursor-pointer"
          >
            ⬇ Save
          </button>
          <button
            onClick={() => onCloud(m.src, 'video', setCloudStatus)}
            className="bg-black/85 text-xs text-[#f0ece4] border border-white/10 hover:border-lavender px-3 py-1 rounded-full hover:text-lavender transiton-colors cursor-pointer"
          >
            {cloudStatus}
          </button>
          <button
            onClick={() => onGrabLast(m.src, setGrabStatus)}
            className="bg-black/85 text-xs text-[#f0ece4] border border-white/10 hover:border-lavender px-3 py-1 rounded-full hover:text-lavender transiton-colors cursor-pointer"
          >
            {grabStatus}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => onPin(m.src, 'video', 'Video Clip')}
          className={`pe-pin-btn ${pinned ? 'active' : ''}`}
        >
          {pinned ? '✦ PE ✓' : '✦ PE'}
        </button>
        <button
          onClick={() => setExtendOpen(!extendOpen)}
          className="animate-btn"
        >
          ⟳ Extend
        </button>
        <button
          onClick={() => onRetryVid(m.alt, m.engineLabel)}
          className="retry-btn"
        >
          ↺ Retry
        </button>
      </div>

      {extendOpen && (
        <div className="animate-panel-outer">
          <div className="animate-panel" style={{
            background: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Describe the continuation… (optional)"
              value={extPrompt}
              onChange={e => setExtPrompt(e.target.value)}
              className="sb-edit-input"
              style={{
                background: 'var(--bg)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: 'var(--text)',
                fontSize: '13px',
                width: '100%',
                outline: 'none'
              }}
            />
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Engine:</span>
              <select
                value={extEngine}
                onChange={(e) => setExtEngine(e.target.value)}
                className="bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px] text-[#c9b8e8]"
              >
                <option value="aurora-extend">Aurora Extend &middot; xAI — $0.05/s</option>
                <option value="wan27-extend">Wan 2.7 Extend — $0.30/s</option>
                <option value="wan22spicy-extend">Wan 2.2 Spicy — $0.15/s</option>
                <option value="grok-vedit">Aurora Video Edit — $0.10/s</option>
                <option value="atlas-wan27-vedit">Wan 2.7 Video Edit (Atlas) — $0.05/s</option>
              </select>

              <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Duration:</span>
              <select
                value={extDur}
                onChange={(e) => setExtDur(parseInt(e.target.value))}
                className="img-control-select bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px]"
              >
                <option value="4">4s</option>
                <option value="5">5s</option>
                <option value="10">10s</option>
              </select>

              <span className="text-[10px] text-[#9a96a8] bg-[#252538] border border-white/5 px-2 py-0.5 rounded-md font-semibold tracking-wider ml-auto">
                ~${(extDur * ((extEngine || '').includes('wan27') ? ((extEngine || '').includes('vedit') ? 0.05 : 0.30) : (extEngine || '').includes('wan22') ? 0.15 : extEngine === 'grok-vedit' ? 0.10 : 0.05)).toFixed(2)}
              </span>

              <button
                disabled={isLoading}
                onClick={() => {
                  onRetryVid(extPrompt || 'continue scene naturally', extEngine, extDur, extRes, m.src);
                  setExtendOpen(false);
                }}
                className={`bg-[#64b4ff] hover:bg-[#64b4ff]/90 text-[#1a1a2e] px-4 py-1 rounded-full text-[11px] font-bold ml-2 cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Extend Clip ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 4. Storyboard Frame Message ──
const StoryboardFrameCard = ({ m, onAnimate, onEdit, onCloud, onSave, onRetryFrame, onUseAsCast, isLoading }: any) => {
  const [animOpen, setAnimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [animEngine, setAnimEngine] = useState('aurora');
  const [animDur, setDur] = useState(4);
  const [animRes, setRes] = useState('480p');
  const [animPrompt, setAnimPrompt] = useState(m.videoPrompt || '');
  const [editPrompt, setEditPrompt] = useState('');
  const [editModel, setEditModel] = useState('wan27');

  const [copText, setCopText] = useState('📋 Copy Video Prompt');
  const [cloudText, setCloudText] = useState('☁ Cloud');

  return (
    <div className="flex flex-col gap-2 max-w-full">
      <div className="relative inline-block max-w-[480px] rounded-xl overflow-hidden border border-[#c9b8e8]/30 shadow-md">
        <img
          src={m.src}
          alt={m.alt}
          referrerPolicy="no-referrer"
          className="w-full h-auto rounded-xl object-contain max-h-[350px]"
        />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {m.videoPrompt && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(m.videoPrompt).then(() => {
                setCopText('✓ Copied Video Prompt');
                setTimeout(() => setCopText('📋 Copy Video Prompt'), 2000);
              });
            }}
            className="px-3 py-1.5 bg-[#252538] border border-white/10 hover:border-lavender rounded-full text-[11px] text-[#9a96a8] hover:text-[#c9b8e8] transition-all cursor-pointer font-medium"
          >
            {copText}
          </button>
        )}
        <button
          onClick={() => setAnimOpen(!animOpen)}
          className="px-3 py-1.5 bg-[#252538] border border-white/10 hover:border-lavender rounded-full text-[11px] text-[#9a96a8] hover:text-[#64b4ff] hover:bg-[#64b4ff]/5 transition-all cursor-pointer font-medium"
        >
          ▶ Animate
        </button>
        <button
          onClick={() => onSave(m.src, m.reason || 'story_frame')}
          className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-[11px] text-[#9a96a8] hover:text-[#c9b8e8] transition-all cursor-pointer font-medium"
        >
          ⬇ Save
        </button>
        <button
          onClick={() => onCloud(m.src, 'image', setCloudText)}
          className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-[11px] text-[#9a96a8] hover:text-lavender transition-all cursor-pointer font-medium"
        >
          {cloudText}
        </button>
        <button
          onClick={() => setEditOpen(!editOpen)}
          className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-[11px] text-[#9a96a8] hover:text-[#c9b8e8] transition-all cursor-pointer font-medium"
        >
          ✎ Edit Frame
        </button>
        {onRetryFrame && (
          <button
            onClick={() => onRetryFrame(m)}
            className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-[11px] text-[#9a96a8] hover:text-[#c9b8e8] transition-all cursor-pointer font-medium"
          >
            🔄 Retry Frame
          </button>
        )}
        {onUseAsCast && (
          <button
            onClick={() => onUseAsCast(m)}
            className="px-3 py-1.5 bg-[#252538] border border-white/10 rounded-full text-[11px] text-[#9a96a8] hover:text-[#c9b8e8] transition-all cursor-pointer font-medium"
          >
            👤 Add to Cast
          </button>
        )}
      </div>

      {/* Storyboard Animate Drawer */}
      {animOpen && (
        <div className="bg-[#252538] border border-white/10 rounded-xl p-3 flex flex-col gap-2 mt-1 w-full max-w-[480px] animate-in slide-in-from-top-2 duration-150">
          <input
            type="text"
            placeholder="Animate prompt..."
            value={animPrompt}
            onChange={(e) => setAnimPrompt(e.target.value)}
            className="sb-edit-input"
            style={{
              background: 'var(--bg)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text)',
              fontSize: '13px',
              width: '100%',
              outline: 'none'
            }}
          />
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Engine:</span>
            <select
              value={animEngine}
              onChange={(e) => setAnimEngine(e.target.value)}
              className="bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px] text-[#c9b8e8]"
            >
              <option value="aurora">Aurora &middot; xAI — $0.05/s</option>
              <option value="seedance15spicy">Seedance Spicy — $0.06/s</option>
              <option value="wan22spicy">Wan 2.2 Spicy — $0.15/s</option>
              <option value="ltx23spicy">LTX 2.3 Spicy — $0.10/s</option>
            </select>

            <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Dur:</span>
            <select
              value={animDur}
              onChange={(e) => setDur(parseInt(e.target.value))}
              className="img-control-select bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px]"
            >
              <option value="4">4s</option>
              <option value="5">5s</option>
              <option value="8">8s</option>
              <option value="10">10s</option>
            </select>

            <button
              onClick={() => {
                onAnimate(animPrompt, animEngine, animDur, animRes);
                setAnimOpen(false);
              }}
              className="bg-[#64b4ff] hover:bg-[#64b4ff]/90 text-[#1a1a2e] px-4 py-1 rounded-full text-[11px] font-bold ml-auto cursor-pointer"
            >
              Animate Frame ▶
            </button>
          </div>
        </div>
      )}

      {/* Storyboard inline Edit Drawer */}
      {editOpen && (
        <div className="bg-[#252538] border border-white/10 rounded-xl p-3 flex flex-col gap-2 mt-1 w-full max-w-[480px] animate-in slide-in-from-top-2 duration-150">
          <input
            type="text"
            placeholder="Change description... (e.g. her vest is red, add lightning)"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="sb-edit-input"
            style={{
              background: 'var(--bg)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text)',
              fontSize: '13px',
              width: '100%',
              outline: 'none'
            }}
          />
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Edit Model</span>
              <select
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="bg-[#2e2e48] border border-white/5 rounded p-1 text-[10px] text-[#c9b8e8]"
              >
                <option value="wan27">Wan 2.7 Edit — $0.03</option>
                <option value="wan27pro">Wan 2.7 Pro — $0.06</option>
                <option value="fluxkontext">Flux Kontext — $0.02</option>
                <option value="qwen2">Qwen 2.0 Edit — $0.03</option>
              </select>
            </div>
            <button
              onClick={() => {
                onEdit(editPrompt, m.src, editModel);
                setEditOpen(false);
              }}
              className="bg-[#c9b8e8] hover:bg-[#c9b8e8]/90 text-[#1a1a2e] px-4 py-1 rounded-full text-[11px] font-bold cursor-pointer"
            >
              Apply Edit ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper downloader
function saveImageToFiles(src: string, altText: string) {
  const safeName = (altText || 'image').slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `zaor_image_${safeName}_${Date.now()}.png`;

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
