import { useState } from "react";
import { useData, useMutation } from "../hooks/useData.js";
import { api } from "../api/client.js";

export default function Products(){
	const [show,setShow]=useState(false);
	const [sortByNameAsc,setSortByNameAsc]=useState(true);
	// Form fields
	const [name,setName]=useState("");
	const [unit,setUnit]=useState("");
	const [quantity,setQuantity]=useState(0);
	const [desc,setDesc]=useState("");
	// Edit state
	const [edit,setEdit]=useState(null);

	// Use the new data hook with auto-refresh
	const { data: items, loading, error, refresh } = useData("/api/products", { autoRefresh: true });
	
	// Mutation for adding products
	const addProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh(); // Auto-refresh after successful add
		}
	});
	
	// Mutation for updating products
	const updateProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh(); // Auto-refresh after successful update
		}
	});
	
	// Mutation for deleting products
	const deleteProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh(); // Auto-refresh after successful delete
		}
	});

	async function addProduct(e){
		e.preventDefault();
		if (!name.trim()) return alert("Product name is required");
		
		try {
			const payload = { product_name: name.trim() };
			const u = unit.trim(); if (u) payload.unit = u;
			const d = desc.trim(); if (d) payload.description = d;
			
			const created = await addProductMutation.mutate(payload);
			
			// Add initial quantity if provided
			const qtyVal = Number(quantity)||0;
			if (qtyVal > 0) {
				try {
					await api("/api/in", { method:"POST", body: JSON.stringify({ product_id: created.product_id, quantity_in: qtyVal, received_by: "system" }) });
				} catch (err) {
					alert("Product added, but initial quantity failed: " + (err?.message||"Unknown error"));
				}
			}
			
			// Reset form and close modal
			setName(""); setUnit(""); setQuantity(0); setDesc(""); setShow(false);
		} catch (err) {
			alert("Failed to add product: " + (err?.message||"Unknown error"));
		}
	}

	function openEdit(item){
		setEdit({ ...item });
	}

	async function saveEdit(e){
		e.preventDefault();
		if (!edit) return;
		const payload = {};
		if (edit.product_name?.trim()) payload.product_name = edit.product_name.trim();
		payload.unit = (edit.unit||"").trim() || null;
		payload.description = (edit.description||"").trim() || null;
		
		try {
			await api(`/api/products/${edit.product_id}`, { method: "PUT", body: JSON.stringify(payload) });
			setEdit(null);
			refresh(); // Auto-refresh data
		} catch (err) {
			alert("Failed to update: " + (err?.message||"Unknown error"));
		}
	}

	async function remove(id){
		if (!confirm("Delete this product? This cannot be undone.")) return;
		try {
			await api(`/api/products/${id}`, { method: "DELETE" });
			refresh(); // Auto-refresh data
		} catch (err) {
			alert("Failed to delete: " + (err?.message||"Unknown error"));
		}
	}

	// Show loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg opacity-70">Loading products...</div>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="space-y-4">
				<div className="text-red-300 text-center py-8">
					Error loading products: {error}
					<button onClick={refresh} className="btn btn-primary ml-4">Retry</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<button onClick={()=>setShow(true)} className="btn btn-primary">Add Product</button>
			</div>

			{/* Table */}
			<div className="flex items-center justify-between">
				<div className="text-sm opacity-70">Products ({items?.length || 0})</div>
				<button onClick={()=>setSortByNameAsc(v=>!v)} className="btn">Sort by Name {sortByNameAsc?"A→Z":"Z→A"}</button>
			</div>
			<div className="overflow-auto mt-2">
				<table className="w-full text-xs sm:text-sm border border-white/20 rounded-lg sm:border-0 sm:rounded-none table-sm-borders table-xs wrap-cells table-fixed sm:table-auto">
					<thead className="opacity-70"><tr><th className="text-left py-2">ID</th><th className="text-left">Name</th><th className="text-left">Unit</th><th className="text-left">Description</th><th className="text-left">Quantity</th><th className="text-left">Date Added</th><th className="text-left">Actions</th></tr></thead>
					<tbody>{items?.length===0 ? (
						<tr><td className="py-4 opacity-70" colSpan={7}>No products yet.</td></tr>
					) : [...(items || [])].sort((a,b)=>{
						const an = (a.product_name||"").toLowerCase();
						const bn = (b.product_name||"").toLowerCase();
						return sortByNameAsc ? an.localeCompare(bn) : bn.localeCompare(an);
					}).map(x=> (
						<tr key={x.product_id} className="border-t border-white/10">
							<td className="py-2">{x.product_id}</td>
							<td>{x.product_name}</td>
							<td>{x.unit||"-"}</td>
							<td className="sm:max-w-[260px]" title={x.description||"-"}>{x.description||"-"}</td>
							<td>{x.quantity}</td>
							<td>{new Date(x.date_added).toLocaleString()}</td>
							<td className="grid grid-cols-1 gap-3 sm:flex sm:space-x-2 whitespace-normal sm:whitespace-nowrap">
								<button onClick={()=>openEdit(x)} className="btn bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">Edit</button>
								<button onClick={()=>remove(x.product_id)} className="btn bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto">Delete</button>
							</td>
						</tr>
					))}</tbody>
				</table>
			</div>

			{/* Modal */}
			{show && (
				<div className="fixed w-screen h-screen top-0 left-0 bg-black/90 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Add Product</div>
						<form onSubmit={addProduct} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs opacity-70 mb-1">Product ID</label>
									<input disabled value="Auto" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Unit</label>
									<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="pcs, kg, L" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Product name</label>
									<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Printer Paper A4" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Initial Quantity</label>
									<input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Description</label>
									<input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="optional" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button type="button" onClick={()=>setShow(false)} className="btn">Cancel</button>
								<button disabled={addProductMutation.loading} className="btn btn-primary">
									{addProductMutation.loading ? "Adding..." : "Add Product"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			{edit && (
				<div className="fixed w-screen h-screen top-0 left-0 bg-black/90 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-2xl bg-slate-800">
						<div className="text-lg font-semibold mb-4">Edit Product</div>
						<form onSubmit={saveEdit} className="space-y-3">
							<div className="grid sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs opacity-70 mb-1">Product ID</label>
									<input disabled value={edit.product_id} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div>
									<label className="block text-xs opacity-70 mb-1">Unit</label>
									<input value={edit.unit||""} onChange={e=>setEdit({...edit, unit: e.target.value})} placeholder="pcs, kg, L" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Product name</label>
									<input required value={edit.product_name} onChange={e=>setEdit({...edit, product_name: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs opacity-70 mb-1">Description</label>
									<input value={edit.description||""} onChange={e=>setEdit({...edit, description: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none"/>
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


