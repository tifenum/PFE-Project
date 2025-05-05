import axios from 'axios';
import { API_BASE_URL } from "./config";

const API_BASE_URL1 = `${API_BASE_URL}/auth`;

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL1}/login`, { email, password }, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      const token = response.data;
      localStorage.setItem("jwt_token", token.access_token);
      console.log("Login successful:", token);
      return { success: true, token };
    }
    return { success: false, error: "Invalid credentials" };
  } catch (error: any) {
    console.error("Login failed:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
};

export const signup = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL1}/signup`,
      { username, email, password },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status === 200) {
      return { success: true, message: 'User registered successfully' };
    }
    return { success: false, error: 'Signup failed. Please try again.' };
  } catch (error: any) {
    console.error('Signup failed:', error);
    if (error.response && error.response.status === 400) {
      return { success: false, error: 'Email already in use' };
    }
    return { success: false, error: 'Signup failed. Please try again.' };
  }
};

export const fetchAllClients = async () => {
  try {
    const response = await axios.get(`h${API_BASE_URL1}/users/clients`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
      },
    });

    if (response.status === 200) {
      console.log('Fetched clients:', response.data);
      return response.data;
    }
    throw new Error('Failed to fetch clients');
  } catch (error) {
    console.error('Error fetching clients:', error.response?.data || error.message);
    return [];
  }
};

export const logout = async () => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    try {
      await axios.post(`${API_BASE_URL1}/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
    }
  } else {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
  }
};