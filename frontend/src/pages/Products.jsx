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
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	// Search state
	const [search, setSearch] = useState("");

	// Use the new data hook with auto-refresh
	const { data: items, loading, error, refresh } = useData("/api/products", { autoRefresh: true });
	
	// Mutation for adding products
	const addProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh();
			setCurrentPage(1); // Reset to first page
		}
	});
	
	// Mutation for updating products
	const updateProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh();
		}
	});
	
	// Mutation for deleting products
	const deleteProductMutation = useMutation("/api/products", {
		onSuccess: () => {
			refresh();
			setCurrentPage(1); // Reset to first page
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
			refresh();
		} catch (err) {
			alert("Failed to update: " + (err?.message||"Unknown error"));
		}
	}

	async function remove(id){
		if (!confirm("Delete this product? This cannot be undone.")) return;
		try {
			await api(`/api/products/${id}`, { method: "DELETE" });
			refresh();
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

	// Filter and sort data
	const filteredItems = (items || []).filter(item => {
		const q = search.toLowerCase();
		if (!q) return true;
		return (
			(item.product_name||"").toLowerCase().includes(q) ||
			(item.description||"").toLowerCase().includes(q) ||
			(item.unit||"").toLowerCase().includes(q)
		);
	});

	const sortedItems = [...filteredItems].sort((a,b)=>{
		const an = (a.product_name||"").toLowerCase();
		const bn = (b.product_name||"").toLowerCase();
		return sortByNameAsc ? an.localeCompare(bn) : bn.localeCompare(an);
	});

	// Pagination logic
	const totalItems = sortedItems.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 justify-between flex-wrap">
				<input 
					value={search} 
					onChange={e=>setSearch(e.target.value)} 
					placeholder="Search by name, unit or description" 
					className="px-3 py-2 rounded-lg bg-white/10 outline-none flex-1 min-w-[240px]" 
				/>
				<button onClick={()=>setShow(true)} className="btn btn-primary">Add Product</button>
			</div>

			{/* Results info and sort */}
			<div className="flex items-center justify-between">
				<div className="text-sm opacity-70">
					Products ({totalItems}) - Showing {totalItems > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)}` : '0'} results
				</div>
				<button onClick={()=>setSortByNameAsc(v=>!v)} className="btn text-xs">Sort by Name {sortByNameAsc?"A→Z":"Z→A"}</button>
			</div>

			{/* Responsive Container - Table on md+, Cards below md */}
			<div className="overflow-hidden">
				{/* Desktop Table (md and up) */}
				<div className="hidden lg:block overflow-auto">
					<table className="w-full text-sm border border-white/20 rounded-lg table-sm-borders table-xs wrap-cells table-fixed">
						<thead className="opacity-70">
							<tr>
								<th className="text-left py-2">ID</th>
								<th className="text-left">Name</th>
								<th className="text-left">Unit</th>
								<th className="text-left">Description</th>
								<th className="text-left">Quantity</th>
								<th className="text-left">Date Added</th>
								<th className="text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.length === 0 ? (
								<tr><td className="py-4 opacity-70" colSpan={7}>No products found.</td></tr>
							) : (
								currentItems.map(x=> (
									<tr key={x.product_id} className="border-t border-white/10">
										<td className="py-2">{x.product_id}</td>
										<td>{x.product_name}</td>
										<td>{x.unit||"-"}</td>
										<td className="max-w-[200px]" title={x.description||"-"}>{x.description||"-"}</td>
										<td className="font-semibold">{x.quantity}</td>
										<td>{new Date(x.date_added).toLocaleDateString()}</td>
										<td className="flex space-x-2 whitespace-nowrap">
											<button onClick={()=>openEdit(x)} className="btn bg-green-700 hover:bg-green-800 text-white px-2 py-1 text-xs">Edit</button>
											<button onClick={()=>remove(x.product_id)} className="btn bg-red-700 hover:bg-red-800 text-white px-2 py-1 text-xs">Delete</button>
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
						<div className="text-center py-8 opacity-70">No products found.</div>
					) : (
						currentItems.map(x => (
							<div key={x.product_id} className="bg-white/5 rounded-lg p-4 border border-white/10">
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="flex justify-between items-start">
										<span className="opacity-70">ID:</span>
										<span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">{x.product_id}</span>
									</div>
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
									<div className="flex justify-between">
										<span className="opacity-70">Added:</span>
										<span className="text-xs">{new Date(x.date_added).toLocaleDateString()}</span>
									</div>
									{(x.description && x.description.trim()) && (
										<div className="pt-2">
											<span className="opacity-70 block text-xs mb-1">Description:</span>
											<p className="text-xs bg-white/5 px-2 py-1 rounded">{x.description}</p>
										</div>
									)}
									<div className="flex gap-2 pt-2">
										<button onClick={()=>openEdit(x)} className="btn bg-green-700 hover:bg-green-800 text-white flex-1 text-xs py-1.5">Edit</button>
										<button onClick={()=>remove(x.product_id)} className="btn bg-red-700 hover:bg-red-800 text-white flex-1 text-xs py-1.5">Delete</button>
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

			{/* Modal */}
			{show && (
				<div className="fixed w-screen h-screen -top-4 left-0 backdrop-blur-md bg-black/50 flex items-center justify-center p-4 z-50">
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
				<div className="fixed w-screen h-screen -top-4 left-0 backdrop-blur-md bg-black/50 flex items-center justify-center p-4 z-50">
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
								<button disabled={updateProductMutation.loading} className="btn btn-primary">
									{updateProductMutation.loading ? "Saving..." : "Save"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}