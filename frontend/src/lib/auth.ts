export type Role = "manager" | "employee";

export type AuthedUser = {
  user_id: number;
  username: string;
  role: Role;
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
