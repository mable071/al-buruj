import { NavLink, Outlet } from "react-router-dom";
import { FiHome, FiPackage, FiArrowDownCircle, FiArrowUpCircle, FiSearch, FiFileText, FiLogOut, FiMenu, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 3; // Show 3 items per page on mobile cards
	const totalPages = Math.ceil(nav.length / itemsPerPage);

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

	// Get current items for pagination
	const getCurrentItems = () => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return nav.slice(startIndex, startIndex + itemsPerPage);
	};

	// Handle page change
	const goToPage = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
			if (open) setOpen(false); // Close mobile menu on page change
		}
	};

	// Render pagination buttons
	const renderPagination = () => (
		totalPages > 1 && (
			<div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-white/10">
				<button
					onClick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					className="btn btn-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed p-2"
				>
					<FiChevronLeft size={16} />
				</button>
				
				{Array.from({ length: totalPages }, (_, i) => (
					<button
						key={i + 1}
						onClick={() => goToPage(i + 1)}
						className={`btn btn-sm px-3 ${
							currentPage === i + 1
								? 'bg-white/20 text-white'
								: 'bg-white/10 hover:bg-white/20'
						}`}
					>
						{i + 1}
					</button>
				))}
				
				<button
					onClick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="btn btn-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed p-2"
				>
					<FiChevronRight size={16} />
				</button>
			</div>
		)
	);

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
				<div className=" bg-gray-700 rounded-md p-4 md:p-6"><Outlet/></div>
			</main>

			{open && (
				<div className="fixed inset-0 z-50 md:hidden">
					<div className="absolute inset-0 bg-black/70" onClick={()=>setOpen(false)}></div>
					<div className="absolute left-0 top-0 h-full w-80 p-4 card m-0 rounded-none border-r border-white/10 bg-slate-800 overflow-y-auto">
						<div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-800 pb-4">
							<div className="text-lg font-semibold">Al-Buruj</div>
							<button onClick={()=>setOpen(false)} className="btn bg-white/10 hover:bg-white/20"><FiX/></button>
						</div>
						
						{/* Mobile Cards with Pagination */}
						<div className="space-y-3">
							{getCurrentItems().map(n => (
								<NavLink 
									key={n.to} 
									to={n.to} 
									onClick={() => {
										setOpen(false);
										setCurrentPage(1); // Reset to first page
									}}
									className={({isActive}) => `card bg-white/5 hover:bg-white/10 transition-all p-4 rounded-lg flex items-center gap-3 ${
										isActive ? 'ring-2 ring-white/20' : ''
									}`}
								>
									<span className="text-xl text-white/80">{n.icon}</span>
									<span className="text-white font-medium flex-1">{n.label}</span>
								</NavLink>
							))}
						</div>
						
						{renderPagination()}
					</div>
				</div>
			)}
			<OnlineStatus/>
		</div>
	);
}