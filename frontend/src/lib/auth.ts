export type Role = "manager" | "employee";

export type AuthedUser = {
  user_id: number;
  username: string;
  role: Role;
  mfaEnabled?: boolean;
};

export function getUser(): AuthedUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthedUser) : null;
  } catch {
    return null;
  }
}

export function isManager() {
  return getUser()?.role === "manager";
}

export function storeUser(user: AuthedUser | null) {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
