// Example AccountContext implementation
import React, { createContext, useState, useEffect } from 'react';

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const [account, setAccount] = useState(localStorage.getItem("account"));

  // This ensures the context updates if localStorage changes in another tab/window
  useEffect(() => {
    const handleStorageChange = () => {
      const newAccount = localStorage.getItem("account");
      setAccount(newAccount);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Custom setter that updates both state and localStorage
  const updateAccount = (newAccount) => {
    if (newAccount) {
      localStorage.setItem("account", newAccount);
    } else {
      localStorage.removeItem("account");
    }
    setAccount(newAccount);
  };

  return (
    <AccountContext.Provider value={{ account, setAccount: updateAccount }}>
      {children}
    </AccountContext.Provider>
  );
};