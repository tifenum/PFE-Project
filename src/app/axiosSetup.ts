import axios from 'axios';
import { toast } from 'sonner';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("jwt_token");
      sessionStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("authChange"));
      window.location.href = "/signin?error=session_expired";
      toast.error("Session expired. Please sign in again.");
    }
    return Promise.reject(error);
  }
);

export default axios;