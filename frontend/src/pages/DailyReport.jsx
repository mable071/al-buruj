import { useRef, useState } from "react";
import { useData } from "../hooks/useData.js";

export default function DailyReport(){
	const ref=useRef(null);
	const [date,setDate]=useState(()=> new Date().toISOString().slice(0,10));
	
	const { data, loading, error, refresh } = useData(`/api/reports/daily?date=${date}`, {
		initialData: {movements:[],total_products_in:0,total_products_out:0}
	});
	
	function print(){ 
		const w=window.open("", "print"); 
		w.document.write(`<html><head><title>Daily Report ${date}</title><style>body{font-family:sans-serif} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:6px}</style></head><body>` + ref.current.innerHTML + `</body></html>`); 
		w.document.close(); 
		w.print(); 
		w.close(); 
	}
	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg opacity-70">Loading daily report...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-300 text-center py-8">
				Error loading report: {error}
				<button onClick={refresh} className="btn btn-primary ml-4">Retry</button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-2 items-center">
				<input type="date" className="px-3 py-2 rounded-lg bg-white/10" value={date} onChange={e=>setDate(e.target.value)} />
				<button className="btn btn-primary" onClick={print}>Print</button>
			</div>
			<div ref={ref}>
				<h2 className="text-lg font-semibold mb-2">Daily Report {date}</h2>
				<div className="grid sm:grid-cols-2 gap-4 mb-3">
					<div className="card p-3"><div>Total In</div><div className="text-2xl font-bold">{data.total_products_in}</div></div>
					<div className="card p-3"><div>Total Out</div><div className="text-2xl font-bold">{data.total_products_out}</div></div>
				</div>
				<div className="overflow-auto">
					<table className="w-full text-sm border border-white/20">
						<thead className="opacity-70"><tr><th className="text-left py-2 border-b border-white/20">Type</th><th className="text-left border-b border-white/20">Product</th><th className="text-left border-b border-white/20">Qty</th><th className="text-left border-b border-white/20">Time</th></tr></thead>
						<tbody>{data.movements?.length===0 ? (
							<tr><td className="py-4 opacity-70" colSpan={4}>No movements for this date.</td></tr>
						) : data.movements?.map((m,i)=>(<tr key={i} className="border-b border-white/10"><td className="py-2">{m.type}</td><td>{m.product_name}</td><td>{m.quantity}</td><td>{new Date(m.at).toLocaleString()}</td></tr>))}</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}


