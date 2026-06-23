import React, { useState, useEffect } from 'react';
import { LoRA, Character, StorySetup, PromptTemplate, Thread } from '../types';
import { DEFAULT_PROMPT_LIBRARY } from '../data';
import { MODEL_REGISTRY } from '../api';
import {
  Key, Database, Trash2, Library, Plus, Save, BookOpen, Users,
  Film, Settings, Cpu, Edit3, Clipboard, Download, Upload, ShieldAlert, Sparkles, Check, X
} from 'lucide-react';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;

  // Keys Local State
  keys: {
    apiKey: string;
    wavespeedKey: string;
    atlasKey: string;
    cloudinaryCloud: string;
    cloudinaryPreset: string;
    chatModel: string;
  };
  onSaveKeys: (updatedKeys: any) => void;
  storageSizeMB: string;
  onClearMedia: () => void;
  onClearAllChats: () => void;

  // Prompt Library
  userPrompts: PromptTemplate[];
  onSaveUserPrompt: (title: string, text: string) => void;
  onDeleteUserPrompt: (id: number) => void;
  onInsertPromptText: (text: string) => void;

  // LoRA State
  loras: LoRA[];
  onAddLora: (newLora: Omit<LoRA, 'id' | 'active'>) => void;
  onToggleLora: (id: number, val: boolean) => void;
  onToggleAllLoras: (active: boolean) => void;
  onUpdateLoraScale: (id: number, scale: number) => void;
  onDeleteLora: (id: number) => void;
  onImportLoras: (loraBackupJson: string) => void;

  // Storyboard settings
  storyboardOn: boolean;
  onToggleStoryboard: (val: boolean) => void;
  storyboardModel: string;
  onChangeStoryboardModel: (val: string) => void;
  storyboardRatio: string;
  onChangeStoryboardRatio: (val: string) => void;
  storyParaLimit: number;
  onChangeStoryParaLimit: (val: number) => void;

  // Cast Sheets
  cast: Character[];
  onAddCharacter: (char: Character) => void;
  onUpdateCharacterDesc: (index: number, desc: string) => void;
  onUpdateCharacterImage: (index: number, imageUrl: string) => void;
  onDeleteCharacter: (index: number) => void;
  onHelpWriteField: (promptHint: string, contextType: 'premise' | 'tone' | 'style' | 'character', existingValue: string, extraContext?: string) => Promise<string>;
  pendingCastImage?: { src: string, alt: string } | null;
  onConsumePendingImage?: () => void;

  // Story Setup
  setup: StorySetup;
  onSaveSetup: (setup: StorySetup) => void;

  // Save / Load Game state
  onSerializeGame: () => string | null;
  onDeserializeGame: (code: string) => void;

  // Export scene DT
  storyboardFrames: any[];
  onExportDT: () => void;

  // Rename & Delete state
  renameId: string | null;
  renameName: string;
  onSaveRename: (name: string) => void;
  deleteId: string | null;
  deleteName: string;
  onConfirmDelete: () => void;
}

export const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto select-none"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="bg-[#252538] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in duration-200">
      {children}
    </div>
  </div>
);

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  onClose,
  keys,
  onSaveKeys,
  storageSizeMB,
  onClearMedia,
  onClearAllChats,
  userPrompts,
  onSaveUserPrompt,
  onDeleteUserPrompt,
  onInsertPromptText,
  loras,
  onAddLora,
  onToggleLora,
  onToggleAllLoras,
  onUpdateLoraScale,
  onDeleteLora,
  onImportLoras,
  storyboardOn,
  onToggleStoryboard,
  storyboardModel,
  onChangeStoryboardModel,
  storyboardRatio,
  onChangeStoryboardRatio,
  storyParaLimit,
  onChangeStoryParaLimit,
  cast,
  onAddCharacter,
  onUpdateCharacterDesc,
  onUpdateCharacterImage,
  onDeleteCharacter,
  onHelpWriteField,
  pendingCastImage,
  onConsumePendingImage,
  setup,
  onSaveSetup,
  onSerializeGame,
  onDeserializeGame,
  storyboardFrames,
  renameId,
  renameName,
  onSaveRename,
  deleteId,
  deleteName,
  onConfirmDelete
}) => {
  if (!activeModal) return null;

  // Render a stable wrapper for Overlay
  const OverlayWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ModalOverlay onClose={onClose}>{children}</ModalOverlay>
  );

  return (
    <>
      {/* 1. API Keys & Storage Clear Modal */}
      {activeModal === 'api' && (
        <APIKeysModal
          Overlay={ModalOverlay}
          onClose={onClose}
          keys={keys}
          onSaveKeys={onSaveKeys}
          storageSizeMB={storageSizeMB}
          onClearMedia={onClearMedia}
          onClearAllChats={onClearAllChats}
        />
      )}

      {/* 2. Prompt Library Modal */}
      {activeModal === 'library' && (
        <PromptLibraryModal
          Overlay={ModalOverlay}
          onClose={onClose}
          userPrompts={userPrompts}
          onSaveUserPrompt={onSaveUserPrompt}
          onDeleteUserPrompt={onDeleteUserPrompt}
          onInsertPromptText={onInsertPromptText}
        />
      )}

      {/* 3. LoRA Manager Modal */}
      {activeModal === 'lora' && (
        <LoraManagerModal
          Overlay={ModalOverlay}
          onClose={onClose}
          loras={loras}
          onAddLora={onAddLora}
          onToggleLora={onToggleLora}
          onToggleAllLoras={onToggleAllLoras}
          onUpdateLoraScale={onUpdateLoraScale}
          onDeleteLora={onDeleteLora}
          onImportLoras={onImportLoras}
        />
      )}

      {/* 4. Storyboard Settings Modal */}
      {activeModal === 'storyboard' && (
        <StoryboardSettingsModal
          Overlay={ModalOverlay}
          onClose={onClose}
          storyboardOn={storyboardOn}
          onToggleStoryboard={onToggleStoryboard}
          storyboardModel={storyboardModel}
          onChangeStoryboardModel={onChangeStoryboardModel}
          storyboardRatio={storyboardRatio}
          onChangeStoryboardRatio={onChangeStoryboardRatio}
          storyParaLimit={storyParaLimit}
          onChangeStoryParaLimit={onChangeStoryParaLimit}
        />
      )}

      {/* 5. Cast Overlay Modal */}
      {activeModal === 'cast' && (
        <CastModal
          Overlay={ModalOverlay}
          onClose={onClose}
          cast={cast}
          onAddCharacter={onAddCharacter}
          onUpdateCharacterDesc={onUpdateCharacterDesc}
          onUpdateCharacterImage={onUpdateCharacterImage}
          onDeleteCharacter={onDeleteCharacter}
          onHelpWriteField={onHelpWriteField}
          pendingCastImage={pendingCastImage}
          onConsumePendingImage={onConsumePendingImage}
        />
      )}

      {/* 6. Story Setup Modal */}
      {activeModal === 'setup' && (
        <StorySetupModal
          Overlay={ModalOverlay}
          onClose={onClose}
          currentSetup={setup}
          onSaveSetup={onSaveSetup}
          onHelpWriteField={onHelpWriteField}
        />
      )}

      {/* 7. Save / Load Game Modal */}
      {activeModal === 'savegame' && (
        <SaveLoadModal
          Overlay={ModalOverlay}
          onClose={onClose}
          onSerializeGame={onSerializeGame}
          onDeserializeGame={onDeserializeGame}
        />
      )}

      {/* 8. Export Draw Things Modal */}
      {activeModal === 'drawthings' && (
        <ExportDrawThingsModal
          Overlay={ModalOverlay}
          onClose={onClose}
          storyboardRatio={storyboardRatio}
          storyboardFrames={storyboardFrames}
          setup={setup}
          cast={cast}
          loras={loras}
        />
      )}

      {/* 9. Rename Thread Modal */}
      {activeModal === 'rename' && (
        <RenameModal
          Overlay={ModalOverlay}
          onClose={onClose}
          renameId={renameId}
          initialName={renameName}
          onSaveRename={onSaveRename}
        />
      )}

      {/* 10. Delete Confirm Modal */}
      {activeModal === 'delete' && (
        <DeleteModal
          Overlay={ModalOverlay}
          onClose={onClose}
          deleteId={deleteId}
          deleteName={deleteName}
          onConfirmDelete={onConfirmDelete}
        />
      )}
    </>
  );
};

