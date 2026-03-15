// import { useEffect, useRef, useState } from "react"
// import WaveSurfer from "wavesurfer.js"
// export default function Waveform({ audio }) {
// const containerRef = useRef(null)
// const wavesurferRef = useRef(null)
// const [playing,setPlaying] = useState(false)

// useEffect(()=>{

// if(!audio) return

// if(wavesurferRef.current){
// wavesurferRef.current.destroy()
// }

// wavesurferRef.current = WaveSurfer.create({

// container: containerRef.current,
// waveColor: "#6366f1",
// progressColor: "#22c55e",
// cursorColor: "#fff",
// height: 80,
// barWidth: 3,
// barGap: 2,
// responsive: true

// })

// wavesurferRef.current.load(URL.createObjectURL(audio))

// wavesurferRef.current.on("finish",()=>{
// setPlaying(false)
// })

// return ()=>{

// if(wavesurferRef.current){
// wavesurferRef.current.destroy()
// }

// }

// },[audio])


// function togglePlay(){

// if(!wavesurferRef.current) return

// wavesurferRef.current.playPause()

// setPlaying(!playing)

// }


// return(

// <div className="bg-slate-900 p-4 rounded-lg mt-4">

// <div ref={containerRef}></div>

// <button
// onClick={togglePlay}
// className="mt-3 bg-indigo-600 px-4 py-1 rounded hover:bg-indigo-500"
// >

// {playing ? "Pause" : "Play"}

// </button>

// </div>

// )

// }
import { useEffect, useRef } from "react"
import WaveSurfer from "wavesurfer.js"
export default function Waveform({audio}){
const ref=useRef(null)
const ws=useRef(null)

useEffect(()=>{

if(!audio) return

if(ws.current){
ws.current.destroy()
}

ws.current=WaveSurfer.create({

container:ref.current,
waveColor:"#6366f1",
progressColor:"#22c55e",
height:80,
barWidth:3,
responsive:true

})

ws.current.load(URL.createObjectURL(audio))

return ()=>{

if(ws.current){
ws.current.destroy()
}

}

},[audio])

return(

<div className="bg-slate-900 p-4 rounded-lg mt-4">
<div ref={ref}></div>
</div>

)

}