const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5050";

export function authHeader() {
	const t = localStorage.getItem("token");
	return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api(path, opts = {}) {
	try {
		const res = await fetch(`${API}${path}`, {
			...opts,
			headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", ...(opts.headers||{}), ...authHeader() },
			cache: 'no-store'
		});
		if (!res.ok) {
			if (res.status === 401) {
				throw new Error("Unauthorized");
			}
			const txt = await res.text().catch(()=>"Request failed");
			throw new Error(txt || `HTTP ${res.status}`);
		}
		return res.status === 204 ? null : res.json();
	} catch (e) {
		if (e?.message === "Failed to fetch") {
			throw new Error("Network error. Is the API running?");
		}
		throw e;
	}
}


