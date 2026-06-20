import React, { useState, useRef, useEffect } from 'react';
import { ModelRegistryEntry, MODEL_REGISTRY } from '../api';
import {
  Image, Video, Sparkles, Send, Lock, ChevronDown, ChevronUp, RefreshCw, Upload, Eye
} from 'lucide-react';

interface InputControlsProps {
  mode: 'chat' | 'image' | 'video' | 'enhance' | 'edit';
  onModeChange: (newMode: 'chat' | 'image' | 'video' | 'enhance' | 'edit') => void;
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;

  // Style Lock State
  styleLockActive: boolean;
  lockedStyle: string;
  onToggleStyleLock: (active: boolean, style: string) => void;
  onClearStyleLock: () => void;

  // Image Model Options
  imageModel: string;
  onChangeImageModel: (val: string) => void;
  imageRatio: string;
  onChangeImageRatio: (val: string) => void;
  imageRes: string;
  onChangeImageRes: (val: string) => void;
  imageCount: number;
  onChangeImageCount: (val: number) => void;
  imageSteps: number;
  onChangeImageSteps: (val: number) => void;
  imageGuidance: number;
  onChangeImageGuidance: (val: number) => void;

  // Video Model Options
  videoEngine: string;
  onChangeVideoEngine: (val: string) => void;
  videoDur: number;
  onChangeVideoDur: (val: number) => void;
  videoRes: string;
  onChangeVideoRes: (val: string) => void;
  videoRatio: string;
  onChangeVideoRatio: (val: string) => void;

  // Enhance Mode options
  cleanModel: string;
  onChangeCleanModel: (val: string) => void;
  onAutoClean: () => Promise<void>;
  upscaleModel: string;
  onChangeUpscaleModel: (val: string) => void;
  upscaleRes: string;
  onChangeUpscaleRes: (val: string) => void;
  onUpscaleSubmit: () => Promise<void>;

  // Upload/Edit actions
  hasEditTarget: boolean;
  editModel: string;
  onChangeEditModel: (val: string) => void;
  onUploadClick: () => void;

  // Cost string
  costEstimate: string;
}

