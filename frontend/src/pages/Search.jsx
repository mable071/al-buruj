import { useState, useEffect } from "react";
import { api } from "../api/client.js";

export default function Search(){ 
	const [q,setQ]=useState(""); 
	const [items,setItems]=useState([]);
	const [loading, setLoading] = useState(false);
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	
	useEffect(()=>{ 
		const id=setTimeout(()=>{
			if (q.trim()) {
				setLoading(true);
				setCurrentPage(1); // Reset to first page on new search
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
	
	// Pagination logic
	const totalItems = items.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
	
	return (
		<div className="space-y-3">
			<input 
				className="px-3 py-2 rounded-lg bg-white/10 w-full" 
				placeholder="Search by name/unit" 
				value={q} 
				onChange={e=>setQ(e.target.value)}
			/> 
			
			{/* Results info */}
			{!loading && totalItems > 0 && (
				<div className="text-sm opacity-70">
					Showing {totalItems > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}` : '0'} results
				</div>
			)}
			
			{/* Responsive Container - Table on md+, Cards below md */}
			<div className="overflow-hidden">
				{/* Desktop Table (md and up) */}
				<div className="hidden md:block overflow-auto">
					<table className="w-full text-sm border border-white/20 rounded-lg table-sm-borders table-xs">
						<thead className="opacity-70">
							<tr>
								<th className="text-left py-2">Name</th>
								<th className="text-left">Unit</th>
								<th className="text-left">Qty</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td className="py-4 opacity-70 text-center" colSpan={3}>Searching...</td></tr>
							) : currentItems.length === 0 ? (
								<tr><td className="py-4 opacity-70 text-center" colSpan={3}>
									{q.trim() ? "No results found" : "Start typing to search..."}
								</td></tr>
							) : (
								currentItems.map(x=>(
									<tr key={x.product_id} className="border-t border-white/10">
										<td className="py-2">{x.product_name}</td>
										<td>{x.unit||"-"}</td>
										<td className="font-semibold text-green-400">{x.quantity}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Mobile Cards (below md) */}
				<div className="md:hidden space-y-3">
					{loading ? (
						<div className="text-center py-8 opacity-70">Searching...</div>
					) : currentItems.length === 0 ? (
						<div className="text-center py-8 opacity-70">
							{q.trim() ? "No results found" : "Start typing to search..."}
						</div>
					) : (
						currentItems.map(x => (
							<div key={x.product_id} className="bg-white/5 rounded-lg p-3 border border-white/10">
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="flex justify-between">
										<span className="opacity-70">Name:</span>
										<span className="font-semibold">{x.product_name}</span>
									</div>
									<div className="flex justify-between">
										<span className="opacity-70">Unit:</span>
										<span>{x.unit || "-"}</span>
									</div>
									<div className="flex justify-between">
										<span className="opacity-70">Qty:</span>
										<span className="font-bold text-green-400">{x.quantity}</span>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Pagination */}
			{!loading && totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-4">
					<button
						onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
						disabled={currentPage === 1}
						className="btn px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						‹ Previous
					</button>
					
					<div className="flex gap-1">
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
							<button
								key={page}
								onClick={() => setCurrentPage(page)}
								className={`btn px-3 py-1 text-sm ${
									currentPage === page
										? 'bg-blue-600 text-white'
										: 'bg-white/10 hover:bg-white/20'
								}`}
							>
								{page}
							</button>
						))}
					</div>
					
					<button
						onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
						disabled={currentPage === totalPages}
						className="btn px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next ›
					</button>
				</div>
			)}
		</div>
	); 
}