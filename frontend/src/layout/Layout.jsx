import { NavLink, Outlet } from "react-router-dom";
import { FiHome, FiPackage, FiArrowDownCircle, FiArrowUpCircle, FiSearch, FiFileText, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext.jsx";
import OnlineStatus from "../components/OnlineStatus.jsx";
import { useEffect, useState } from "react";

export function Layout() {
	const { logout } = useAuth();
	const [open, setOpen] = useState(false);
    const [atTop, setAtTop] = useState(true);
	const nav = [
		{ to: "/dashboard", icon: <FiHome/>, label: "Dashboard" },
		{ to: "/products", icon: <FiPackage/>, label: "Products" },
		{ to: "/in", icon: <FiArrowDownCircle/>, label: "Product In" },
		{ to: "/out", icon: <FiArrowUpCircle/>, label: "Product Out" },
		{ to: "/search", icon: <FiSearch/>, label: "Search" },
		{ to: "/report", icon: <FiFileText/>, label: "Daily Report" },
	];


	// Toggle navbar background based on scroll position
	useEffect(() => {
		const onScroll = () => {
			const y = window.scrollY || 0;
			setAtTop(y < 24);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<div className="min-h-screen">
			{/* Top Navbar fixed (always visible); background collapses at top */}
			<div className={`fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 md:pl-[292px] md:pr-4 transition-colors duration-300 ${atTop ? "bg-transparent backdrop-blur-0 border-b border-transparent" : "bg-slate-900/70 backdrop-blur border-b border-white/10"}`}>
				<div className="flex items-center gap-3">
					<button onClick={()=>setOpen(true)} className="md:hidden btn bg-white/10 hover:bg-white/20"><FiMenu/></button>
					<NavLink to="/dashboard" className="text-xl font-semibold">Al-Buruj Stock Management</NavLink>
				</div>
				<button onClick={logout} className="btn btn-primary"><FiLogOut className="mr-2"/> Logout</button>
			</div>

			{/* Sidebar fixed on md+ aligned with navbar height; extend behind navbar and offset content */}
			<aside className="hidden md:flex fixed top-0 left-4 bottom-0 w-[260px] z-30 pt-16">
				<div className="card w-full h-full rounded-none border-r border-white/10 p-4">
					<div className="text-lg font-semibold mb-6">Al-Buruj</div>
					<nav className="space-y-2">
						{nav.map(n => (
							<NavLink key={n.to} to={n.to} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive?'bg-white/20':'hover:bg-white/10'}`}>
								<span className="text-xl">{n.icon}</span><span>{n.label}</span>
							</NavLink>
						))}
					</nav>
				</div>
			</aside>

			{/* Main content: add extra top padding (navbar height + 1rem) and align with margins */}
			<main className="pt-24 md:pl-[292px] md:pr-4 p-4">
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


