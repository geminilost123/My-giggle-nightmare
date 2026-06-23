import { get, set, del } from 'idb-keyval';
import type { Thread, Message } from './types';

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};

export const saveThreadsIDB = async (threads: Thread[]) => {
  const storageThreads = threads.map(t => ({
    ...t,
    messages: t.messages.map(m => {
      let storageM = { ...m };
      if (storageM.src && storageM.src.startsWith('data:')) {
        const matches = storageM.src.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,(.*)$/);
        if (matches && matches.length === 3) {
          try {
            storageM.blob = b64toBlob(matches[2], matches[1]);
            delete storageM.src;
          } catch(e) {
            console.error('Failed to convert base64 to blob', e);
          }
        }
      } else if (storageM.src && storageM.src.startsWith('blob:')) {
        // Just strip the temporary blob URL from storage
        delete storageM.src;
      }
      return storageM;
    })
  }));
  await set('gs_threads', storageThreads);
};

export const loadThreadsIDB = async (): Promise<Thread[] | null> => {
  let stored = await get<Thread[]>('gs_threads');
  if (!stored) {
    const legacy = localStorage.getItem('gs_threads');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as Thread[];
        await saveThreadsIDB(parsed);
        stored = await get<Thread[]>('gs_threads');
      } catch (e) {
        console.error('Legacy migration failed', e);
      }
    }
  }

  if (!stored) return null;

  return stored.map(t => ({
    ...t,
    messages: t.messages.map(m => {
      let memM = { ...m };
      if (memM.blob instanceof Blob) {
        memM.src = URL.createObjectURL(memM.blob);
      }
      return memM;
    })
  }));
};

export const clearThreadsIDB = async () => {
  await del('gs_threads');
  localStorage.removeItem('gs_threads');
};
