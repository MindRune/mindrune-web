import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Center,
  VStack,
  Spinner,
  Text,
  useToast
} from '@chakra-ui/react';
import { AccountContext } from "../AccountContext";

const API_HOST = process.env.REACT_APP_API_HOST;

const AuthCallback = () => {
  const history = useHistory();
  const toast = useToast();
  const [status, setStatus] = useState('Processing your login...');
  const { setAccount } = useContext(AccountContext);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found');
        }

        // Call your backend with the code
        const { data } = await axios.post(`${API_HOST}/auth/callback`, { code });
        
        if (!data?.success) {
          throw new Error('Authentication failed');
        }
        
        // Store authentication data
        const token = data.token.replace('Bearer ', '');
        localStorage.setItem('token', token);
        
        // Extract user ID from token
        const decodedToken = jwtDecode(token);
        const userId = decodedToken._id;
        localStorage.setItem('account', userId);
        setAccount(userId)
        
        // Store registration key if present
        if (data.registration_key) {
          localStorage.setItem('registration_key', data.registration_key);
        }
        
        setStatus('Login successful! Redirecting...');
        
        toast({
          title: 'Login Successful',
          description: 'You are now logged in with Discord.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Redirect back to home
        setTimeout(() => history.push('/'), 1500);
        
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('Login failed. Redirecting...');
        
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Could not complete the login process.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        
        // Redirect back to home after error
        setTimeout(() => history.push('/'), 3000);
      }
    };

    processAuth();
  }, [history, toast]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="purple.500" />
        <Text fontSize="lg" fontWeight="medium">{status}</Text>
      </VStack>
    </Center>
  );
};

export default AuthCallback;