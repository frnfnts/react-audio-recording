import { useState, useRef, useEffect } from 'react'
import './App.css'
import RecordRTC from 'recordrtc'

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const deviceRef = useRef<HTMLSelectElement>(null)
  const recorderRef = useRef<RecordRTC.RecordRTCPromisesHandler | null>(null)
  const blobRef = useRef<Blob | null>(null)

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
      mimeType: 'audio/wav',
      disableLogs: true
    });
    recorderRef.current.startRecording();
  }

  const stopRecording = async () => {
    if (!recorderRef.current) {
      return
    }
    await recorderRef.current.stopRecording();
    blobRef.current = await recorderRef.current.getBlob();
    recorderRef.current.destroy();
  }

  const saveRecording = async () => {
    if (!blobRef.current) {
      return
    }
    RecordRTC.invokeSaveAsDialog(blobRef.current, 'audio.wav')
  }

  return <div className="App">
    <h1>Devices</h1>
    <select ref={deviceRef}>
      {devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
    </select>

    <h1>Audio Recording</h1>
    <header className="App-header">
      <button onClick={loadDevices}>Load Devices</button>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={saveRecording}>Save Recording</button>
    </header>
  </div>
}

export default App
