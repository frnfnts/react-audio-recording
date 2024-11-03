import { useRef, useCallback } from 'react'
import { db } from './db'
import RecordRTC from 'recordrtc'

type props = {
  timeSlice: number,
  key: string
}

export const useAutoSave = ({ timeSlice, key }: props) => {
  const autoSaveIntervalRef = useRef<number | null>(null)
  const blobCountRef = useRef<number>(0)

  const startAutoSave = useCallback(async (recorder: RecordRTC.RecordRTCPromisesHandler) => {
    autoSaveIntervalRef.current = setInterval(async () => {
      await autoSave(recorder)
    }, timeSlice)
  }, [])

  const stopAutoSave = useCallback(() => {
    autoSaveIntervalRef.current && clearInterval(autoSaveIntervalRef.current);
  }, [])


  const autoSave = useCallback(async (recorder: RecordRTC.RecordRTCPromisesHandler) => {
    if (!recorder) {
      return
    }
    const internalRecorder: RecordRTC.MediaStreamRecorder = await recorder.getInternalRecorder()
    const blobs = await internalRecorder.getArrayOfBlobs()
    await db.autoSaveBlob.bulkPut(blobs.slice(blobCountRef.current, blobs.length).map((blob: Blob) => {
      return {
        id: key,
        seq: blobCountRef.current++,
        blob: blob,
        createdAt: new Date()
      }
    }))
  }, [])

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

  return { startAutoSave, stopAutoSave, loadAutoSave, clearAutoSave }
}
