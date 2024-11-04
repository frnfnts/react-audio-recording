import { useRef } from 'react'
import { db } from './db'

type props = {
  key: string
}

export const useAutoSave = ({ key }: props) => {
  const blobCountRef = useRef<number>(0)

  // timeSlice毎と録音終了時に呼ばれる
  const ondataavailable = async (blob: Blob) => {
    await db.autoSaveBlob.put({
      id: key,
      seq: blobCountRef.current++,
      blob: blob,
      createdAt: new Date()
    })
  }

  const loadAutoSave = async () => {
    const recordingBlobs = await db.autoSaveBlob.where('id').equals(key).toArray()
    if (!recordingBlobs || recordingBlobs.length === 0) {
      console.error('No autosave found')
      return
    }
    const blobs =  recordingBlobs.sort((a, b) => a.seq - b.seq).map((blob) => blob.blob)
    return new Blob(blobs, {type: blobs[0].type})
  }

  const clearAutoSave = async () => {
    await db.autoSaveBlob.where('id').equals(key).delete()
  }

  return { ondataavailable, loadAutoSave, clearAutoSave }
}
