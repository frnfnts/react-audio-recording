import { useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import RecordRTC from 'recordrtc'
import { useAutoSave } from './useAutoSave'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

const STATUS = {
  WAITING: 'waiting to record',
  RECORDING: 'recording',
  RECOREDED: 'recorded',
}

const FILE_FORMATS = ["wav", "webm"]
const TIME_SLICE = 3000

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [status, setStatus] = useState<string>(STATUS.WAITING)
  const deviceRef = useRef<HTMLSelectElement>(null)
  const recorderRef = useRef<RecordRTC.RecordRTCPromisesHandler | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const fileFormatRef = useRef<HTMLSelectElement>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const [time, setTime] = useState(0);
  const intervalRef = useRef<number | null>(null)
  const {ondataavailable, loadAutoSave, clearAutoSave} = useAutoSave({ key: "autosave" })

  // wave lock を使って画面がスリープしないようにする
  const requestWakeLock = useCallback(async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch (err: any) {
      console.log(`${err.name}, ${err.message}`);
    }
  }, [])

  useEffect(() => {
    (async () => {
      await requestWakeLock();
    })()
    // 他のアプリやタブにフォーカスが移ったときに wakelock が解除されるので、再度リクエストする
    document.addEventListener('visibilitychange', async () => {
      if (wakeLockRef.current?.released && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    });
  }, [])

  const loadDevices = async () => {
    await navigator.mediaDevices.getUserMedia({audio: true})
    const devices = (await navigator.mediaDevices.enumerateDevices())
    setDevices(devices.filter(device => device.kind === 'audioinput'))
  }

  const startRecording = useCallback(async () => {
    const deviceId = deviceRef.current?.value
    const stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: deviceId}}})
    recorderRef.current =
      new RecordRTC.RecordRTCPromisesHandler(stream, {
      type: 'audio',
      mimeType: `audio/${fileFormatRef.current?.value}` as "audio/wav" | "audio/webm",
      disableLogs: true,
      timeSlice: TIME_SLICE,
      ondataavailable,
    });
    recorderRef.current.startRecording();
    setStatus(STATUS.RECORDING)
    startTimeRef.current = performance.now()
    setTime(0);
    intervalRef.current = setInterval(() => {
      setTime(performance.now() - (startTimeRef?.current || 0))
    }, 100);
  }, [])

  const stopRecording = async () => {
    if (!recorderRef.current) {
      return
    }
    await recorderRef.current.stopRecording();
    RecordRTC.getSeekableBlob(await recorderRef.current.getBlob(), (blob) => {
      blobRef.current = blob;
      recorderRef.current?.destroy();
      setStatus(STATUS.RECOREDED)
    });
    intervalRef.current && clearInterval(intervalRef.current);
  }

  const saveRecording = async () => {
    if (!blobRef.current) {
      console.error('No recording to save')
      return
    }
    RecordRTC.invokeSaveAsDialog(blobRef.current, `audio.${fileFormatRef.current?.value}`)
  }

  const loadAutoSave_ = async () => {
    const recordingBlob = await loadAutoSave()
    if (!recordingBlob) {
      return
    }
    RecordRTC.getSeekableBlob(recordingBlob, (blob) => {
      blobRef.current = blob;
      setStatus(STATUS.RECOREDED)
    });
  }

  const formatTime = (time: number) => {
    let left = time
    const hours = Math.floor(left / 3600000)
    left -= hours * 3600000
    const minutes = Math.floor(left / 60000)
    left -= minutes * 60000
    const seconds = Math.floor(left / 1000)
    left -= seconds * 1000
    const decisecond = Math.floor(left / 100)
    return [hours, minutes, seconds, decisecond].filter(v => v !== null).join(':')
  }

  const autoSaves = useLiveQuery(() => db.autoSaveBlob.toArray(), [])

  return <div className="App">
    <h1>Devices</h1>
    <select ref={deviceRef}>
      {devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
    </select>

    <h1>File Format</h1>
    <select ref={fileFormatRef} disabled={status === STATUS.RECORDING}>
      {FILE_FORMATS.map(format => <option key={format} value={format}>{format}</option>)}
    </select>

    <h1>Audio Recording</h1>
    <header className="App-header">
      <button onClick={loadDevices}>Load Devices</button>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={saveRecording}>Save Recording</button>
      <button onClick={loadAutoSave_}>Load Auto Save</button>
      <button onClick={clearAutoSave}>Clear Auto Save</button>
    </header>
    <p>{status}</p>
    <p>{formatTime(time)}</p>
    <div>
      {autoSaves?.map((autoSave, i) => {
        return <p key={i}>{`Auto Save ${i}: ${autoSave.id} ${autoSave.seq}`}</p>
      })}
    </div>
  </div>
}

export default App