// ────────── INDIVIDUAL MODAL COMPONENTS ──────────

// MODEL PRICING & CAPABILITY DATA
const modelDetails: Record<string, { name: string; costIn: string; costOut: string; desc: string; cap: string }> = {
  'grok-beta': {
    name: 'Grok Beta (Standard)',
    costIn: '$5.00',
    costOut: '$15.00',
    desc: 'Legacy Grok text model. Capable but has older pricing rates.',
    cap: 'Balanced text generation, general tasks'
  },
  'grok-2-latest': {
    name: 'Grok 2 (Latest Release)',
    costIn: '$2.00',
    costOut: '$10.00',
    desc: 'Flagship Grok 2 model. Excellent at coding, long-context writing, and high-fidelity roleplay.',
    cap: 'State-of-the-art language comprehension, coding, creative scenarios'
  },
  'grok-2': {
    name: 'Grok 2',
    costIn: '$2.00',
    costOut: '$10.00',
    desc: 'Standard production-grade Grok 2.',
    cap: 'Reliable reasoning, high speed, structured parsing'
  },
  'grok-2-1212': {
    name: 'Grok 2 (Dec 2024 Build)',
    costIn: '$2.00',
    costOut: '$10.00',
    desc: 'Pinned version of Grok 2 from December 2024 Build.',
    cap: 'Deterministic output testing, creative prose'
  },
  'grok-3-latest': {
    name: 'Grok 3 (Latest Flagship)',
    costIn: '$4.00',
    costOut: '$16.00',
    desc: 'The absolute state-of-the-art xAI reasoning model. Unmatched planning, logical depth, and complex lore parsing.',
    cap: 'Advanced logical chains, complex world-building, highly detailed narration'
  },
  'grok-3': {
    name: 'Grok 3 (Standard)',
    costIn: '$4.00',
    costOut: '$16.00',
    desc: 'Standard production Grok 3 with peak intelligence and maximum context reasoning.',
    cap: 'Deep lore coherence, highly creative and articulate dialogues'
  },
  'grok-3-mini': {
    name: 'Grok 3 Mini',
    costIn: '$0.55',
    costOut: '$2.19',
    desc: 'Incredibly fast and ultra-affordable lightweight model. High-speed responses at a fraction of the cost.',
    cap: 'Blazing fast draft responses, extremely cost-effective testing'
  },
  'grok-4-latest': {
    name: 'Grok 4 (Preview)',
    costIn: 'TBD',
    costOut: 'TBD',
    desc: 'Experimental next-generation model platform placeholder.',
    cap: 'Cutting-edge experimentation and preview benchmarks'
  }
};