export const InputControls: React.FC<InputControlsProps> = ({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  onSubmit,
  isLoading,
  styleLockActive,
  lockedStyle,
  onToggleStyleLock,
  onClearStyleLock,
  imageModel,
  onChangeImageModel,
  imageRatio,
  onChangeImageRatio,
  imageRes,
  onChangeImageRes,
  imageCount,
  onChangeImageCount,
  imageSteps,
  onChangeImageSteps,
  imageGuidance,
  onChangeImageGuidance,
  videoEngine,
  onChangeVideoEngine,
  videoDur,
  onChangeVideoDur,
  videoRes,
  onChangeVideoRes,
  videoRatio,
  onChangeVideoRatio,
  cleanModel,
  onChangeCleanModel,
  onAutoClean,
  upscaleModel,
  onChangeUpscaleModel,
  upscaleRes,
  onChangeUpscaleRes,
  onUpscaleSubmit,
  hasEditTarget,
  editModel,
  onChangeEditModel,
  onUploadClick,
  costEstimate
}) => {
  const [styleExpanded, setStyleExpanded] = useState(false);
  const [localStyle, setLocalStyle] = useState(lockedStyle);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalStyle(lockedStyle);
  }, [lockedStyle]);

  // Handle auto-growing textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const activeBadgeStyle = styleLockActive && lockedStyle.trim()
    ? 'bg-[#c9b8e8]/20 border-[#c9b8e8]/45 text-[#c9b8e8]'
    : 'bg-[#1a1a2e] border-white/5 text-[#9a96a8]';

  const placeholders = {
    chat: 'Roleplay with Zaor or command the AI...',
    image: 'Describe an image in detail (looks, lighting, environment)...',
    video: 'Describe video motion (subject motion, panning, tempo)...',
    edit: 'Describe what to edit, retain, or swap...',
    enhance: 'Use modular enhancers or upscales below...'
  };

  return (
    <div className={`p-4 border-t shrink-0 w-full overflow-hidden transition-colors duration-300 ${
      mode === 'image' || mode === 'edit'
        ? 'border-[#c47a8a]/20 bg-[#1a1a2e]/95'
        : mode === 'video'
        ? 'border-[#64b4ff]/20 bg-[#1a1a2e]/95'
        : mode === 'enhance'
        ? 'border-emerald-500/20 bg-[#1a1a2e]/95'
        : 'border-white/5 bg-[#1a1a2e]'
    }`}>
      {/* Mode Indicator & Pricing Estimator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${
          mode === 'image' || mode === 'edit' ? 'text-[#c9b8e8]' : mode === 'video' ? 'text-[#64b4ff]' : mode === 'enhance' ? 'text-emerald-400' : 'text-[#9a96a8]'
        }`}>
          {mode === 'chat' && '💬 Chat / Story Mode'}
          {mode === 'image' && '🎨 T2I Image Mode'}
          {mode === 'video' && '🎥 Video Render Mode'}
          {mode === 'edit' && '✏️ Image Revision Mode'}
          {mode === 'enhance' && '✨ Detail Enhancer Mode'}
        </span>
        <div className="flex items-center gap-2">
          {costEstimate && (
            <span className="text-[10px] text-[#9a96a8] bg-[#252538] border border-white/5 px-2 py-0.5 rounded-md font-semibold tracking-wider animate-pulse">
              Cost: {costEstimate}
            </span>
          )}
          {mode === 'enhance' && (
            <button
              onClick={() => onModeChange('chat')}
              className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer font-bold select-none"
            >
              Close ✕
            </button>
          )}
        </div>
      </div>

      {/* Style Lock Panel Expansion */}
      {(mode === 'image' || mode === 'edit') && (
        <div className="mb-3 border-b border-white/5 pb-3">
          <div
            onClick={() => setStyleExpanded(!styleExpanded)}
            className="flex items-center justify-between text-xs hover:text-[#c9b8e8] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${activeBadgeStyle}`}>
                Style Lock: {styleLockActive && lockedStyle.trim() ? 'Active' : 'Inactive'}
              </span>
            </div>
            {styleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>

          {styleExpanded && (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                placeholder="Lock visual descriptors (e.g. 1980s retro comic ink, grainy film, gritty shadows)..."
                value={localStyle}
                onChange={(e) => setLocalStyle(e.target.value)}
                rows={1}
                className="w-full bg-[#252538] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none h-12 focus:border-[#c9b8e8]"
              />
              <div className="flex gap-2 justify-end">
                {styleLockActive && (
                  <button
                    onClick={onClearStyleLock}
                    className="p-1 px-3 bg-red-950/20 border border-red-900/30 rounded-lg text-[10px] font-semibold text-rose-300 hover:bg-[#c47a8a]/20 cursor-pointer"
                  >
                    Clear Locked
                  </button>
                )}
                <button
                  onClick={() => onToggleStyleLock(!styleLockActive, localStyle)}
                  className={`p-1 px-3 rounded-lg text-[10px] font-bold cursor-pointer ${
                    styleLockActive
                      ? 'bg-[#252538] border border-[#c9b8e8] text-[#c9b8e8]'
                      : 'bg-[#c9b8e8] text-[#1a1a2e]'
                  }`}
                >
                  {styleLockActive ? 'Unlock Style' : '🔒 Engage Style Lock'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revision Selection Drawer (Under Edit / Upload targets) */}
      {(mode === 'image' || mode === 'edit') && (
        <div className="mb-3 flex gap-2 flex-wrap items-center">
          <button
            onClick={onUploadClick}
            className="p-1.5 px-3 bg-[#252538] border border-white/10 hover:border-[#c9b8e8] rounded-xl text-xs text-[#9a96a8] hover:text-[#c9b8e8] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload size={12} /> Upload image to edit/animate
          </button>
          {hasEditTarget && (
            <div className="flex gap-1.5 items-center">
              <select
                value={editModel}
                onChange={(e) => {
                  onChangeEditModel(e.target.value);
                  onModeChange('edit');
                }}
                className="w-full sm:w-auto max-w-[200px] min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1.5 text-xs text-[#c9b8e8] outline-none truncate"
              >
                <option value="wan27-edit">Wan 2.7 Rev (WS) $0.03</option>
                <option value="wan27pro-edit">Wan 2.7 Pro Rev (WS) $0.06</option>
                <option value="flux-kontext">Flux Kontext (WS) $0.02</option>
                <option value="qwen2-edit">Qwen 2.0 Edit (WS) $0.03</option>
                <option value="qwen-edit">Qwen Edit (WS) $0.02</option>
                <option value="aurora-edit">Aurora Edit (xAI) $0.04</option>
                <option value="atlas-flux-kontext">Flux Kontext (Atlas) $0.025</option>
                <option value="atlas-qwen-edit">Qwen Edit (Atlas) $0.02</option>
              </select>
              <button
                onClick={() => onModeChange(mode === 'edit' ? 'chat' : 'edit')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  mode === 'edit'
                    ? 'bg-[#c47a8a] text-[#1a1a2e]'
                    : 'bg-[#252538] border border-[#c47a8a]/20 text-[#c47a8a] hover:bg-[#c47a8a]/20'
                }`}
              >
                ✏️ Edit Active Target
              </button>
            </div>
          )}
        </div>
      )}

      {/* Advanced Image Params Panel (T2I) */}
      {mode === 'image' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 bg-[#14142a]/30 p-2 border border-white/5 rounded-xl">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Model Base</span>
            <select
              value={imageModel}
              onChange={(e) => onChangeImageModel(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none truncate"
            >
              <option value="aurora-simple">Aurora Simple (xAI) $0.02</option>
              <option value="aurora-quality">Aurora Quality (xAI) $0.05</option>
              <option value="atlas-grok-simple">Aurora Simple (Atlas) $0.02</option>
              <option value="atlas-grok-quality">Aurora Quality (Atlas) $0.05</option>
              <option value="atlas-flux-dev">Flux Dev (Atlas) $0.01</option>
              <option value="atlas-flux-schnell">Flux Schnell (Atlas) $0.003</option>
              <option value="atlas-flux-2-pro">Flux 2 Pro (Atlas) $0.04</option>
              <option value="atlas-wan27-img">Wan 2.7 Image (Atlas) $0.03</option>
              <option value="z-image-turbo">Z-Image Turbo (Atlas) $0.01</option>
              <option value="z-image-lora">Z-Image Turbo (WS) $0.01</option>
              <option value="flux-lora">Flux Dev (WS) $0.015</option>
              <option value="chroma">Chroma Uncensored (WS) $0.015</option>
              <option value="klein9b-lora">Klein 9B LoRA (WS) $0.015</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Ratio</span>
            <select
              value={imageRatio}
              onChange={(e) => onChangeImageRatio(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="1:1">1:1 Sq</option>
              <option value="16:9">16:9 Lnd</option>
              <option value="9:16">9:16 Vrt</option>
              <option value="4:3">4:3 TV</option>
              <option value="3:2">3:2 Pic</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Resolution</span>
            <select
              value={imageRes}
              onChange={(e) => onChangeImageRes(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="1K">1K Std</option>
              <option value="2K">2K HD</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Images Count</span>
            <select
              value={imageCount}
              onChange={(e) => onChangeImageCount(parseInt(e.target.value) || 1)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="1">1 Frame</option>
              <option value="2">2 Frames</option>
              <option value="3">3 Frames</option>
              <option value="4">4 Frames</option>
            </select>
          </div>

          {/* Advanced Sliders if LoRA is Chosen */}
          {(imageModel === 'flux-lora' || imageModel === 'z-image-lora' || imageModel === 'klein9b-lora') && (
            <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-[#9a96a8]">
                  <span>Steps (Quality ratio): {imageSteps}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={imageSteps}
                  onChange={(e) => onChangeImageSteps(parseInt(e.target.value) || 28)}
                  className="accent-[#c9b8e8] w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-[#9a96a8]">
                  <span>Guidance Scale: {imageGuidance}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={imageGuidance}
                  onChange={(e) => onChangeImageGuidance(parseFloat(e.target.value) || 3.5)}
                  className="accent-[#c9b8e8] w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Video Params Panel (T2V) */}
      {mode === 'video' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 bg-[#14142a]/30 p-2 border border-white/5 rounded-xl">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Engine</span>
            <select
              value={videoEngine}
              onChange={(e) => onChangeVideoEngine(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none truncate"
            >
              <option value="aurora">Aurora T2V (xAI) $0.05/s</option>
              <option value="seedance15t2v">Seedance 1.5 (WS) $0.06/s</option>
              <option value="wan26t2v">Wan 2.6 (WS) $0.068/s</option>
              <option value="atlas-wan27-t2v">Wan 2.7 (Atlas) $0.02/s</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Clip Length</span>
            <select
              value={videoDur}
              onChange={(e) => onChangeVideoDur(parseInt(e.target.value) || 5)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="4">4 Seconds</option>
              <option value="5">5 Seconds</option>
              <option value="8">8 Seconds</option>
              <option value="10">10 Seconds</option>
              <option value="15">15 Seconds</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Dimensions</span>
            <select
              value={videoRatio}
              onChange={(e) => onChangeVideoRatio(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="16:9">16:9 Lnd</option>
              <option value="9:16">9:16 Vrt</option>
              <option value="1:1">1:1 Sq</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-[#9a96a8]">Output Quality</span>
            <select
              value={videoRes}
              onChange={(e) => onChangeVideoRes(e.target.value)}
              className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-1 text-[11px] text-[#f0ece4] outline-none"
            >
              <option value="480p">480p Fast</option>
              <option value="720p">720p HD</option>
            </select>
          </div>
        </div>
      )}

      {/* Advanced Enhancer Panel (Detail cleaner & Upscales) */}
      {mode === 'enhance' && (
        <div className="flex flex-col gap-3 mb-3 p-3 bg-[#14142a]/30 border border-white/5 rounded-xl text-xs select-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-white/5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-emerald-400">1. Digital artifact cleaner</label>
              <div className="flex gap-1.5 items-center">
                <select
                  value={cleanModel}
                  onChange={(e) => onChangeCleanModel(e.target.value)}
                  className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-2 text-xs text-[#f0ece4] outline-none truncate"
                >
                  <option value="qwen2-edit">Qwen 2.0 Edit (WS) $0.03</option>
                  <option value="qwen-edit">Qwen Edit (WS) $0.02</option>
                  <option value="flux-kontext">Flux Kontext (WS) $0.02</option>
                  <option value="wan27-edit">Wan 2.7 Edit (WS) $0.03</option>
                  <option value="atlas-flux-kontext">Flux Kontext (Atlas) $0.025</option>
                  <option value="atlas-qwen-edit">Qwen Edit (Atlas) $0.02</option>
                </select>
                <button
                  disabled={isLoading}
                  onClick={onAutoClean}
                  className="p-2 py-1.5 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40"
                >
                  🧹 Auto Clean
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-emerald-400">2. Ultimate Image Upscaler</label>
              <div className="flex gap-1.5 items-center">
                <select
                  value={upscaleModel}
                  onChange={(e) => onChangeUpscaleModel(e.target.value)}
                  className="w-full min-w-0 bg-[#252538] border border-white/5 rounded-lg p-2 text-xs text-[#f0ece4] outline-none truncate"
                >
                  <option value="standard">Standard $0.01</option>
                  <option value="precision">Clarity Pro $0.03</option>
                  <option value="premium">Ultimate Premium $0.06</option>
                </select>
                <select
                  value={upscaleRes}
                  onChange={(e) => onChangeUpscaleRes(e.target.value)}
                  className="w-24 shrink-0 bg-[#252538] border border-white/5 rounded-lg p-2 text-xs text-[#f0ece4] outline-none"
                >
                  {upscaleModel === 'precision' ? (
                    <>
                      <option value="2">2 MP</option>
                      <option value="4">4 MP</option>
                      <option value="8">8 MP</option>
                    </>
                  ) : (
                    <>
                      <option value="2k">2K</option>
                      <option value="4k">4K</option>
                      <option value="8k">8K</option>
                    </>
                  )}
                </select>
                <button
                  disabled={isLoading}
                  onClick={onUpscaleSubmit}
                  className="p-2 py-1.5 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40"
                >
                  ⬆ Upscale
                </button>
              </div>
            </div>
          </div>
          <p className="text-[9.5px] text-[#9a96a8] italic -mt-1 leading-tight">
            Note: Enhancer works on your active 🎯 <b>Edit Target</b> image. Generate or target frame logs first.
          </p>
        </div>
      )}

      {/* Primary Action Input Row */}
      <div className="flex items-end gap-2.5 bg-[#252538] border border-white/10 rounded-2xl p-2 pl-3">
        {mode === 'enhance' ? (
          <div className="flex-1 text-[11px] text-[#9a96a8] italic py-1.5 px-1 flex items-center gap-1.5 select-none">
            <span>✨ Enhancer Active. Select cleanup/upscale presets above to process the active target image.</span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[mode] || placeholders.chat}
            className="flex-1 bg-transparent border-none text-[#f0ece4] outline-none text-[14.5px] max-h-28 pr-1 resize-none font-sans py-1 leading-relaxed align-bottom"
          />
        )}

        <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
          {/* T2I Toggle Button */}
          <button
            onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')}
            className={`p-2 rounded-full cursor-pointer transition-all ${
              mode === 'image'
                ? 'bg-[#c47a8a]/20 text-[#c47a8a]'
                : 'text-[#9a96a8] hover:text-[#f0ece4]'
            }`}
            title="Image Mode"
          >
            <Image size={18} />
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')}
            className={`p-2 rounded-full cursor-pointer transition-all ${
              mode === 'video'
                ? 'bg-[#64b4ff]/20 text-[#64b4ff]'
                : 'text-[#9a96a8] hover:text-[#f0ece4]'
            }`}
            title="Video Render Mode"
          >
            <Video size={18} />
          </button>

          {/* Enhancers Toggle Button */}
          <button
            onClick={() => onModeChange(mode === 'enhance' ? 'chat' : 'enhance')}
            className={`p-2 rounded-full cursor-pointer transition-all ${
              mode === 'enhance'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[#9a96a8] hover:text-[#f0ece4]'
            }`}
            title="Detail Enhancers"
          >
            <Sparkles size={18} />
          </button>

          {/* Send Action Button */}
          {mode !== 'enhance' && (
            <button
              disabled={isLoading || !prompt.trim()}
              onClick={onSubmit}
              className={`p-2 rounded-full cursor-pointer transition-all flex items-center justify-center ${
                mode === 'image' || mode === 'edit'
                  ? 'bg-[#c47a8a] text-[#1a1a2e]'
                  : mode === 'video'
                  ? 'bg-[#64b4ff] text-[#1a1a2e]'
                  : 'bg-[#c9b8e8] text-[#1a1a2e]'
              } disabled:opacity-40 disabled:cursor-default`}
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
