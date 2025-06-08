"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      toast.success("Login successful!", { id: "login-success" });
      window.history.replaceState(null, "", "/");
    }
  }, [searchParams]);

  return null;
}
