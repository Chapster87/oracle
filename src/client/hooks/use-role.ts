import { useState, useEffect } from "react";

export type Role = "DM" | "PLAYER";

/**
 * Hook to manage and provide the current user role for the prototype.
 * Uses localStorage for persistence in the prototype.
 */
export function useRole() {
  const [role, setRole] = useState<Role>("PLAYER");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("oracle_prototype_role") as Role;
    if (savedRole) {
      setRole(savedRole);
    }
    setIsLoaded(true);
  }, []);

  const toggleRole = () => {
    const newRole = role === "DM" ? "PLAYER" : "DM";
    setRole(newRole);
    localStorage.setItem("oracle_prototype_role", newRole);
  };

  return { role, toggleRole, isLoaded };
}
