import { useState } from "react";
import { useData, useMutation } from "../hooks/useData.js";
import { api } from "../api/client.js";

export default function ProductOut(){
	const [show,setShow]=useState(false);
	const [pid,setPid]=useState("");
	const [q,setQ]=useState(0);
	const [by,setBy]=useState("");
	const [purpose,setPurpose]=useState("");
	const [edit,setEdit]=useState(null);
	const [search, setSearch] = useState("");
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	// Use data hooks with auto-refresh
	const { data: products, loading: productsLoading } = useData("/api/products", { autoRefresh: true });
	const { data: outs, loading: outsLoading, refresh: refreshOuts } = useData("/api/out", { autoRefresh: true });
	
	// Mutations for product out operations
	const addOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			setShow(false); setPid(""); setQ(0); setBy(""); setPurpose("");
			refreshOuts();
			setCurrentPage(1); // Reset to first page
		}
	});
	
	const updateOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			setEdit(null);
			refreshOuts();
		}
	});
	
	const deleteOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			refreshOuts();
			setCurrentPage(1); // Reset to first page
		}
	});

    async function submit(e){
		e.preventDefault();
		if (!pid) return alert("Select a product");
        const qty = Number(q)||0; if (qty<=0) return alert("Enter a positive quantity");
        const seller = (by||"").trim(); if (!seller) return alert("Enter who sold it (name)");
		
		try{
            const payload = { product_id: Number(pid), quantity_out: qty, issued_by: seller };
            const comment = (purpose||"").trim();
            if (comment) payload.purpose = comment;
            await addOutMutation.mutate(payload);
		}catch(err){ alert(err?.message||"Failed"); }
	}

	function openEdit(item){ setEdit({ ...item }); }
    async function saveEdit(e){
		e.preventDefault();
		if (!edit) return;
		try{
            const payload = { quantity_out: Number(edit.quantity_out)||0, issued_by: (edit.issued_by||"").trim() };
            const c = (edit.purpose||"").trim();
            if (c) payload.purpose = c;
            await api(`/api/out/${edit.out_id}`, { method:"PUT", body: JSON.stringify(payload) });
			setEdit(null);
			refreshOuts();
		}catch(err){ alert(err?.message||"Failed"); }
	}
	
	async function remove(id){
		if(!confirm("Delete this record?")) return;
		try{ 
			await api(`/api/out/${id}`, { method:"DELETE" }); 
			refreshOuts();
		}
		catch(err){ alert(err?.message||"Failed"); }
	}

	// Filter data
	const filteredOuts = (outs || []).filter(o => {
		const q = search.toLowerCase();
		if (!q) return true;
		return (
			(o.product_name||"").toLowerCase().includes(q) ||
			(o.issued_by||"").toLowerCase().includes(q) ||
			(o.purpose||"").toLowerCase().includes(q)
		);
	});

	// Pagination logic
	const totalItems = filteredOuts.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = filteredOuts.slice(startIndex, startIndex + itemsPerPage);

	// Show loading state
	if (outsLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg opacity-70">Loading product out records...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 justify-between flex-wrap">
				<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by product, issued by or comment" className="px-3 py-2 rounded-lg bg-white/10 outline-none flex-1 min-w-[240px]" />
				<button onClick={()=>setShow(true)} className="btn btn-primary">Add Out</button>
			</div>

			{/* Results info */}
			<div className="text-sm opacity-70">
				Showing {totalItems > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}` : '0'} results
			</div>

			{/* Responsive Container - Table on md+, Cards below md */}
			<div className="overflow-hidden">
				{/* Desktop Table (md and up) */}
				<div className="hidden lg:block overflow-auto">
					<table className="w-full text-sm border border-white/20 rounded-lg table-sm-borders table-xs wrap-cells table-fixed">
						<thead className="opacity-70">
							<tr>
								<th className="text-left py-2">Product Name</th>
								<th className="text-left">Quantity Out</th>
								<th className="text-left">Date Out</th>
								<th className="text-left">Issued By</th>
								<th className="text-left">Comment</th>
								<th className="text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.length === 0 ? (
								<tr><td className="py-4 opacity-70" colSpan={6}>No product out records found.</td></tr>
							) : (
								currentItems.map(o => (
									<tr key={o.out_id} className="border-t border-white/10">
										<td className="py-2">{o.product_name}</td>
										<td>{o.quantity_out}</td>
										<td>{new Date(o.date_out).toLocaleString()}</td>
										<td>{o.issued_by||"-"}</td>
										<td className="max-w-[200px]" title={o.purpose||"-"}>{o.purpose||"-"}</td>
										<td className="flex space-x-2 whitespace-nowrap">
											<button onClick={()=>openEdit(o)} className="btn bg-green-700 hover:bg-green-800 text-white px-2 py-1 text-xs">Edit</button>
											<button onClick={()=>remove(o.out_id)} className="btn bg-red-700 hover:bg-red-800 text-white px-2 py-1 text-xs">Delete</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Mobile Cards (below md) */}
				<div className="lg:hidden space-y-3">
					{currentItems.length === 0 ? (
						<div className="text-center py-8 opacity-70">No product out records found.</div>
					) : (
						currentItems.map(o => (
							<div key={o.out_id} className="bg-white/5 rounded-lg p-4 border border-white/10">
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="flex justify-between">
										<span className="opacity-70">Product:</span>
										<span className="font-medium">{o.product_name}</span>
									</div>
									<div className="flex justify-between">
										<span className="opacity-70">Qty:</span>
										<span className="font-semibold">{o.quantity_out}</span>
									</div>
									<div className="flex justify-between">
										<span className="opacity-70">Issued By:</span>
										<span>{o.issued_by || "-"}</span>
									</div>
									<div className="flex justify-between">
										<span className="opacity-70">Date:</span>
										<span className="text-xs">{new Date(o.date_out).toLocaleDateString()}</span>
									</div>
									{(o.purpose && o.purpose.trim()) && (
										<div className="pt-2">
											<span className="opacity-70 block text-xs mb-1">Comment:</span>
											<p className="text-xs bg-white/5 px-2 py-1 rounded">{o.purpose}</p>
										</div>
									)}
									<div className="flex gap-2 pt-2">
										<button onClick={()=>openEdit(o)} className="btn bg-green-700 hover:bg-green-800 text-white flex-1 text-xs py-1.5">Edit</button>
										<button onClick={()=>remove(o.out_id)} className="btn bg-red-700 hover:bg-red-800 text-white flex-1 text-xs py-1.5">Delete</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
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

			{show && (
				<div className="fixed w-screen h-screen -top-4 left-0 backdrop-blur-md bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Sell Product</div>
						<form onSubmit={submit} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Product</label>
									<select className="w-full px-3 py-2 rounded-lg bg-white text-black" value={pid} onChange={e=>setPid(e.target.value)}>
										<option value="">Select product</option>
										{products?.map(p=> <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
									</select>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Quantity Out</label>
									<input type="number" className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Quantity" value={q} onChange={e=>setQ(e.target.value)} />
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Sold by</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Name" value={by} onChange={e=>setBy(e.target.value)} />
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Comment</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Optional" value={purpose} onChange={e=>setPurpose(e.target.value)} />
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button type="button" onClick={()=>setShow(false)} className="btn">Cancel</button>
								<button disabled={addOutMutation.loading} className="btn btn-primary">
									{addOutMutation.loading ? "Saving..." : "Add Out"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{edit && (
				<div className="fixed w-screen h-screen -top-4 left-0 backdrop-blur-md bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Edit Out Record</div>
						<form onSubmit={saveEdit} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs opacity-70 mb-1">Quantity Out</label>
									<input type="number" className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.quantity_out} onChange={e=>setEdit({...edit, quantity_out: e.target.value})} />
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Sold by</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.issued_by||""} onChange={e=>setEdit({...edit, issued_by: e.target.value})} />
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Comment</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.purpose||""} onChange={e=>setEdit({...edit, purpose: e.target.value})} />
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button type="button" onClick={()=>setEdit(null)} className="btn">Cancel</button>
								<button disabled={updateOutMutation.loading} className="btn btn-primary">
									{updateOutMutation.loading ? "Saving..." : "Save"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}