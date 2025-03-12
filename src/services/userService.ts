// userService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8222/users';

// Fetch all users from Google
export const GoogleLogin = async () => {
  window.location.href = 'http://localhost:8222/users/google';
};
