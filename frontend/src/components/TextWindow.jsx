export default function TextWindow({title,text}){

return(

<div className="mt-6">

<h3 className="font-semibold mb-2">
{title}
</h3>

<div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-40 overflow-y-auto">

<p className="text-gray-200 leading-relaxed">

{text || "No content yet"}

</p>

</div>

</div>

)

}