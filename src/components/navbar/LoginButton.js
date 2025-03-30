import React, { useEffect, useContext, useState } from "react";
import {
  Button,
  Box,
  useToast
} from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { AccountContext } from "../../AccountContext";

// Define constants to avoid repetition
const API_HOST = process.env.REACT_APP_API_HOST;
const STORAGE_KEYS = {
  TOKEN: "token",
  ACCOUNT: "account",
  REGISTRATION_KEY: "registration_key"
};

const LoginButton = () => {
  const { setAccount } = useContext(AccountContext);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Helper functions
  const getStoredItem = (key) => localStorage.getItem(STORAGE_KEYS[key]);
  const clearStoredItems = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  };

  // Check token expiration and clean up if needed
  const checkTokenExpiration = () => {
    const token = getStoredItem("TOKEN");
    if (!token) return false;
    
    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken.exp < Date.now() / 1000;
      
      if (isExpired) {
        clearStoredItems();
        setAccount(null);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      clearStoredItems();
      setAccount(null);
      return false;
    }
  };

  // Initialization effects
  useEffect(() => {
    const init = async () => {
      const isTokenValid = checkTokenExpiration();
      
      if (isTokenValid) {
        const account = getStoredItem("ACCOUNT");
        if (account) {
          setAccount(account);
        }
      }
    };
    
    init();
  }, []);

  // Handle Auth0 login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Get Auth0 login URL from backend
      const callbackUrl = `${window.location.origin}/callback`;
      
      const { data } = await axios.get(
        `${API_HOST}/auth/login?returnTo=${encodeURIComponent(callbackUrl)}`
      );
      
      if (!data?.success || !data?.authUrl) {
        throw new Error("Failed to get authentication URL");
      }
      
      // Redirect to Auth0 login page
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Could not initiate login process. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearStoredItems();
    setAccount(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Common button styles
  const buttonStyles = {
    color: "white",
    fontSize: "lg",
    fontWeight: "600",
    borderRadius: "70px",
    mr: "10px",
    px: "36px",
    py: "24px",
    size: "lg",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
    transition: "all 0.2s ease",
  };

  const isConnected = Boolean(getStoredItem("ACCOUNT"));

  return (
    <Box>
      {isConnected ? (
        <Button
          aria-label="Logout Button"
          bg="red.500"
          ml="10px"
          onClick={handleLogout}
          _hover={{
            bg: "red.400",
            transform: "translateY(-2px)",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)",
          }}
          _active={{
            bg: "red.600",
            transform: "translateY(1px)",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
          }}
          {...buttonStyles}
        >
          Logout
        </Button>
      ) : (
        <Button
          aria-label="Login Button"
          bg="green.500"
          isLoading={isLoading}
          loadingText="Connecting..."
          onClick={handleLogin}
          _hover={{
            bg: "green.400",
            transform: "translateY(-2px)",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)",
          }}
          _active={{
            bg: "green.600",
            transform: "translateY(1px)",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
          }}
          {...buttonStyles}
        >
          Login
        </Button>
      )}
    </Box>
  );
};

export default LoginButton;