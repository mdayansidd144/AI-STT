import { useState, useRef } from "react"
import axios from "axios"
import Waveform from "./components/Waveform"

import {
Mic,
Square,
Trash2,
Download,
RefreshCw,
Languages,
Copy
} from "lucide-react"

const API = "http://localhost:5000"

export default function App(){

const [file,setFile] = useState(null)
const [text,setText] = useState("")
const [translated,setTranslated] = useState("")
const [history,setHistory] = useState([])
const [loading,setLoading] = useState(false)

const [recording,setRecording] = useState(false)
const [progress,setProgress] = useState(0)

const recorderRef = useRef(null)
const chunksRef = useRef([])

async function upload(){

if(!file){
alert("Choose audio file")
return
}

setLoading(true)

const fd = new FormData()
fd.append("file",file)

try{

const res = await axios.post(`${API}/api/transcribe`,fd)

setText(res.data.original_text)

}catch{

alert("Upload failed")

}

setLoading(false)

}


async function translateText(){

if(!text){
alert("No transcription")
return
}

try{

const res = await axios.post(`${API}/api/translate`,{
text:text,
target:"en"
})

setTranslated(res.data.translated)

}catch{

alert("Translation failed")

}

}


async function downloadPDF(){

if(!text){
alert("No transcription")
return
}

try{

const res = await axios.post(
`${API}/api/download_pdf`,
{text,translated},
{responseType:"blob"}
)

const url = window.URL.createObjectURL(new Blob([res.data]))

const a = document.createElement("a")
a.href = url
a.download = "transcription.pdf"
a.click()

}catch{

alert("PDF generation failed")

}

}


function copyText(){

navigator.clipboard.writeText(text)

alert("Copied")

}


async function refreshHistory(){

const res = await axios.get(`${API}/api/transcriptions`)

setHistory(res.data)

}


async function clearHistory(){

if(!window.confirm("Delete history?")) return

await axios.delete(`${API}/api/clear_transcriptions`)

setHistory([])

}


function startProgressBar(){

setProgress(0)

const interval = setInterval(()=>{

setProgress(prev=>{

if(prev >= 90){
clearInterval(interval)
return prev
}

return prev + 12

})

},100)

}


async function startRecording(){

const stream = await navigator.mediaDevices.getUserMedia({audio:true})

const recorder = new MediaRecorder(stream)

recorderRef.current = recorder
chunksRef.current = []

recorder.ondataavailable = e=>{
chunksRef.current.push(e.data)
}

recorder.onstop = async ()=>{

const blob = new Blob(chunksRef.current,{type:"audio/webm"})

const fd = new FormData()
fd.append("file",blob,"recording.webm")

setProgress(15)

try{

const res = await axios.post(`${API}/api/transcribe`,fd)

setText(res.data.original_text)

setProgress(100)

}catch{

alert("Transcription failed")

setProgress(0)

}

setTimeout(()=>{
setProgress(0)
},500)

}

recorder.start()

setRecording(true)

startProgressBar()

}


function stopRecording(){

if(recorderRef.current){

recorderRef.current.stop()

setRecording(false)

}

}


return(

<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">

<header className="flex justify-between items-center px-10 py-5 border-b border-slate-800">

<h1 className="text-2xl font-bold text-indigo-400">
AI • STT
</h1>

</header>


<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-10">


<div className="bg-slate-900/70 p-7 rounded-xl border border-slate-700 shadow-lg">

<h2 className="text-xl font-semibold mb-4">
Upload Audio
</h2>

<input
type="file"
accept="audio/*"
onChange={(e)=>setFile(e.target.files[0])}
/>

{file && <Waveform audio={file}/>}


<div className="flex flex-wrap gap-3 mt-6">

<button
onClick={upload}
className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg"
>

{loading ? "Processing..." : "Upload & Transcribe"}

</button>


<button
onClick={translateText}
className="flex items-center gap-2 border border-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white"
>

<Languages size={16}/>
Translate

</button>


<button
onClick={downloadPDF}
className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800"
>

<Download size={16}/>
PDF

</button>


<button
onClick={copyText}
className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-slate-800"
>

<Copy size={16}/>
Copy

</button>


<button
onClick={refreshHistory}
className="flex items-center gap-2 border border-green-500 text-green-400 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
>

<RefreshCw size={16}/>
Refresh

</button>


<button
onClick={clearHistory}
className="flex items-center gap-2 border border-red-600 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
>

<Trash2 size={16}/>
Delete

</button>

</div>


<div className="flex gap-3 mt-6">

<button
onClick={startRecording}
disabled={recording}
className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-400 disabled:opacity-50"
>

<Mic size={16}/>
Start Recording

</button>


<button
onClick={stopRecording}
disabled={!recording}
className="flex items-center gap-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50"
>

<Square size={16}/>
Stop

</button>

</div>


{recording && (
<div className="mt-2 text-red-400 animate-pulse">
Recording...
</div>
)}


{progress > 0 && (

<div className="mt-4 w-full bg-slate-700 rounded-full h-3 overflow-hidden">

<div
className="bg-green-500 h-3 rounded-full transition-all duration-200 ease-out"
style={{width:`${progress}%`}}
></div>

</div>

)}


<div className="mt-8">

<h3 className="font-semibold mb-2">
Transcription
</h3>

<div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-40 overflow-y-auto">

{text}

</div>

</div>


<div className="mt-6">

<h3 className="font-semibold mb-2">
Translation
</h3>

<div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-40 overflow-y-auto">

{translated}

</div>

</div>


</div>


<div className="bg-slate-900/70 p-7 rounded-xl border border-slate-700 shadow-lg">

<h3 className="text-lg font-semibold mb-4">
History
</h3>

{history.length===0 && (
<div className="text-gray-400">
No history
</div>
)}

{history.map(h=>(
<div
key={h.id}
className="border border-slate-700 p-3 rounded mb-2"
>

<h4 className="text-sm text-gray-400">
{h.filename}
</h4>

<p className="text-sm">
{h.text?.slice(0,100)}
</p>

</div>
))}

</div>


</div>

</div>

)
}