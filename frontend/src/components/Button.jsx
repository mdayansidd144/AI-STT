export default function Button({children,onClick,type="primary"}){
const styles={
primary:"bg-indigo-600 hover:bg-indigo-500 text-white",
secondary:"border border-slate-600 hover:bg-slate-800",
danger:"border border-red-600 text-red-400 hover:bg-red-600 hover:text-white",
success:"border border-green-500 text-green-400 hover:bg-green-600 hover:text-white"
}
return(

<button
onClick={onClick}
className={`px-4 py-2 rounded-lg transition ${styles[type]}`}
>
{children}
</button>

)

}