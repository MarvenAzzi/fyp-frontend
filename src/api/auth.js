import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[@$!%*#?&]/.test(password)
  );
}

export function getPasswordErrorMessage() {
  return "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.";
}

export async function register(username, phoneNumber, email, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      phone_number: phoneNumber.trim(),
      email: email ? email.trim().toLowerCase() : null,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Register error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Register failed");
  }

  await SecureStore.setItemAsync("auth_token", data.token);
  await SecureStore.setItemAsync("auth_user", JSON.stringify(data.user));

  return data;
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Login error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Login failed");
  }

  await SecureStore.setItemAsync("auth_token", data.token);
  await SecureStore.setItemAsync("auth_user", JSON.stringify(data.user));

  return data;
}

export async function getAuthUser() {
  const userJson = await SecureStore.getItemAsync("auth_user");

  if (!userJson) {
    return null;
  }

  return JSON.parse(userJson);
}

export async function updateProfile(username, phoneNumber, password) {
  const token = await SecureStore.getItemAsync("auth_token");

  if (!token) {
    throw new Error("You are not signed in. Please sign in again.");
  }

  const body = {
    username,
    phone_number: phoneNumber,
  };

  if (password && password.trim().length > 0) {
    body.password = password.trim();
  }

  const response = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Update profile error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Failed to update profile");
  }

  await SecureStore.setItemAsync("auth_user", JSON.stringify(data.user));

  return data;
}

export async function logout() {
  const token = await SecureStore.getItemAsync("auth_token");

  try {
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.log("Logout API error:", error);
  }

  await SecureStore.deleteItemAsync("auth_token");
  await SecureStore.deleteItemAsync("auth_user");
  await SecureStore.deleteItemAsync("selected_vehicle");
}