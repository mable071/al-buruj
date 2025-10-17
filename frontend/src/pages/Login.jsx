import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../api/client.js";

export default function Login() {
	const [username, setU] = useState("");
	const [password, setP] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	async function submit(e) {
		e.preventDefault();
		setErr("");
		setLoading(true);
		
		try {
			const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password })
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || "Invalid credentials");
			}
			
			const data = await response.json();
			console.log("Login response:", data); // Debug log
			
			if (!data.token) {
				throw new Error("No token received");
			}
			
			// Parse JWT token safely
			try {
				const parts = data.token.split('.');
				if (parts.length !== 3) {
					throw new Error("Invalid token format");
				}
				const userData = JSON.parse(atob(parts[1]));
				console.log("Parsed user data:", userData); // Debug log
				login(data.token, userData);
				
				// Force redirect after successful login
				setTimeout(() => {
					navigate("/dashboard", { replace: true });
				}, 100);
			} catch (parseError) {
				console.error("Token parsing error:", parseError);
				throw new Error("Invalid token format");
			}
		} catch (error) {
			console.error("Login error:", error);
			setErr(error.message || "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-sm card p-6">
				<div className="text-center text-xl font-semibold mb-4">Al-Buruj Stock Management</div>
				<form onSubmit={submit} className="space-y-3">
					{err && <div className="text-red-300">{err}</div>}
					<input className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none" placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
					<input type="password" className="w-full px-3 py-2 rounded-lg bg-white/10 outline-none" placeholder="Password" value={password} onChange={e=>setP(e.target.value)} />
					<button disabled={loading} className="btn btn-primary w-full">
						{loading ? "Logging in..." : "Login"}
					</button>
				</form>
			</div>
		</div>
	);
}


