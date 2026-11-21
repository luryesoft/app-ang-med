const DB_NAME = 'app-ang-med-prefs';
const STORE_NAME = 'handles';
const PDF_FOLDER_KEY = 'pdfDirectory';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = work(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  }));
}

export async function savePdfDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await withStore('readwrite', (store) => store.put(handle, PDF_FOLDER_KEY));
}

export async function getPdfDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await withStore<FileSystemDirectoryHandle | undefined>('readonly', (store) => store.get(PDF_FOLDER_KEY));
  return handle ?? null;
}

export async function clearPdfDirectoryHandle(): Promise<void> {
  await withStore('readwrite', (store) => store.delete(PDF_FOLDER_KEY));
}

export async function ensureDirectoryWriteAccess(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const permissioned = handle as FileSystemDirectoryHandle & {
    queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
    requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  };
  if (typeof permissioned.queryPermission === 'function') {
    const current = await permissioned.queryPermission({ mode: 'readwrite' });
    if (current === 'granted') {
      return true;
    }
  }
  if (typeof permissioned.requestPermission === 'function') {
    return (await permissioned.requestPermission({ mode: 'readwrite' })) === 'granted';
  }
  return true;
}
