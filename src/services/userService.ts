// userService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8222/users';

export const GoogleLogin = () => {
  // Redirect to backend's Google OAuth endpoint
  window.location.href = `${API_BASE_URL}/google`;
};
export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password }, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      const token = response.data;
      localStorage.setItem("jwt_token", token.access_token);
      console.log("Login successful:", token);
      return { success: true, token };
    } else {
      return { success: false, error: "Invalid credentials" };
    }
  } catch (error: any) {
    console.error("Login failed:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
};
// userService.ts
export const handleGoogleCallback = async () => {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  if (token) {
    try {
      // Verify token with backend
      const response = await axios.get(`${API_BASE_URL}/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.valid) {
        localStorage.setItem('jwt_token', token);
        // Store user info if needed
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
  return false;
};
// Signup
export const signup = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/signup`,
      { username, email, password },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status === 200) {
      return { success: true, message: 'User registered successfully' };
    } else {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
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
    const response = await axios.get(`${API_BASE_URL}/clients`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch clients');
    }
  } catch (error) {
    console.error('Error fetching clients:', error.response?.data || error.message);
    return []; // Returning empty array in case of error
  }
};
