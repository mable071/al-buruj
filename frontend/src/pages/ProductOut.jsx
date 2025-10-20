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

	// Use data hooks with auto-refresh
	const { data: products, loading: productsLoading } = useData("/api/products", { autoRefresh: true });
	const { data: outs, loading: outsLoading, refresh: refreshOuts } = useData("/api/out", { autoRefresh: true });
	
	// Mutations for product out operations
	const addOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			setShow(false); setPid(""); setQ(0); setBy(""); setPurpose("");
			refreshOuts(); // Refresh the outs list
		}
	});
	
	const updateOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			setEdit(null);
			refreshOuts(); // Refresh the outs list
		}
	});
	
	const deleteOutMutation = useMutation("/api/out", {
		onSuccess: () => {
			refreshOuts(); // Refresh the outs list
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
            if (comment) payload.purpose = comment; // omit when empty (backend expects string, not null)
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
            if (c) payload.purpose = c; // omit when empty
            await api(`/api/out/${edit.out_id}`, { method:"PUT", body: JSON.stringify(payload) });
			setEdit(null);
			refreshOuts(); // Refresh the outs list
		}catch(err){ alert(err?.message||"Failed"); }
	}
	async function remove(id){
		if(!confirm("Delete this record?")) return;
		try{ 
			await api(`/api/out/${id}`, { method:"DELETE" }); 
			refreshOuts(); // Refresh the outs list
		}
		catch(err){ alert(err?.message||"Failed"); }
	}

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

			<div className="overflow-auto mt-2">
				<table className="w-full text-xs sm:text-sm border border-white/20 rounded-lg sm:border-0 sm:rounded-none table-sm-borders table-xs wrap-cells table-fixed sm:table-auto">
					<thead className="opacity-70"><tr><th className="text-left py-2">Product Name</th><th className="text-left">Quantity Out</th><th className="text-left">Date Out</th><th className="text-left">Issued By</th><th className="text-left">Comment</th><th className="text-left">Actions</th></tr></thead>
					<tbody>
						{outs?.length===0 ? (
							<tr><td className="py-4 opacity-70" colSpan={6}>No product out records.</td></tr>
						) : (outs || []).filter(o => {
						const q = search.toLowerCase();
						if (!q) return true;
						return (
							(o.product_name||"").toLowerCase().includes(q) ||
							(o.issued_by||"").toLowerCase().includes(q) ||
							(o.purpose||"").toLowerCase().includes(q)
						);
					}).map(o => (
						<tr key={o.out_id} className="border-t border-white/10">
								<td className="py-2">{o.product_name}</td>
								<td>{o.quantity_out}</td>
								<td>{new Date(o.date_out).toLocaleString()}</td>
								<td>{o.issued_by||"-"}</td>
								<td className="sm:max-w-[260px]" title={o.purpose||"-"}>{o.purpose||"-"}</td>
								<td className="grid grid-cols-1 gap-3 sm:flex sm:space-x-2 whitespace-normal sm:whitespace-nowrap">
									<button onClick={()=>openEdit(o)} className="btn bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">Edit</button>
									<button onClick={()=>remove(o.out_id)} className="btn bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto">Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{show && (
				<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Sell Product</div>
						<form onSubmit={submit} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Product</label>
									<select className="w-full px-3 py-2 rounded-lg bg-white text-black" value={pid} onChange={e=>setPid(e.target.value)}>
										<option value="">Select product</option>
										{products.map(p=> <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
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
				<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
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
								<button className="btn btn-primary">Save</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}


