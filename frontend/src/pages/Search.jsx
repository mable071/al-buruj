import { useState, useEffect } from "react";
import { api } from "../api/client.js";

export default function Search(){ 
	const [q,setQ]=useState(""); 
	const [items,setItems]=useState([]);
	const [loading, setLoading] = useState(false);
	
	useEffect(()=>{ 
		const id=setTimeout(()=>{
			if (q.trim()) {
				setLoading(true);
				api(`/api/products/search?q=${encodeURIComponent(q)}`)
					.then(setItems)
					.catch(() => setItems([]))
					.finally(() => setLoading(false));
			} else {
				setItems([]);
			}
		}, 250); 
		return ()=>clearTimeout(id); 
	},[q]); 
	
	return (
		<div className="space-y-3">
			<input 
				className="px-3 py-2 rounded-lg bg-white/10 w-full" 
				placeholder="Search by name/unit" 
				value={q} 
				onChange={e=>setQ(e.target.value)}
			/> 
			<div className="overflow-auto">
				{loading ? (
					<div className="text-center py-4 opacity-70">Searching...</div>
				) : (
					<table className="w-full text-sm">
						<thead className="opacity-70">
							<tr>
								<th className="text-left py-2">Name</th>
								<th className="text-left">Unit</th>
								<th className="text-left">Qty</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (
								<tr><td className="py-4 opacity-70 text-center" colSpan={3}>
									{q.trim() ? "No results found" : "Start typing to search..."}
								</td></tr>
							) : items.map(x=>(
								<tr key={x.product_id} className="border-t border-white/10">
									<td className="py-2">{x.product_name}</td>
									<td>{x.unit||"-"}</td>
									<td>{x.quantity}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	); 
}


