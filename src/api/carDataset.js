import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getToken() {
  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) throw new Error("You are not signed in. Please sign in again.");
  return token;
}

/**
 * GET /api/brands
 * Returns: [{ id, name }, ...]
 */
export async function getBrands() {
  const token = await getToken();

  const response = await fetch(`${API_URL}/brands`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load brands.");
  }

  return data.brands;
}

/**
 * GET /api/models?brand_id=1
 * Returns: [{ id, name }, ...]
 */
export async function getModels(brandId) {
  const token = await getToken();

  const response = await fetch(`${API_URL}/models?brand_id=${brandId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load models.");
  }

  return data.models;
}

/**
 * GET /api/years?model_id=5
 * Returns: [2000, 2001, 2002, ...]  (array of year numbers)
 */
export async function getYears(modelId) {
  const token = await getToken();

  const response = await fetch(`${API_URL}/years?model_id=${modelId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load years.");
  }

  return data.years;
}

/**
 * GET /api/variant?model_id=5&year=2015
 * Returns: {
 *   image_path: "cars/audi/a3_8v.jpg",
 *   colors: [{ name: "Brilliant Black", hex: "#1a1a1a" }, ...],
 *   engines: ["1.8 TFSI", "2.0 TFSI", "2.0 TDI"]
 * }
 */
export async function getVariant(modelId, year) {
  const token = await getToken();

  const response = await fetch(
    `${API_URL}/variant?model_id=${modelId}&year=${year}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load variant details.");
  }

  return data.variant;
}