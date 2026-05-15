import axios from "axios";

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://onebitearticle.com").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

if (__DEV__) {
  console.log(`[API] baseURL: ${BASE_URL}`);
}
