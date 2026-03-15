import { Upload, Mic, FileText, RefreshCw, Trash2 } from "lucide-react"
import { useState } from "react"
import axios from "axios"
const API = "http://localhost:5000"
export default function UploadPanel(){

const [file,setFile] = useState(null)
const [text,setText] = useState("")
const [translated,setTranslated] = useState("")
const [loading,setLoading] = useState(false)

async function upload(){

if(!file) return alert("Upload an audio file")

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

return(

<div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-xl">

<h2 className="text-2xl font-bold text-indigo-400">
Transcribe • Translate
</h2>

<p className="text-gray-400 mt-2 mb-5">
Upload audio or record. Supports 20+ languages.
</p>

{/* LANGUAGE SELECT */}

<div className="flex gap-4 mb-4">

<div>

<label className="text-sm text-gray-400">
Transcription Language
</label>

<select className="mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">

<option>Auto Detect</option>
<option>English</option>
<option>Hindi</option>
<option>Spanish</option>

</select>

</div>

<div>

<label className="text-sm text-gray-400">
Translate To
</label>

<select className="mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">

<option>English</option>
<option>Hindi</option>
<option>Spanish</option>

</select>

</div>

</div>

{/* FILE INPUT */}

<label className="flex items-center gap-3 cursor-pointer bg-slate-800 px-4 py-3 rounded-lg border border-slate-700 hover:bg-slate-700">

<Upload size={18}/>

<span>{file ? file.name : "Choose Audio File"}</span>

<input
type="file"
accept="audio/*"
className="hidden"
onChange={(e)=>setFile(e.target.files[0])}
/>

</label>

{/* ACTION BUTTONS */}

<div className="flex flex-wrap gap-3 mt-4">

<button
onClick={upload}
className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg"
>

<Upload size={16}/>

{loading ? "Processing..." : "Upload & Transcribe"}

</button>

<button className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800">

<FileText size={16}/>
Download PDF

</button>

<button className="flex items-center gap-2 border border-red-600 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white">

<Trash2 size={16}/>
Clear

</button>

<button className="flex items-center gap-2 border border-green-500 text-green-400 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white">

<RefreshCw size={16}/>
Refresh

</button>

</div>

{/* RECORD BUTTON */}

<button className="flex items-center gap-2 mt-6 bg-red-500 hover:bg-red-400 px-5 py-2 rounded-xl">

<Mic size={18}/>
Start Recording

</button>

{/* TRANSCRIPTION */}

{text && (

<div className="mt-6">

<h3 className="font-semibold mb-2">
Transcription
</h3>

<div className="bg-slate-800 p-4 rounded-lg">
{text}
</div>

</div>

)}

</div>

)

}