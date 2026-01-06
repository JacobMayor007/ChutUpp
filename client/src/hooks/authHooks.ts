import { useState } from "react";
import { authService } from "../service/authService";

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type?: "success" | "error";
  }>({
    message: "",
    type: undefined,
  });

  const execute = async (email: string, password: string) => {
    setLoading(true);
    try {
      const server = await authService.registerUser(email, password);
      if (!server.ok) throw new Error("Failed to sync with server");

      setAlert({ message: "Account created successfully!", type: "success" });
      return true;
    } catch (error: any) {
      setAlert({
        message: error.message || "An error occurred",
        type: "error",
      });
      return false;
    } finally {
      setLoading(false);
      // Auto-clear alert after 3 seconds
      setTimeout(() => setAlert({ message: "", type: undefined }), 3000);
    }
  };

  return { execute, loading, alert };
};

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type?: "success" | "error";
  }>({
    message: "",
    type: undefined,
  });

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.loginUser(email, password);

      if (!result) {
        setAlert({ message: "Login failed!", type: "error" });
      }

      setAlert({ message: "Login successfully!", type: "success" });
      return true;
    } catch (error: any) {
      setAlert({
        message: error.message || "An error occurred",
        type: "error",
      });
      return false;
    } finally {
      setLoading(false);
      // Auto-clear alert after 3 seconds
      setTimeout(() => setAlert({ message: "", type: undefined }), 3000);
    }
  };

  return { login, loading, alert };
};

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type?: "success" | "error";
  }>({
    message: "",
    type: undefined,
  });

  const logout = async () => {
    try {
      await authService.logoutUser();
      setAlert({ message: "Logged out successfully!", type: "success" });
    } catch (error: any) {
      setAlert({
        message: error.message || "An error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert({ message: "", type: undefined }), 3000);
    }
  };
  return { logout, loading, alert };
};
