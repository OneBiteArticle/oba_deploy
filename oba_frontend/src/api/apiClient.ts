import axios from "axios";

const BASE_URL = "http://192.168.219.101:9000"; 

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});