import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getToken() {
  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) throw new Error("Not signed in.");
  return token;
}

export async function runScan(vehicleId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Scan failed.");
  return res.json();
}

export async function getLatestScan(vehicleId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}/scans/latest`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Could not load scan.");
  return res.json();
}

export async function getScanHistory(vehicleId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}/scans`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Could not load history.");
  return res.json();
}
