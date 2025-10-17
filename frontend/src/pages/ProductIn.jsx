import { useState } from "react";
import { useData, useMutation } from "../hooks/useData.js";
import { api } from "../api/client.js";

export default function ProductIn(){
	const [show,setShow]=useState(false);
	const [pid,setPid]=useState("");
	const [q,setQ]=useState(0);
	const [by,setBy]=useState("admin");
	const [supplier,setSupplier]=useState("");
	const [comment,setComment]=useState("");
	const [edit,setEdit]=useState(null);
    const [search, setSearch] = useState("");

	// Use data hooks for products and product in records with auto-refresh
	const { data: products, loading: productsLoading } = useData("/api/products", { autoRefresh: true });
	const { data: ins, loading: insLoading, refresh: refreshIns } = useData("/api/in", { autoRefresh: true });
	
	// Mutation for adding product in
	const addInMutation = useMutation("/api/in", {
		onSuccess: () => {
			// Reset form and close modal
			setShow(false); setPid(""); setQ(0); setBy("admin"); setSupplier(""); setComment("");
			refreshIns(); // Refresh the ins list
		}
	});
	
	// Mutation for updating product in
	const updateInMutation = useMutation("/api/in", {
		onSuccess: () => {
			setEdit(null);
			refreshIns(); // Refresh the ins list
		}
	});
	
	// Mutation for deleting product in
	const deleteInMutation = useMutation("/api/in", {
		onSuccess: () => {
			refreshIns(); // Refresh the ins list
		}
	});

	async function submit(e){
		e.preventDefault();
		if (!pid) return alert("Select a product");
		const qty = Number(q)||0; if (qty<=0) return alert("Enter a positive quantity");
		
		try {
			const payload = { product_id: Number(pid), quantity_in: qty, received_by: by || "admin" };
			if (supplier.trim()) payload.supplier = supplier.trim();
			if (comment.trim()) payload.comment = comment.trim();
			
			await addInMutation.mutate(payload);
		} catch(err){
			alert(err?.message||"Failed");
		}
	}

	function openEdit(item){ setEdit({ ...item }); }
	
	async function saveEdit(e){
		e.preventDefault();
		if (!edit) return;
		try{
			const payload = {};
			const qty = Number(edit.QuantityIn);
			if (Number.isInteger(qty) && qty > 0) payload.quantity_in = qty;
			const supp = typeof edit.supplier === 'string' ? edit.supplier.trim() : '';
			if (supp) payload.supplier = supp; // include only non-empty string
			const comm = typeof edit.comment === 'string' ? edit.comment.trim() : '';
			if (comm) payload.comment = comm; // include only non-empty string
			
			await api(`/api/in/${edit.ProductInID}`, { method: "PUT", body: JSON.stringify(payload) });
			setEdit(null);
			refreshIns();
		}catch(err){ alert(err?.message||"Failed"); }
	}
	
	async function remove(id){
		if(!confirm("Delete this record?")) return;
		try{ 
			await api(`/api/in/${id}`, { method: "DELETE" });
			refreshIns();
		}
		catch(err){ alert(err?.message||"Failed"); }
	}

	// Show loading state
	if (insLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg opacity-70">Loading product in records...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 justify-between flex-wrap">
				<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by product, supplier or comment" className="px-3 py-2 rounded-lg bg-white/10 outline-none flex-1 min-w-[240px]" />
				<button onClick={()=>setShow(true)} className="btn btn-primary">Add In</button>
			</div>

			{/* Product In Records Table */}
			<div className="overflow-auto mt-2">
				<table className="w-full text-sm border border-white/20 rounded-lg sm:border-0 sm:rounded-none table-sm-borders table-xs wrap-cells table-fixed sm:table-auto">
					<thead className="opacity-70">
						<tr>
							<th className="text-left py-2">ProductInID</th>
							<th className="text-left">Product Name</th>
							<th className="text-left">Quantity In</th>
							<th className="text-left">Supplier</th>
							<th className="text-left">Date In</th>
							<th className="text-left">Comment</th>
							<th className="text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{ins?.length===0 ? (
							<tr><td className="py-4 opacity-70" colSpan={7}>No product in records.</td></tr>
						) : (ins || []).filter(i => {
							const q = search.toLowerCase();
							if (!q) return true;
							return (
								(i.product_name||"").toLowerCase().includes(q) ||
								(i.supplier||"").toLowerCase().includes(q) ||
								(i.comment||"").toLowerCase().includes(q)
							);
						}).map(i => (
							<tr key={i.ProductInID} className="border-t border-white/10">
								<td className="py-2">{i.ProductInID}</td>
								<td>{i.product_name}</td>
								<td>{i.QuantityIn}</td>
								<td>{i.supplier||"-"}</td>
								<td>{new Date(i.DateIn).toLocaleString()}</td>
								<td className="sm:max-w-[200px]" title={i.comment||"-"}>{i.comment||"-"}</td>
								<td className="grid grid-cols-1 gap-2 sm:flex sm:space-x-2 whitespace-normal sm:whitespace-nowrap">
									<button onClick={()=>openEdit(i)} className="btn bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">Edit</button>
									<button onClick={()=>remove(i.ProductInID)} className="btn bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto">Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Add Product In Modal */}
			{show && (
				<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Add Product In</div>
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
									<label className="block text-xs opacity-70 mb-1">Quantity In</label>
									<input type="number" min="1" className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Quantity" value={q} onChange={e=>setQ(e.target.value)}/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Received by</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Received by" value={by} onChange={e=>setBy(e.target.value)}/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Supplier</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Supplier name" value={supplier} onChange={e=>setSupplier(e.target.value)}/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Comment</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" placeholder="Optional comment" value={comment} onChange={e=>setComment(e.target.value)}/>
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button type="button" onClick={()=>setShow(false)} className="btn">Cancel</button>
								<button disabled={addInMutation.loading} className="btn btn-primary">
									{addInMutation.loading ? "Saving..." : "Add In"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Product In Modal */}
			{edit && (
				<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Edit Product In</div>
						<form onSubmit={saveEdit} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs opacity-70 mb-1">ProductInID</label>
									<input disabled value={edit.ProductInID} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Product</label>
									<input disabled value={edit.product_name} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Quantity In</label>
									<input type="number" min="1" className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.QuantityIn} onChange={e=>setEdit({...edit, QuantityIn: e.target.value})} />
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Supplier</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.supplier||""} onChange={e=>setEdit({...edit, supplier: e.target.value})} />
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Comment</label>
									<input className="w-full px-3 py-2 rounded-lg bg-white/10" value={edit.comment||""} onChange={e=>setEdit({...edit, comment: e.target.value})} />
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button type="button" onClick={()=>setEdit(null)} className="btn">Cancel</button>
								<button disabled={updateInMutation.loading} className="btn btn-primary">
									{updateInMutation.loading ? "Saving..." : "Save"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}


