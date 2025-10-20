import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { FiPackage, FiTrendingUp, FiTrendingDown, FiBarChart } from "react-icons/fi";
import { motion } from "framer-motion";
import { useData } from "../hooks/useData.js";
import { useState } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

ChartJS.defaults.color = "#ffffff"; // force white text
ChartJS.defaults.borderColor = "rgba(255,255,255,0.1)";

export default function Dashboard(){
	const { data, loading, error, refresh } = useData("/api/reports/dashboard", { 
		autoRefresh: true,
		initialData: {
			stats: { totalProducts: 0, totalStockIn: 0, totalStockOut: 0, currentStockBalance: 0 },
			recentActivity: [],
			weeklyData: [],
			topProducts: []
		}
	});

	// Pagination state for Recent Activity
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5); // Smaller for dashboard

	// Pagination logic for recent activity
	const totalActivityItems = data.recentActivity.length;
	const totalActivityPages = Math.ceil(totalActivityItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentActivityItems = data.recentActivity.slice(startIndex, startIndex + itemsPerPage);

	const statsCards = [
		{
			title: "Total Products",
			value: data.stats.totalProducts,
			icon: <FiPackage className="text-2xl" />,
			bgColor: "bg-blue-500/20",
			iconColor: "text-blue-400",
			borderColor: "border-blue-500/30"
		},
		{
			title: "Total Stock In",
			value: data.stats.totalStockIn,
			icon: <FiTrendingUp className="text-2xl" />,
			bgColor: "bg-green-500/20",
			iconColor: "text-green-400",
			borderColor: "border-green-500/30"
		},
		{
			title: "Total Stock Out",
			value: data.stats.totalStockOut,
			icon: <FiTrendingDown className="text-2xl" />,
			bgColor: "bg-red-500/20",
			iconColor: "text-red-400",
			borderColor: "border-red-500/30"
		},
		{
			title: "Current Stock Balance",
			value: data.stats.currentStockBalance,
			icon: <FiBarChart className="text-2xl" />,
			bgColor: "bg-gray-500/20",
			iconColor: "text-gray-400",
			borderColor: "border-gray-500/30"
		}
	];

	const weeklyChartData = {
		labels: data.weeklyData.map(w => new Date(w.week_start).toLocaleDateString()),
		datasets: [
			{
				label: "Stock In",
				data: data.weeklyData.map(w => w.stock_in),
				backgroundColor: "rgba(34, 197, 94, 0.8)",
				borderColor: "rgb(34, 197, 94)",
				borderWidth: 1
			},
			{
				label: "Stock Out",
				data: data.weeklyData.map(w => w.stock_out),
				backgroundColor: "rgba(239, 68, 68, 0.8)",
				borderColor: "rgb(239, 68, 68)",
				borderWidth: 1
			}
		]
	};

	const pieChartData = {
		labels: data.topProducts.map(p => p.product_name),
		datasets: [{
			data: data.topProducts.map(p => p.quantity),
			backgroundColor: [
				"#3B82F6", "#10B981", "#F59E0B", "#EF4444",
				"#8B5CF6", "#06B6D4", "#84CC16", "#F97316"
			],
			borderWidth: 2,
			borderColor: "#1F2937"
		}]
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg opacity-70">Loading dashboard...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-300 text-center py-8">
				Error loading dashboard: {error}
				<button onClick={refresh} className="btn btn-primary ml-4">Retry</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-white">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{statsCards.map((card, index) => (
					<motion.div
						key={card.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						whileHover={{ scale: 1.02 }}
						className={`card p-6 border ${card.borderColor} ${card.bgColor} hover:shadow-lg transition-all duration-200`}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-300 mb-1">{card.title}</p>
								<p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
							</div>
							<div className={card.iconColor}>
								{card.icon}
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Weekly Stock Movement */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.4 }}
					className="card p-6"
				>
					<h3 className="text-lg font-semibold mb-4 text-gray-300">Weekly Stock Movement</h3>
					<div className="h-64">
						<Bar data={weeklyChartData} options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: { position: 'top', labels: { color: '#ffffff' } },
								tooltip: { mode: 'index', intersect: false }
							},
							scales: {
								y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ffffff' } },
								x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ffffff' } }
							}
						}} />
					</div>
				</motion.div>

				{/* Stock Distribution */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.5 }}
					className="card p-6"
				>
					<h3 className="text-lg font-semibold mb-4 text-gray-300">Stock Distribution</h3>
					<div className="h-64">
						<Pie data={pieChartData} options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: { position: 'bottom', labels: { color: '#ffffff' } },
								tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} units` } }
							}
						}} />
					</div>
				</motion.div>
			</div>

			{/* Recent Activity - Responsive with Pagination */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className="card p-6"
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-300">Recent Activity</h3>
					{totalActivityPages > 1 && (
						<div className="text-sm opacity-70">
							Page {currentPage} of {totalActivityPages}
						</div>
					)}
				</div>
				
				{/* Responsive Container - Table on md+, Cards below md */}
				<div className="overflow-hidden">
					{/* Desktop Table (md and up) */}
					<div className="hidden md:block overflow-auto">
						<table className="w-full text-sm">
							<thead className="text-gray-300">
								<tr>
									<th className="text-left py-2">Type</th>
									<th className="text-left">Product</th>
									<th className="text-left">Quantity</th>
									<th className="text-left">Date</th>
									<th className="text-left">User</th>
								</tr>
							</thead>
							<tbody>
								{currentActivityItems.length === 0 ? (
									<tr><td className="py-4 opacity-70" colSpan={5}>No recent activity</td></tr>
								) : (
									currentActivityItems.map((activity, index) => (
										<tr key={index} className="border-t border-white/10">
											<td className="py-2">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													activity.type === 'IN' 
														? 'bg-green-500/20 text-green-400 border border-green-500/30' 
														: 'bg-red-500/20 text-red-400 border border-red-500/30'
												}`}>
													{activity.type}
												</span>
											</td>
											<td>{activity.product_name}</td>
											<td>{activity.quantity}</td>
											<td>{new Date(activity.date).toLocaleDateString()}</td>
											<td>{activity.user || '-'}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Mobile Cards (below md) */}
					<div className="md:hidden space-y-3">
						{currentActivityItems.length === 0 ? (
							<div className="text-center py-8 opacity-70">No recent activity</div>
						) : (
							currentActivityItems.map((activity, index) => (
								<div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
									<div className="grid grid-cols-1 gap-2 text-sm">
										<div className="flex justify-between items-center">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${
												activity.type === 'IN' 
													? 'bg-green-500/20 text-green-400 border border-green-500/30' 
													: 'bg-red-500/20 text-red-400 border border-red-500/30'
											}`}>
												{activity.type}
											</span>
											<span className="text-xs opacity-70">{new Date(activity.date).toLocaleDateString()}</span>
										</div>
										<div className="flex justify-between">
											<span className="opacity-70">Product:</span>
											<span className="font-medium">{activity.product_name}</span>
										</div>
										<div className="flex justify-between">
											<span className="opacity-70">Qty:</span>
											<span className="font-semibold">{activity.quantity}</span>
										</div>
										<div className="flex justify-between">
											<span className="opacity-70">User:</span>
											<span>{activity.user || '-'}</span>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Pagination for Recent Activity */}
				{totalActivityPages > 1 && (
					<div className="flex items-center justify-center gap-2 pt-4">
						<button
							onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
							disabled={currentPage === 1}
							className="btn px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
						>
							‹
						</button>
						
						<div className="flex gap-1">
							{Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(page => (
								<button
									key={page}
									onClick={() => setCurrentPage(page)}
									className={`btn px-2 py-1 text-xs ${
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
							onClick={() => setCurrentPage(p => Math.min(p + 1, totalActivityPages))}
							disabled={currentPage === totalActivityPages}
							className="btn px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
						>
							›
						</button>
					</div>
				)}
			</motion.div>
		</div>
	);
}