import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [workspace, setWorkspace] = useState(() => {
    const stored = localStorage.getItem("workspace");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData, workspaceData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("workspace", JSON.stringify(workspaceData));
    setUser(userData);
    setWorkspace(workspaceData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("workspace");
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
