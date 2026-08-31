"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }
    sessionStorage.setItem("adminPassword", password);
    onLogin(password);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          เข้าสู่ระบบ Admin
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">รหัสผ่าน Admin</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export function useAdminAuth() {
  const [password, setPassword] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("adminPassword");
    if (stored) setPassword(stored);
    setReady(true);
  }, []);

  function login(pwd: string) {
    setPassword(pwd);
  }

  function logout() {
    sessionStorage.removeItem("adminPassword");
    setPassword(null);
    router.push("/");
  }

  return { password, ready, login, logout };
}
