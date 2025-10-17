import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import ProductIn from "./pages/ProductIn.jsx";
import ProductOut from "./pages/ProductOut.jsx";
import Search from "./pages/Search.jsx";
import DailyReport from "./pages/DailyReport.jsx";
import { Layout } from "./layout/Layout.jsx";

function RequireAuth({ children }) {
	const { isAuthenticated, loading, user } = useAuth();
	
	console.log("RequireAuth state:", { isAuthenticated, loading, user });
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg opacity-70">Loading...</div>
			</div>
		);
	}
	
	return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
	return (
		<AuthProvider>
			<RouterProvider router={routes} />
		</AuthProvider>
	);
}

const routes = createBrowserRouter([
	{ 
		path: "/", 
		element: <RequireAuth><Layout/></RequireAuth>,
		children: [
			{ index: true, element: <Navigate to="/dashboard" replace /> },
			{ path: "dashboard", element: <Dashboard/> },
			{ path: "products", element: <Products/> },
			{ path: "in", element: <ProductIn/> },
			{ path: "out", element: <ProductOut/> },
			{ path: "search", element: <Search/> },
			{ path: "report", element: <DailyReport/> },
		]
	},
	{ path: "/login", element: <Login /> }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

// Register SW only in production and add update handling
if (import.meta.env.PROD && "serviceWorker" in navigator) {
	let refreshing = false;
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (refreshing) return; refreshing = true; window.location.reload();
	});
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").then((reg) => {
			if (reg.waiting) {
				// new SW is waiting, trigger activation
				reg.waiting.postMessage({ type: "SKIP_WAITING" });
			}
			reg.addEventListener("updatefound", () => {
				const nw = reg.installing;
				if (!nw) return;
				nw.addEventListener("statechange", () => {
					if (nw.state === "installed" && navigator.serviceWorker.controller) {
						// new content available, activate immediately
						reg.waiting?.postMessage({ type: "SKIP_WAITING" });
					}
				});
			});
		}).catch(console.error);
	});
}


