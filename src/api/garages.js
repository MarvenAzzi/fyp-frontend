import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("auth_token");

  if (!token) {
    throw new Error("You are not signed in. Please sign in again.");
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return { message: text || "Invalid server response." };
  }
}

function getBestErrorMessage(data, fallbackMessage) {
  console.log("GARAGE API ERROR:", JSON.stringify(data, null, 2));

  return (
    data?.google_error?.error?.message ||
    data?.google_error?.error_message ||
    data?.google_error?.message ||
    data?.message ||
    fallbackMessage
  );
}

export async function getNearbyGarages(latitude, longitude, radius = 8000) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing in the frontend .env file.");
  }

  const headers = await getAuthHeaders();

  const url =
    `${API_URL}/garages/nearby` +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&radius=${encodeURIComponent(radius)}`;

  console.log("GARAGE NEARBY URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      getBestErrorMessage(data, "Could not load nearby garages.")
    );
  }

  return data.data || [];
}

export async function getGarageDirections(origin, destination) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing in the frontend .env file.");
  }

  const headers = await getAuthHeaders();

  const url =
    `${API_URL}/garages/directions` +
    `?origin_latitude=${encodeURIComponent(origin.latitude)}` +
    `&origin_longitude=${encodeURIComponent(origin.longitude)}` +
    `&destination_latitude=${encodeURIComponent(destination.latitude)}` +
    `&destination_longitude=${encodeURIComponent(destination.longitude)}`;

  console.log("GARAGE DIRECTIONS URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      getBestErrorMessage(data, "Could not load directions.")
    );
  }

  return data;
}