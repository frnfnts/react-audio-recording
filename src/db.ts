// db.ts
import Dexie, { type EntityTable } from 'dexie';

interface RecordingBlob {
  id: string;
  seq: number
  blob: Blob;
  createdAt: Date;
}

const db = new Dexie('AutoSaveBlobDB') as Dexie & {
  autoSaveBlob: EntityTable<
    RecordingBlob,
    'id'
  >;
};

db.version(1).stores({
  autoSaveBlob: '[id+seq], blob, createdAt',
});

export type { RecordingBlob };
export { db };