// API KEYS MODAL
const APIKeysModal = ({ Overlay, onClose, keys, onSaveKeys, storageSizeMB, onClearMedia, onClearAllChats }: any) => {
  const [localKeys, setLocalKeys] = useState(keys);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLiveModels = async () => {
    if (!localKeys.apiKey) {
      setFetchError('Please enter an xAI API Key first.');
      return;
    }
    setFetchingModels(true);
    setFetchError(null);
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localKeys.apiKey}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`Endpoint returned status ${res.status}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const modelIds = data.data.map((m: any) => m.id).filter((id: string) => typeof id === 'string');
        if (modelIds.length > 0) {
          setFetchedModels(modelIds);
          // If the current chatModel is not valid, pick the first one matching 'grok'
          if (!modelIds.includes(localKeys.chatModel)) {
            const bestDefault = modelIds.find((id: string) => id.includes('grok')) || modelIds[0];
            setLocalKeys((prev: any) => ({ ...prev, chatModel: bestDefault }));
          }
        } else {
          throw new Error('No supported model structures found in response.');
        }
      } else {
        throw new Error('Response format from xAI is not compatible.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Failed fetching models.');
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSave = () => {
    onSaveKeys(localKeys);
    onClose();
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Key size={20} /> API Credentials
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2">
          Stored locally in your browser. Encrypted/Sent only directly to the model endpoints.
        </p>

        <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">xAI API Key (Grok/Imagine)</label>
            <input
              type="password"
              placeholder="xai-..."
              value={localKeys.apiKey}
              onChange={(e) => setLocalKeys({ ...localKeys, apiKey: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">xAI Chat Model ID</label>
              <button
                type="button"
                onClick={fetchLiveModels}
                disabled={fetchingModels || !localKeys.apiKey}
                className="text-[10px] text-[#c9b8e8] hover:text-white flex items-center gap-1 bg-[#252542] hover:bg-[#32325c] px-2 py-0.5 rounded cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {fetchingModels ? 'Fetching...' : '⚡ Fetch Live Models'}
              </button>
            </div>
            
            {fetchError && (
              <p className="text-[10px] text-[#c47a8a] mb-1">{fetchError}</p>
            )}
            
            {fetchedModels.length > 0 && (
              <p className="text-[10px] text-[#7fc4a3] mb-1">
                ✓ Found {fetchedModels.length} models: {fetchedModels.slice(0, 3).join(', ')}{fetchedModels.length > 3 ? '...' : ''}
              </p>
            )}

            <div className="flex gap-2">
              <select
                value={
                  [
                    'grok-2', 
                    'grok-2-1212', 
                    'grok-2-latest', 
                    'grok-3',
                    'grok-3-latest', 
                    'grok-3-mini',
                    'grok-4-latest', 
                    ...fetchedModels
                  ].includes(localKeys.chatModel) ? localKeys.chatModel : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setLocalKeys({ ...localKeys, chatModel: e.target.value });
                  }
                }}
                className="bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8] min-w-[124px] cursor-pointer"
              >
                <option value="grok-2">grok-2</option>
                <option value="grok-2-1212">grok-2-1212</option>
                <option value="grok-2-latest">grok-2-latest</option>
                <option value="grok-3">grok-3</option>
                <option value="grok-3-latest">grok-3-latest</option>
                <option value="grok-3-mini">grok-3-mini</option>
                <option value="grok-4-latest">grok-4-latest</option>
                {fetchedModels.filter(m => ![
                  'grok-2', 'grok-2-1212', 'grok-2-latest', 
                  'grok-3', 'grok-3-latest', 'grok-3-mini', 'grok-4-latest'
                ].includes(m)).map((modelId) => (
                  <option key={modelId} value={modelId}>
                    {modelId} (Live)
                  </option>
                ))}
                <option value="custom">✍ Custom ID...</option>
              </select>
              <input
                type="text"
                placeholder="Model ID name..."
                value={localKeys.chatModel || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, chatModel: e.target.value })}
                className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
              />
            </div>

            {/* Selected Model Info Card & Capabilities Panel */}
            {(() => {
              const modelKey = localKeys.chatModel || 'grok-2-latest';
              const info = modelDetails[modelKey] || {
                name: modelKey,
                costIn: 'Variable',
                costOut: 'Variable',
                desc: 'A user-specified or dynamically fetched xAI/Grok model ID.',
                cap: 'Dynamic depending on the loaded xAI model architecture'
              };
              return (
                <div className="mt-1.5 p-2.5 bg-[#1b1b36] border border-[#c9b8e8]/20 rounded-lg text-[11px] text-[#9a96a8] flex flex-col gap-1.5 transition-all">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1">
                    <span className="font-semibold text-[#c9b8e8]">✨ {info.name}</span>
                    <span className="bg-[#242442] px-1.5 py-0.5 rounded text-[10px] text-[#7fc4a3] font-mono font-bold">
                      {info.costIn} / {info.costOut} <span className="text-[9px] text-[#8e8ca0] font-normal">per 1M tokens</span>
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] leading-relaxed">{info.desc}</p>
                  <div className="flex gap-1.5 items-center mt-0.5 text-[9px] text-[#9a96a8]">
                    <span className="font-semibold bg-[#2a233b] text-[#c9b8e8] border border-[#c9b8e8]/20 px-1 py-0.2 rounded uppercase tracking-wider text-[8px]">Capabilities</span>
                    <span className="text-white/90">{info.cap}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">WaveSpeed API Key (WAN / Spicy / Upscales)</label>
            <input
              type="password"
              placeholder="ws-..."
              value={localKeys.wavespeedKey}
              onChange={(e) => setLocalKeys({ ...localKeys, wavespeedKey: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Atlas Cloud API Key (Optional Cheap Video)</label>
            <input
              type="password"
              placeholder="atlas-..."
              value={localKeys.atlasKey}
              onChange={(e) => setLocalKeys({ ...localKeys, atlasKey: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
            />
          </div>

          <div className="border-t border-white/5 pt-2 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider flex items-center gap-1">
              Cloudinary (Required for ☁ Cloud Saves & Grabs)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Cloud Name"
                value={localKeys.cloudinaryCloud}
                onChange={(e) => setLocalKeys({ ...localKeys, cloudinaryCloud: e.target.value })}
                className="bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
              />
              <input
                type="text"
                placeholder="Unsigned Preset Name"
                value={localKeys.cloudinaryPreset}
                onChange={(e) => setLocalKeys({ ...localKeys, cloudinaryPreset: e.target.value })}
                className="bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider flex items-center gap-1">
              <Database size={12} /> Local Quotas
            </label>
            <div className="text-xs text-[#9a96a8] flex items-center justify-between bg-[#1a1a2e] border border-white/5 rounded-lg p-2">
              <span>Browser Used Size:</span>
              <span className="font-semibold text-[#f0ece4]">{storageSizeMB} MB</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  if (confirm('Frees browser database space. Clears heavy visual assets inside your chats, but retains all text history! Keep LoRAs and Setup sheets intact.')) {
                    onClearMedia();
                  }
                }}
                className="w-full bg-[#2e2e48] border border-white/5 rounded-lg p-2 text-xs text-[#f0ece4]/90 hover:bg-[#c9b8e8]/20 transition-all font-medium cursor-pointer"
              >
                🧹 Strip Media
              </button>
              <button
                onClick={() => {
                  if (confirm('Permanently delete all conversation threads from the browser? This can\'t be undone.')) {
                    onClearAllChats();
                  }
                }}
                className="w-full bg-red-950/20 border border-red-900/30 rounded-lg p-2 text-xs text-[#c47a8a] hover:bg-[#c47a8a]/20 transition-all font-medium cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Clear Chats
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2e2e48] hover:bg-[#2e2e48]/80 text-[#9a96a8] rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-[#c9b8e8] hover:bg-[#c9b8e8]/90 text-[#1a1a2e] rounded-xl p-2.5 text-xs font-bold cursor-pointer"
          >
            Save Keys
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// PROMPT LIBRARY MODAL
const PromptLibraryModal = ({ Overlay, onClose, userPrompts, onSaveUserPrompt, onDeleteUserPrompt, onInsertPromptText }: any) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'edit' | 'modifier' | 'mine'>('all');
  const [search, setSearch] = useState('');
  const [saveTitle, setSaveTitle] = useState('');

  const libraryAll = [
    ...DEFAULT_PROMPT_LIBRARY,
    ...userPrompts.map((p: any) => ({ ...p, type: 'mine', cat: p.cat || 'Mine', isUser: true }))
  ];

  const filteredItems = libraryAll.filter(item => {
    const matchesFilter = filter === 'all' ? !item.isUser : (filter === 'mine' ? item.isUser : item.type === filter);
    const matchesSearch = !search ||
      (item.title + ' ' + item.cat + ' ' + item.text).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSaveCurrent = () => {
    const text = (document.getElementById('prompt') as HTMLTextAreaElement)?.value || '';
    if (!text.trim()) {
      alert('Type a prompt in the input box first, then click Save.');
      return;
    }
    const name = window.prompt('Name this template:', text.slice(0, 40) + '...');
    if (!name) return;
    onSaveUserPrompt(name.trim(), text.trim());
    setFilter('mine');
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Library size={20} /> Prompt Library
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2">
          Tap any template card to copy it into your prompt input, then format the <b>[brackets]</b>.
        </p>

        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
        />

        {/* Filters Grid */}
        <div className="flex gap-1 flex-wrap">
          {['all', 'image', 'video', 'edit', 'modifier', 'mine'].map((f: any) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`p-1.5 px-3 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                filter === f ? 'bg-[#c9b8e8] text-[#1a1a2e] font-bold' : 'bg-[#1a1a2e]/60 border border-white/5 text-[#9a96a8]'
              }`}
            >
              {f === 'all' ? 'All Templates' : f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 max-h-[350px]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#9a96a8]/50 italic">
              No matching templates found.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onInsertPromptText(item.text)}
                className="bg-[#1a1a2e]/40 hover:bg-[#1a1a2e]/80 border border-white/5 hover:border-[#c9b8e8]/30 rounded-xl p-3 cursor-pointer transition-colors relative group"
              >
                <div className="flex justify-between items-start mb-1 text-[10px]">
                  <span className="uppercase text-[#c9b8e8] font-bold">{item.cat}</span>
                  {item.isUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this saved template?')) {
                          onDeleteUserPrompt(item.id);
                        }
                      }}
                      className="p-1 rounded text-[#9a96a8] hover:text-[#c47a8a] bg-white/5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
                <div className="text-xs text-[#f0ece4] font-semibold mb-1">{item.title}</div>
                <div className="text-xs text-[#9a96a8] line-clamp-2 italic whitespace-pre-wrap">{item.text}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2e2e48] text-[#9a96a8] rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleSaveCurrent}
            className="flex-1 bg-[#c9b8e8] text-[#1a1a2e] rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save size={13} /> Save Input Box
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// LORA MANAGER MODAL
const LoraManagerModal = ({ Overlay, onClose, loras, onAddLora, onToggleLora, onToggleAllLoras, onUpdateLoraScale, onDeleteLora, onImportLoras }: any) => {
  const [loraName, setLoraName] = useState('');
  const [loraUrl, setLoraUrl] = useState('');
  const [loraTrigger, setLoraTrigger] = useState('');
  const [loraNotes, setLoraNotes] = useState('');
  const [loraBase, setLoraBase] = useState('Flux');
  const [loraCategory, setLoraCategory] = useState<'realism'|'style'>('realism');
  const [loraScale, setLoraScale] = useState(1);
  const [copied, setCopied] = useState(false);
  
  const [openSection, setOpenSection] = useState<'realism'|'style'>('realism');

  const activeCount = loras.filter((l: any) => l.active).length;

  const handleAdd = () => {
    if (!loraUrl.trim()) return alert('Paste a valid Hugging Face or Civitai LoRA path.');
    onAddLora({
      name: loraName.trim() || 'Untitled LoRA',
      url: loraUrl.trim(),
      trigger: loraTrigger.trim(),
      notes: loraNotes.trim(),
      base: loraBase,
      category: loraCategory,
      scale: Number(loraScale) || 1
    });
    setLoraName('');
    setLoraUrl('');
    setLoraTrigger('');
    setLoraNotes('');
    setLoraScale(1);
  };

  const handleExport = async () => {
    if (!loras.length) return alert('No LoRAs to export');
    const txt = JSON.stringify(loras, null, 2);
    const filename = `zaor_loras_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    try {
      const file = new File([txt], filename, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'LoRA Backup',
        });
      } else if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(txt);
        await writable.close();
      } else {
        const blob = new Blob([txt], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Save failed:', e);
      }
      return; 
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const raw = re.target?.result as string;
        if (raw) onImportLoras(raw);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const renderLoraList = (cat: 'realism'|'style') => {
    const filteredLoras = loras.filter((l: any) => (l.category === cat) || (!l.category && cat === 'realism'));
    if (filteredLoras.length === 0) {
      return (
        <div className="p-4 text-center text-[10px] text-[#9a96a8]/50 italic">
          No LoRAs in this category.
        </div>
      );
    }
    return filteredLoras.map((l: any, idx: number) => (
      <div key={l.id} className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-3 flex items-start justify-between gap-3 relative group mb-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={l.active}
            onChange={(e) => onToggleLora(l.id, e.target.checked)}
            disabled={!l.active && activeCount >= 3}
            className="w-4.5 h-4.5 accent-[#c9b8e8] cursor-pointer disabled:opacity-50 mt-0.5"
            title={!l.active && activeCount >= 3 ? 'Max 3 LoRAs active' : ''}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#f0ece4] truncate">
              {l.name}
            </div>
            <div className="text-[10px] text-[#9a96a8] truncate mt-0.5">
              Base: <b className="text-[#c9b8e8]">{l.base}</b> &middot; Trigger: <b>{l.trigger}</b>
            </div>
            {l.notes && (
              <div className="text-[10px] text-[#9a96a8]/70 line-clamp-1 italic mt-0.5">📝 {l.notes}</div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-[#9a96a8]">Weight</span>
              <input
                type="number"
                min="0"
                max="2"
                step="0.05"
                value={l.scale}
                onChange={(e) => onUpdateLoraScale(l.id, parseFloat(e.target.value) || 1)}
                className="bg-[#1a1a2e] border border-white/10 rounded w-16 p-0.5 text-center text-[10px] text-[#f0ece4] outline-none"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => onDeleteLora(l.id)}
          className="p-1 rounded text-[#9a96a8] hover:text-[#c47a8a] bg-white/5 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      </div>
    ));
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4 max-h-[88vh]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            🧬 LoRA Manager
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] text-[#9a96a8] -mt-2 leading-relaxed">
          Tether weights via Hugging Face/Civitai. Max <b>3</b> total active across all categories. Compatible with Flux, Klein and Z-Image.
        </p>

        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onToggleAllLoras(false)}
              className="p-1 px-3 bg-[#1a1a2e] border border-white/5 hover:border-[#c9b8e8]/30 rounded-lg text-[10px] uppercase font-bold text-[#9a96a8] cursor-pointer"
            >
              Turn All Off
            </button>
            <span className="text-[10px] text-[#c9b8e8] flex items-center bg-[#c9b8e8]/10 px-2 rounded-lg font-mono">
              {activeCount}/3 Active Slots Used
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className={`p-1 px-2.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-[#1a1a2e]/60 text-[#f0ece4]'}`}>
              {copied ? <Check size={11} /> : <Download size={11} />} {copied ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleImport} className="p-1 px-2.5 bg-[#1a1a2e]/60 rounded-lg text-xs text-[#f0ece4] flex items-center gap-1 cursor-pointer">
              <Upload size={11} /> Load
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {/* Realism Category */}
          <div className="bg-[#1a1a2e]/30 border border-white/5 rounded-xl overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'realism' ? 'style' : 'realism')}
              className="w-full text-left p-3 flex justify-between items-center bg-[#252538] hover:bg-[#2a2a40] transition-colors cursor-pointer"
            >
              <h3 className="text-xs font-bold text-[#f0ece4] uppercase tracking-wider">Realism</h3>
              <span className="text-[#9a96a8] text-xs font-mono">{loras.filter((l: any) => l.category === 'realism' || !l.category).length} loaded</span>
            </button>
            {openSection === 'realism' && (
              <div className="p-2 border-t border-white/5">
                {renderLoraList('realism')}
              </div>
            )}
          </div>

          {/* Style Category */}
          <div className="bg-[#1a1a2e]/30 border border-white/5 rounded-xl overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'style' ? 'realism' : 'style')}
              className="w-full text-left p-3 flex justify-between items-center bg-[#252538] hover:bg-[#2a2a40] transition-colors cursor-pointer"
            >
              <h3 className="text-xs font-bold text-[#f0ece4] uppercase tracking-wider">Anatomy & Style Control</h3>
              <span className="text-[#9a96a8] text-xs font-mono">{loras.filter((l: any) => l.category === 'style').length} loaded</span>
            </button>
            {openSection === 'style' && (
              <div className="p-2 border-t border-white/5">
                {renderLoraList('style')}
              </div>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="border border-white/5 bg-[#1b1b32] rounded-xl p-3 flex flex-col gap-3 mt-1">
          <span className="text-[10px] uppercase font-bold text-[#c9b8e8] tracking-widest flex items-center gap-1.5"><Plus size={12}/> Register New LoRA Asset</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Name (e.g. Cinematic Film)"
              value={loraName}
              onChange={(e) => setLoraName(e.target.value)}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8] placeholder:text-white/20"
            />
            <input
              type="text"
              placeholder="HF or Civitai URL Target"
              value={loraUrl}
              onChange={(e) => setLoraUrl(e.target.value)}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8] placeholder:text-white/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Trigger Words (comma separated)"
              value={loraTrigger}
              onChange={(e) => setLoraTrigger(e.target.value)}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8] placeholder:text-white/20 md:col-span-2"
            />
            <select
              value={loraBase}
              onChange={(e) => setLoraBase(e.target.value)}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none w-full"
            >
              <option value="Flux" className="bg-[#1a1a2e]">Base: Flux</option>
              <option value="Flux2-Klein" className="bg-[#1a1a2e]">Base: Klein 9B</option>
              <option value="Z-Image" className="bg-[#1a1a2e]">Base: Z-Image</option>
              <option value="Other" className="bg-[#1a1a2e]">Base: Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Notes (optional)"
              value={loraNotes}
              onChange={(e) => setLoraNotes(e.target.value)}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none placeholder:text-white/20 md:col-span-2"
            />
            <select
              value={loraCategory}
              onChange={(e) => setLoraCategory(e.target.value as 'realism'|'style')}
              className="bg-[#131326] border border-white/5 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none w-full"
            >
              <option value="realism" className="bg-[#1a1a2e]">Cat: Realism</option>
              <option value="style" className="bg-[#1a1a2e]">Cat: Anatomy & Style</option>
            </select>
            <div className="flex items-center gap-2 bg-[#131326] border border-white/5 rounded-lg p-2.5">
              <span className="text-[10px] text-[#9a96a8] uppercase font-bold">Scale</span>
              <input
                type="number"
                min="0"
                max="2"
                step="0.05"
                placeholder="1.0"
                value={loraScale}
                onChange={(e) => setLoraScale(parseFloat(e.target.value) || 1)}
                className="bg-transparent text-xs text-[#f0ece4] outline-none text-center w-full min-w-0"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-[#c9b8e8] hover:bg-[#b5a3d4] text-[#1a1a2e] rounded-xl p-3 text-xs font-bold mt-1 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Add LoRA Setup
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// STORYBOARD SETTINGS MODAL
const StoryboardSettingsModal = ({ Overlay, onClose, storyboardOn, onToggleStoryboard, storyboardModel, onChangeStoryboardModel, storyboardRatio, onChangeStoryboardRatio, storyParaLimit, onChangeStoryParaLimit }: any) => {
  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Film size={20} /> Storyboard Director Rules
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2 leading-relaxed">
          The director's eye automatically analyzes scene context to generate visual storyboard frames when key character, location, or dress changes are detected.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between bg-[#1a1a2e] border border-white/5 p-4 rounded-xl">
          <div>
            <div className="text-xs font-semibold text-[#f0ece4]">Director Engine</div>
            <div className="text-[10px] text-[#9a96a8]">Toggle background calculations</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={storyboardOn}
              onChange={(e) => onToggleStoryboard(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#2e2e48] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9b8e8]" />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider flex justify-between">
              <span>Text Narration Paragraph Limit</span>
              <span className="text-[#c9b8e8] opacity-80">(Prevents Director Confusion)</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={storyParaLimit}
              onChange={(e) => onChangeStoryParaLimit(parseInt(e.target.value) || 0)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none"
            />
            <p className="text-[10px] text-[#9a96a8]/70 leading-tight">
              Set to 0 to disable limits. Shorter replies (e.g. 1-2 paragraphs) make it significantly easier for the frame director to trigger accurate keyframes from your turns.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Default Frame Generator Model</label>
            <select
              value={storyboardModel}
              onChange={(e) => onChangeStoryboardModel(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none"
            >
              {Object.entries(MODEL_REGISTRY)
                .filter(([_, m]) => m.cat === 't2img')
                .map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label} — ${m.price}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Frames Aspect Ratio</label>
            <select
              value={storyboardRatio}
              onChange={(e) => onChangeStoryboardRatio(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none"
            >
              <option value="16:9">16:9 &mdash; Cinematic Horizontal</option>
              <option value="1:1">1:1 &mdash; Classic Square</option>
              <option value="9:16">9:16 &mdash; Vertical Mobile Portrait</option>
              <option value="4:3">4:3 &mdash; Retro Television</option>
              <option value="3:4">3:4 &mdash; Book Cover Page</option>
            </select>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#c9b8e8] text-[#1a1a2e] rounded-xl p-2.5 text-xs font-bold mt-2 cursor-pointer"
        >
          Confirm Settings
        </button>
      </div>
    </Overlay>
  );
};

// HelpMeWrite Inline Action Component
const HelpMeWriteAction = ({ onApply, contextType, existingValue, extraContext, onHelpWriteField }: any) => {
  const [isWriting, setIsWriting] = useState(false);

  const handleExecute = async () => {
    setIsWriting(true);
    try {
      const result = await onHelpWriteField('', contextType, existingValue, extraContext);
      if (result) onApply(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <button 
      type="button" 
      disabled={isWriting}
      onClick={handleExecute}
      className="ml-2 text-[9px] font-bold tracking-wider uppercase text-[#c9b8e8]/70 hover:text-[#c9b8e8] transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isWriting ? 'Writing...' : 'Auto-Fill'}
    </button>
  );
};

// Image resizer utility to prevent QuotaExceededError in localStorage
const resizeImageToDataUrl = (file: File, maxSize: number = 512): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// CAST SHEETS MODAL
const CastModal = ({ Overlay, onClose, cast, onAddCharacter, onUpdateCharacterDesc, onUpdateCharacterImage, onDeleteCharacter, onHelpWriteField, pendingCastImage, onConsumePendingImage }: any) => {
  const [characterName, setCharacterName] = useState('');
  const [characterDesc, setCharacterDesc] = useState('');
  const [newCharacterImage, setNewCharacterImage] = useState('');

  const handleAdd = () => {
    if (!characterName.trim()) return alert('Please enter a character name');
    onAddCharacter({
      name: characterName.trim(),
      desc: characterDesc.trim(),
      imageUrl: newCharacterImage.trim() || undefined
    });
    setCharacterName('');
    setCharacterDesc('');
    setNewCharacterImage('');
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Users size={20} /> Active Cast List
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2 leading-relaxed">
          Characters for the current story are saved here. Optional visual references are kept local to keep consistent generated frames.
        </p>

        {pendingCastImage && (
          <div className="bg-[#c9b8e8]/10 border border-[#c9b8e8]/30 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <img src={pendingCastImage.src} className="w-10 h-10 rounded border border-[#c9b8e8]/50 object-cover object-top filter brightness-110" alt="Pending Frame" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[#f0ece4]">Frame Image Ready to Assign</span>
                <span className="text-[10px] text-[#9a96a8]">Select an existing character below or create a new one.</span>
              </div>
            </div>
            <button 
              type="button"
              className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg bg-[#c9b8e8] text-[#1a1a2e] hover:bg-white transition-colors flex-shrink-0"
              onClick={() => {
                onAddCharacter({
                  name: 'Dynamic Character',
                  desc: 'New cast auto-tracked from frame.',
                  imageUrl: pendingCastImage.src
                });
                onConsumePendingImage?.();
              }}
            >
              Create New
            </button>
          </div>
        )}

        {/* Existing List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[300px] bg-[#1a1a2e]/20 border border-white/5 rounded-xl p-2">
          {cast.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#9a96a8]/50 italic">
              No cast characters initialized. Draft names manually below or play the game to expand automatic indexing.
            </div>
          ) : (
            cast.map((c: any, i: number) => (
              <div key={i} className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-3 flex gap-3 relative group">
                {/* Image Avatar & Selector */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <label className="relative w-14 h-14 rounded-xl border border-white/10 overflow-hidden bg-[#252538] flex items-center justify-center cursor-pointer hover:border-[#c9b8e8]/50 transition-all group/avatar">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users size={16} className="text-[#9a96a8]/40" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Pick<br />Pic</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const resizedDataUrl = await resizeImageToDataUrl(file);
                          onUpdateCharacterImage(i, resizedDataUrl);
                        }
                      }}
                    />
                  </label>
                  {c.imageUrl && (
                    <button
                      onClick={() => onUpdateCharacterImage(i, '')}
                      className="text-[9px] text-[#c47a8a] bg-red-950/25 hover:bg-red-950/50 p-0.5 px-1.5 rounded transition-colors"
                      title="Clear image"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Info Right */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#c9b8e8]">
                    <span className="truncate">{c.name}</span>
                    <button
                      onClick={() => onDeleteCharacter(i)}
                      className="p-1 rounded text-[#9a96a8] hover:text-[#c47a8a] bg-white/5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove from cast"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <textarea
                    value={c.desc}
                    onChange={(e) => onUpdateCharacterDesc(i, e.target.value)}
                    placeholder="Describe details (sex, age, eye color, features, style...)"
                    className="w-full bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-xs text-[#f0ece4] outline-none resize-none h-14 focus:border-[#c9b8e8]"
                  />
                  <div className="flex items-center gap-2 mt-0.5">
                    <HelpMeWriteAction
                      contextType="character"
                      existingValue={c.desc}
                      extraContext={c.name}
                      onHelpWriteField={onHelpWriteField}
                      onApply={(val: string) => onUpdateCharacterDesc(i, val)}
                    />
                    {pendingCastImage ? (
                       <button
                         onClick={() => {
                           onUpdateCharacterImage(i, pendingCastImage.src);
                           onConsumePendingImage?.();
                         }}
                         className="flex-1 bg-[#c9b8e8]/20 hover:bg-[#c9b8e8]/30 hover:text-white border outline-none border-[#c9b8e8]/50 rounded p-1 px-2 text-[10px] font-medium text-[#c9b8e8] transition-colors cursor-pointer"
                       >
                         Assign Image
                       </button>
                    ) : (
                      <input
                        type="text"
                        placeholder="Paste Image URL..."
                        value={c.imageUrl || ''}
                        onChange={(e) => onUpdateCharacterImage(i, e.target.value)}
                        className="flex-1 bg-[#1a1a2e] border border-white/5 rounded p-1 px-2 text-[10px] text-[#9a96a8] placeholder-[#9a96a8]/30 outline-none focus:border-[#c9b8e8]"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Container */}
        <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-[#c9b8e8] tracking-widest">Add Character Manually</span>
          <div className="flex gap-3 items-start">
            <div className="flex flex-col items-center gap-1">
              <label className="relative w-12 h-12 rounded-xl border border-dashed border-white/15 hover:border-[#c9b8e8]/50 overflow-hidden bg-[#252538] flex items-center justify-center cursor-pointer flex-shrink-0 transition-all group/newavatar">
                {newCharacterImage ? (
                  <img src={newCharacterImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[9px] text-[#9a96a8]/50 font-bold uppercase text-center leading-none">+ Pic</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const resizedDataUrl = await resizeImageToDataUrl(file);
                      setNewCharacterImage(resizedDataUrl);
                    }
                  }}
                />
              </label>
              {newCharacterImage && (
                <button
                  onClick={() => setNewCharacterImage('')}
                  className="text-[9px] text-[#c47a8a] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Maya)"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={newCharacterImage}
                onChange={(e) => setNewCharacterImage(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-[10px] text-[#9a96a8] outline-none focus:border-[#c9b8e8]"
              />
            </div>
          </div>

          <textarea
            placeholder="Brief profile note..."
            value={characterDesc}
            onChange={(e) => setCharacterDesc(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none resize-none h-12 focus:border-[#c9b8e8]"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-[#c9b8e8] hover:bg-[#c9b8e8]/90 text-[#1a1a2e] rounded-xl p-2.5 text-xs font-bold cursor-pointer"
          >
            + Register New Character
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// STORY SETUP MODAL
const StorySetupModal = ({ Overlay, onClose, currentSetup, onSaveSetup, onHelpWriteField }: any) => {
  const [setup, setSetup] = useState<StorySetup>({
    premise: currentSetup.premise || '',
    tone: currentSetup.tone || '',
    style: currentSetup.style || '',
    characters: currentSetup.characters || ''
  });

  const handleSave = () => {
    onSaveSetup(setup);
    onClose();
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <BookOpen size={20} /> Story Campaign Setup
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2 leading-relaxed">
          Configure rules, campaign styles, tone guides and starts. AI Chat models read these setup guides with every scenario beat.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
             <div className="flex items-center">
               <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Premise & Scene Motivations</label>
               <HelpMeWriteAction contextType="premise" existingValue={setup.premise} onHelpWriteField={onHelpWriteField} onApply={(val: string) => setSetup({ ...setup, premise: val })} />
             </div>
            <textarea
              placeholder="What core conflict, premise or situation anchors this story campaign?"
              value={setup.premise}
              onChange={(e) => setSetup({ ...setup, premise: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2.5 text-xs text-[#f0ece4] outline-none h-20 resize-none focus:border-[#c9b8e8]"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center">
              <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Aesthetic Style / Medium</label>
              <HelpMeWriteAction contextType="style" existingValue={setup.style} onHelpWriteField={onHelpWriteField} onApply={(val: string) => setSetup({ ...setup, style: val })} />
            </div>
            <input
              type="text"
              placeholder="e.g. Grainy 35mm photograph, moody volumetric shadows, Peter Lindberg black & white"
              value={setup.style}
              onChange={(e) => setSetup({ ...setup, style: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center">
              <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Tone</label>
              <HelpMeWriteAction contextType="tone" existingValue={setup.tone} onHelpWriteField={onHelpWriteField} onApply={(val: string) => setSetup({ ...setup, tone: val })} />
            </div>
            <input
              type="text"
              placeholder="e.g. Neo-Noir, cozy romance, high fantasy, historical suspense"
              value={setup.tone}
              onChange={(e) => setSetup({ ...setup, tone: e.target.value })}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#c9b8e8] text-[#1a1a2e] rounded-xl p-2.5 text-xs font-bold mt-2 cursor-pointer"
        >
          Save Configuration
        </button>
      </div>
    </Overlay>
  );
};

// SAVE / LOAD GAME CODES
const SaveLoadModal = ({ Overlay, onClose, onSerializeGame, onDeserializeGame }: any) => {
  const [code, setCode] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleMakeCode = async () => {
    const val = onSerializeGame();
    if (!val) {
      alert('Start a thread session before generating saves.');
      return;
    }
    setCode(val);
    const filename = `zaor_game_backup_${new Date().toISOString().slice(0,10)}.txt`;
    
    try {
      const file = new File([val], filename, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Game State Backup',
        });
      } else if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Text File',
            accept: { 'text/plain': ['.txt'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(val);
        await writable.close();
      } else {
        const blob = new Blob([val], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Save failed:', e);
      }
      return;
    }

    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleLoadCode = () => {
    if (!code.trim()) return alert('Paste a valid game code payload first.');
    try {
      onDeserializeGame(code.trim());
      onClose();
    } catch (e: any) {
      alert('Load failure: ' + e.message);
    }
  };

  const handleLoadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const val = re.target?.result as string;
        if (val) {
          setCode(val);
          try {
            onDeserializeGame(val.trim());
            onClose();
          } catch (err: any) {
             alert('Load failure: ' + err.message);
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Save size={20} /> Backup Game State
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2 leading-relaxed">
          Serializes story chat histories, setups, parameters, and characters into a portable Base64 key. (Excludes generated image binary logs).
        </p>

        <button
          onClick={handleMakeCode}
          className={`w-full border rounded-xl p-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            copyFeedback 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-[#c9b8e8]/10 hover:bg-[#c9b8e8]/20 border-[#c9b8e8]/30 text-[#c9b8e8]'
          }`}
        >
          {copyFeedback ? <Check size={14} /> : <Save size={14} />} {copyFeedback ? 'Saved Game State to File' : 'Save Game State to File'}
        </button>

        <textarea
          placeholder="A serialized backup block will output here when saved, or paste a previously saved payload here to load instantly."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2.5 text-[10px] text-[#f0ece4] font-mono outline-none h-28 focus:border-[#c9b8e8]"
        />

        <div className="flex gap-2.5">
          <button
            onClick={handleLoadFromFile}
            className="flex-1 bg-[#2e2e48] text-[#f0ece4] rounded-xl p-2.5 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-[#2e2e48]/80 transition-colors"
          >
            <Upload size={14} /> Load File
          </button>
          <button
            onClick={handleLoadCode}
            className="flex-1 bg-[#c9b8e8] text-[#1a1a2e] flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold cursor-pointer hover:bg-[#c9b8e8]/90 transition-colors"
          >
            <Check size={14} /> Load Text
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// EXPORT TO DRAW THINGS MODAL (Advanced Scripting API)
const ExportDrawThingsModal = ({ Overlay, onClose, storyboardRatio, storyboardFrames, setup, cast, loras }: any) => {
  const [mode, setMode] = useState<'i2v' | 't2v' | 'i2i' | 't2i'>('t2i');
  const [model, setModel] = useState('Keep Current GUI Model');
  const [res, setRes] = useState('1024x1024');
  const [frames, setFrames] = useState(81);
  const [steps, setSteps] = useState(20);
  const [negativePrompt, setNegativePrompt] = useState('ugly, blurry, low res, unrealistic');
  const [scriptTxt, setScriptTxt] = useState('');

  const sizes = {
    '16:9': ['1280x720', '1024x576', '512x320'],
    '9:16': ['720x1280', '576x1024', '320x640'],
    '1:1': ['1024x1024', '768x768', '512x512'],
    '4:3': ['1024x768', '768x576'],
    '3:4': ['768x1024', '576x768']
  }[storyboardRatio as '16:9'] || ['1024x1024', '512x512'];

  useEffect(() => {
    if (sizes.length > 0) setRes(sizes[0]);
  }, [storyboardRatio]);

  const compileScript = async () => {
    if (!storyboardFrames || storyboardFrames.length === 0) {
      return alert('No storyboard frames inside this game to export.');
    }
    
    const dims = res.split('x');

    const escapeStr = (s: string) =>
      `"${String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim()}"`;

    const activeLoras = loras ? loras.filter((l: any) => l.active) : [];
    const loraDetails = activeLoras.map((l: any) => `${l.name} (${l.scale})`);
    const loraTriggers = activeLoras.map((l: any) => l.triggerWord).filter(Boolean).join(', ');
    
    // Master Styles
    const globalStyle = setup?.masterPrompt || '';
    
    const lines: string[] = [
      '//@api-1.0',
      `// ===== Zaor Director Script · ${mode} · ${storyboardFrames.length} clips =====`,
      '// NOTE: Run this directly inside Draw Things via the Scripts button.',
      ''
    ];

    lines.push('var shots = [];');
    storyboardFrames.forEach((f: any, i: number) => {
      let basePrompt = f.videoPrompt || f.alt || 'cinematic motion, smooth camera';
      
      let castStr = '';
      if (cast) {
        cast.forEach((c: any) => {
          if (basePrompt.toLowerCase().includes(c.name.toLowerCase())) {
             castStr += `, ${c.desc || c.keywords || ''}`;
          }
        });
      }

      let finalPrompt = `${loraTriggers ? loraTriggers + ', ' : ''}${basePrompt}${castStr}${globalStyle ? ', ' + globalStyle : ''}`;

      if (mode === 'i2v') {
        lines.push(`shots.push({ img: "shot_${String(i + 1).padStart(2, '0')}.png", prompt: ${escapeStr(finalPrompt)}, negative: ${escapeStr(negativePrompt)}, steps: ${steps} });`);
      } else {
        lines.push(`shots.push({ prompt: ${escapeStr(finalPrompt)}, negative: ${escapeStr(negativePrompt)}, steps: ${steps} });`);
      }
    });

    lines.push('');
    lines.push('// Known community models mapped for selection options:');
    lines.push('var modelsToPick = ["Keep Current Model", "Generic SDXL", "sd3-large-turbo-3.5", "flux-1-dev-exact", "wan-2.1-14b-t2v-fusionx", "ltx-2.3-22b-distilled-exact", "qwen-image-1.0-exact"];');
    lines.push('');
    lines.push('// Fire up the Draw Things native prompt user interface');
    lines.push('var uiConfig = requestFromUser("Zaor AI Director", "Confirm & Generate Batch", function() {');
    lines.push('  var elements = [');
    lines.push('    this.section("Cloud Compute Advisory", "Your Cloud Compute allowance is 40,000 units (15k free tier) per generation.", [');
    lines.push('      this.plainText("Each image costs approx $0.005 server-side. Larger resolutions and higher step counts drain allowance quickly."),');
    lines.push(`      this.plainText("Active LoRAs Required: ${loraDetails.length > 0 ? loraDetails.join(' | ') : 'None'}")`);
    lines.push('    ])');
    lines.push('  ];');
    lines.push('  for (var i = 0; i < shots.length; i++) {');
    lines.push('    var s = shots[i];');
    lines.push('    elements.push(');
    lines.push('      this.section("Frame " + (i + 1), s.prompt.substring(0, 40) + "...", [');
    lines.push('        this.menu(0, modelsToPick),');
    lines.push('        this.textField(s.prompt, "Prompt", true, 60),');
    lines.push('        this.textField(s.steps.toString(), "Steps", false, 20)');
    lines.push('      ])');
    lines.push('    );');
    lines.push('  }');
    lines.push('  return elements;');
    lines.push('});');
    lines.push('');
    lines.push('if (uiConfig) {');
    lines.push('  var cfgIdx = 0;');
    lines.push('  for (var i = 0; i < shots.length; i++) {');
    lines.push('    var selectedModelIdx = uiConfig[cfgIdx++];');
    lines.push('    var editedPrompt = uiConfig[cfgIdx++];');
    lines.push('    var selectedSteps = parseInt(uiConfig[cfgIdx++]) || shots[i].steps;');
    lines.push('    ');
    lines.push('    var runConfig = Object.assign({}, pipeline.configuration);');
    lines.push('    runConfig.negative_prompt = shots[i].negative;');
    lines.push('    runConfig.steps = selectedSteps;');
    lines.push('    if (selectedModelIdx > 0) {');
    lines.push('        // Try to dynamically inject desired model override per frame');
    lines.push('        runConfig.model = modelsToPick[selectedModelIdx];');
    lines.push('        runConfig.model_id = modelsToPick[selectedModelIdx];');
    lines.push('    }');
    lines.push('    ');
    lines.push('    // If Image to Video mode, load src mask/image onto canvas');
    lines.push('    if (shots[i].img) {');
    lines.push('      console.log("Loading source frame: " + shots[i].img);');
    lines.push('      canvas.loadImageSrc(filesystem.pictures.path + "/" + shots[i].img);');
    lines.push('    }');
    lines.push('    ');
    lines.push('    console.log("Generating Scene " + (i+1) + " / " + shots.length + " (Override Model: " + modelsToPick[selectedModelIdx] + ")");');
    lines.push('    pipeline.run({ configuration: runConfig, prompt: editedPrompt });');
    lines.push('  }');
    lines.push('  console.log("Zaor Batch complete!");');
    lines.push('}');

    const fullScript = lines.join('\n');
    setScriptTxt(fullScript);
    
    const filename = `zaor_drawthings_script_${new Date().toISOString().slice(0,10)}.js`;
    try {
      const file = new File([fullScript], filename, { type: 'text/javascript' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Draw Things Script',
        });
      } else if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JavaScript File',
            accept: { 'text/javascript': ['.js'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(fullScript);
        await writable.close();
      } else {
        const blob = new Blob([fullScript], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Save failed:', e);
      }
    }
  };

  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4 max-h-[88vh] overflow-y-auto pr-1 select-none w-full max-w-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-xl text-[#c9b8e8] flex items-center gap-2">
            <Cpu size={20} /> Draw Things Batch Director
          </h2>
          <button onClick={onClose} className="text-[#9a96a8] hover:text-[#c47a8a] cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#9a96a8] -mt-2 leading-relaxed">
          This will generate a JavaScript macro for Draw Things. When run inside Draw Things, it will pop up an interactive UI allowing you to set parameters and switch models (via Cloud Compute or local) <strong className="text-white">frame-by-frame</strong>.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Sequence Mode</label>
            <select
              value={mode}
              onChange={(e: any) => setMode(e.target.value)}
              className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-[#9a96a8] outline-none"
            >
              <option value="t2i">Text to Image (T2I)</option>
              <option value="t2v">Prose Video (T2V)</option>
              <option value="i2v">Animate Frame images (I2V)</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Primary Model Preset</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-[#9a96a8] outline-none"
            >
              <option value="Keep Current GUI Model">Keep Current GUI Model</option>
              <option value="sd3-large-turbo-3.5">SD3 Large Turbo</option>
              <option value="wan-2.1-14b-t2v-fusionx">Wan v2.1 14B</option>
              <option value="ltx-2.3-22b-distilled-exact">LTX-2.3 Distilled</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 mt-1">
          <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Master Negative Prompt</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-xs text-[#9a96a8] outline-none h-16 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-1">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Target Resolution</label>
            <select
              value={res}
              onChange={(e) => setRes(e.target.value)}
              className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-[#f0ece4] outline-none font-mono"
            >
              {sizes.map(s => (
                <option key={s} value={s}>{s.replace('x', ' × ')}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] uppercase font-bold text-[#9a96a8] tracking-wider">Default Steps per shot</label>
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value) || 20)}
              className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2 text-[#f0ece4] outline-none text-center"
            />
          </div>
        </div>

        <button
          onClick={compileScript}
          className="w-full bg-[#c9b8e8] text-[#1a1a2e] hover:bg-[#c9b8e8]/90 rounded-xl p-2.5 text-xs font-bold cursor-pointer transition-colors mt-2"
        >
          <Save size={14} className="inline mr-1 -mt-0.5" /> Compile DT Interactive Script
        </button>

        {scriptTxt && (
          <textarea
            readOnly
            value={scriptTxt}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2.5 text-[9px] text-[#f0ece4] font-mono h-24 outline-none resize-none mt-2"
          />
        )}
      </div>
    </Overlay>
  );
};

// RENAME THREAD MODAL
const RenameModal = ({ Overlay, onClose, renameId, initialName, onSaveRename }: any) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && renameId) {
      onSaveRename(name.trim());
      onClose();
    }
  };

  return (
    <Overlay>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <h2 className="font-serif font-semibold text-lg text-[#c9b8e8]">Rename Creative Thread</h2>
        <p className="text-xs text-[#9a96a8] -mt-2">Provide a new identity name for this game segment.</p>

        <input
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Name..."
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg p-2 text-xs text-[#f0ece4] outline-none focus:border-[#c9b8e8]"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#2e2e48] text-[#9a96a8] rounded-xl p-2 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#c9b8e8] text-[#1a1a2e] rounded-xl p-2 text-xs font-bold cursor-pointer"
          >
            Rename Thread
          </button>
        </div>
      </form>
    </Overlay>
  );
};

// DELETE THREAD CONFIRM MODAL
const DeleteModal = ({ Overlay, onClose, deleteId, deleteName, onConfirmDelete }: any) => {
  return (
    <Overlay>
      <div className="p-5 flex flex-col gap-4">
        <h2 className="font-serif font-semibold text-lg text-[#c47a8a] flex items-center gap-1.5">
          <ShieldAlert size={18} /> Permanently Remove Thread?
        </h2>
        <p className="text-xs text-[#9a96a8] -mt-1 leading-relaxed">
          This actions deletes all logs, story entries, and messages inside "<b>{deleteName}</b>". There is no undo.
        </p>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2e2e48] text-[#9a96a8] rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (deleteId) {
                onConfirmDelete();
                onClose();
              }
            }}
            className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/30 text-red-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer transition-colors"
          >
            Delete Thread
          </button>
        </div>
      </div>
    </Overlay>
  );
};
