const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function sendForgotPasswordCode(email) {
  const cleanEmail = email.trim().toLowerCase();

  const response = await fetch(`${API_URL}/forgot-password/send-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: cleanEmail,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Send code error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Failed to send verification code.");
  }

  return data;
}

export async function verifyForgotPasswordCode(email, code) {
  const cleanEmail = email.trim().toLowerCase();

  const response = await fetch(`${API_URL}/forgot-password/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: cleanEmail,
      code,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Verify code error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Invalid verification code.");
  }

  return data;
}

export async function resetForgotPassword(email, code, password) {
  const cleanEmail = email.trim().toLowerCase();

  const response = await fetch(`${API_URL}/forgot-password/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: cleanEmail,
      code,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("Reset password error response:", data);

    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0];
      throw new Error(firstError);
    }

    throw new Error(data.message || "Failed to reset password.");
  }

  return data;
}