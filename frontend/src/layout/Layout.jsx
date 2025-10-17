import { NavLink, Outlet } from "react-router-dom";
import { FiHome, FiPackage, FiArrowDownCircle, FiArrowUpCircle, FiSearch, FiFileText, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext.jsx";
import OnlineStatus from "../components/OnlineStatus.jsx";
import { useState } from "react";

export function Layout() {
	const { logout } = useAuth();
	const [open, setOpen] = useState(false);
	const nav = [
		{ to: "/dashboard", icon: <FiHome/>, label: "Dashboard" },
		{ to: "/products", icon: <FiPackage/>, label: "Products" },
		{ to: "/in", icon: <FiArrowDownCircle/>, label: "Product In" },
		{ to: "/out", icon: <FiArrowUpCircle/>, label: "Product Out" },
		{ to: "/search", icon: <FiSearch/>, label: "Search" },
		{ to: "/report", icon: <FiFileText/>, label: "Daily Report" },
	];
	return (
		<div className="min-h-screen grid md:grid-cols-[260px_1fr]">
			<aside className="hidden md:block p-4 card m-4 md:sticky md:top-4 md:h-[calc(100vh-2rem)]">
				<div className="text-lg font-semibold mb-6">Al-Buruj</div>
				<nav className="space-y-2">
					{nav.map(n => (
						<NavLink key={n.to} to={n.to} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive?'bg-white/20':'hover:bg-white/10'}`}>
							<span className="text-xl">{n.icon}</span><span>{n.label}</span>
						</NavLink>
					))}
				</nav>
			</aside>
			<main className="p-4 md:p-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<button onClick={()=>setOpen(true)} className="md:hidden btn bg-white/10 hover:bg-white/20"><FiMenu/></button>
						<div className="text-xl font-semibold">Al-Buruj Stock Management</div>
					</div>
					<button onClick={logout} className="btn btn-primary"><FiLogOut className="mr-2"/> Logout</button>
				</div>
				<div className="card p-4 md:p-6"><Outlet/></div>
			</main>
			{open && (
				<div className="fixed inset-0 z-50 md:hidden">
					<div className="absolute inset-0 bg-black/70" onClick={()=>setOpen(false)}></div>
					<div className="absolute left-0 top-0 h-full w-72 p-4 card m-0 rounded-none border-r border-white/10 bg-slate-800">
						<div className="flex items-center justify-between mb-4">
							<div className="text-lg font-semibold">Al-Buruj</div>
							<button onClick={()=>setOpen(false)} className="btn bg-white/10 hover:bg-white/20"><FiX/></button>
						</div>
						<nav className="space-y-2">
							{nav.map(n => (
								<NavLink key={n.to} to={n.to} onClick={()=>setOpen(false)} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive?'bg-white/20':'hover:bg-white/10'}`}>
									<span className="text-xl">{n.icon}</span><span>{n.label}</span>
								</NavLink>
							))}
						</nav>
					</div>
				</div>
			)}
			<OnlineStatus/>
		</div>
	);
}


