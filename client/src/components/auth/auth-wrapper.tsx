import { useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import { queryClient } from "@/lib/queryClient";

interface AuthWrapperProps {
  onSuccess: () => void;
}

export default function AuthWrapper({ onSuccess }: AuthWrapperProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleAuthSuccess = () => {
    // Invalidate auth query to refresh user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    onSuccess();
  };

  const handleSwitchToRegister = () => {
    setMode("register");
  };

  const handleSwitchToLogin = () => {
    setMode("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      {mode === "login" ? (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
}