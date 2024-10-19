import { useState, useRef } from 'react'
import './App.css'
import RecordRTC from 'recordrtc'

const STATUS = {
  WAITING: 'waiting to record',
  RECORDING: 'recording',
  RECOREDED: 'recorded',
}

const FILE_FORMATS = ["wav", "webm"]

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [status, setStatus] = useState<string>(STATUS.WAITING)
  const deviceRef = useRef<HTMLSelectElement>(null)
  const recorderRef = useRef<RecordRTC.RecordRTCPromisesHandler | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const fileFormatRef = useRef<HTMLSelectElement>(null)

  const loadDevices = async () => {
    await navigator.mediaDevices.getUserMedia({audio: true})
    const devices = (await navigator.mediaDevices.enumerateDevices())
    setDevices(devices.filter(device => device.kind === 'audioinput'))
  }


  const startRecording = async () => {
    const deviceId = deviceRef.current?.value
    const stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: {exact: deviceId}}})
    recorderRef.current =
      new RecordRTC.RecordRTCPromisesHandler(stream, {
      type: 'audio',
      mimeType: `audio/${fileFormatRef.current?.value}` as "audio/wav" | "audio/webm",
      disableLogs: true
    });
    recorderRef.current.startRecording();
    setStatus(STATUS.RECORDING)
  }

  const stopRecording = async () => {
    if (!recorderRef.current) {
      return
    }
    await recorderRef.current.stopRecording();
    await RecordRTC.getSeekableBlob(await recorderRef.current.getBlob(), (blob) => {
      blobRef.current = blob;
      recorderRef.current?.destroy();
      setStatus(STATUS.RECOREDED)
    });
  }

  const saveRecording = async () => {
    if (!blobRef.current) {
      console.error('No recording to save')
      return
    }
    RecordRTC.invokeSaveAsDialog(blobRef.current, `audio.${fileFormatRef.current?.value}`)
  }

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
    </header>
    <p>{status}</p>
  </div>
}

export default App
