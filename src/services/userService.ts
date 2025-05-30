import axios from 'axios';
import { API_BASE_URL } from "./config";
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL1 = `${API_BASE_URL}/auth`;

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL1}/login`, { email, password }, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      const token = response.data;
      localStorage.setItem("jwt_token", token.access_token);
      return { success: true, token };
    }
    return { success: false, error: "Invalid credentials" };
  } catch (error: any) {
    console.error("Login failed:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
};

const getUserId = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("jwt_token");
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.sub;
  } catch {
    return null;
  }
};

export const askAssistant = async (
  message: string,
  sessionId: string,
) => {
  const userId = getUserId();
  const response = await axios.get(`${API_BASE_URL}/users/ask`, {
    params: { message, sessionId, userId },
  });
  return response.data;
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
      return { success: true, message: response.data }; // Forward the backend message
    }
    return { success: false, error: 'Signup failed. Please try again.' };
  } catch (error: any) {
    console.error('Signup failed:', error);
    if (error.response && error.response.status === 400) {
      return { success: false, error: error.response.data }; // Forward specific error
    }
    return { success: false, error: 'Signup failed. Please try again.' };
  }
};
export const fetchAllClients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/clients`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    }
    throw new Error('Failed to fetch clients');
  } catch (error) {
    console.error('Error fetching clients:', error.response?.data || error.message);
    return [];
  }
};

export const resetPassword = async (email: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL1}/reset-password`,
      { email },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200) {
      return { success: true, message: response.data };
    }
    return { success: false, error: "Password reset failed. Please try again." };
  } catch (error: any) {
    console.error("Password reset failed:", error);
    if (error.response && error.response.status === 404) {
      return { success: false, error: "No user found with the provided email." };
    }
    return { success: false, error: "Password reset failed. Please try again." };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
      },
    });

    if (response.status === 204) {
      return true;
    }
    throw new Error('Failed to delete user');
  } catch (error) {
    console.error('Error deleting user:', error.response?.data || error.message);
    throw error;
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


export const fetchMapillaryImages = async (bbox: string, limit: number = 2) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/map/images`, {
      params: { bbox, limit }
    });

    if (response.status === 200) {
      return response.data;
    }
    throw new Error('Failed to fetch map images');
  } catch (error) {
    console.error('Error fetching map images:', error.response?.data || error.message);
    return [];
  }
};

export const fetchMapillaryImageDetails = async (imageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/map/image/${imageId}`);
    if (response.status === 200) {
      return response.data;
    }
    throw new Error('Failed to fetch image details');
  } catch (error) {
    console.error('Error fetching image details:', error.response?.data || error.message);
    return null;
  }
};
