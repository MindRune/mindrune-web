import React, { useEffect, useContext, useState } from "react";
import {
  Button,
  Box,
  Image,
  Text,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Web3 from "web3";
import { AccountContext } from "../../AccountContext";
import rabby_wallet from "../../..//src/assets/img/rabby-wallet.svg";

// Define constants to avoid repetition
const API_HOST = process.env.REACT_APP_API_HOST;
const STORAGE_KEYS = {
  TOKEN: "token",
  ACCOUNT: "account",
  WALLET_PROVIDER: "wallet_provider",
  BLOCKCHAIN: "blockchain"
};

// Chain ID mapping for better maintainability
const CHAIN_NAMES = {
  "0x4fce": "NeuroWeb Testnet",
  "0x7fb": "NeuroWeb Mainnet",
  "0x64": "Gnosis Mainnet",
  "0x27d8": "Chiado Testnet",
  "0x2105": "Base Mainnet",
  "0x14a34": "Base Testnet"
};

// Wallet installation URLs
const WALLET_DOWNLOAD_URLS = {
  metamask: "https://metamask.io/download/",
  rabby: "https://rabby.io/",
  phantom: "https://phantom.app/download"
};

const ConnectButton = () => {
  const { setAccount } = useContext(AccountContext);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Define wallet configurations - moved outside of component but kept here for clarity
  const walletConfigs = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      getProvider: async () => window.ethereum?.isMetaMask ? window.ethereum : null,
    },
    {
      id: "rabby",
      name: "Rabby",
      icon: rabby_wallet,
      getProvider: async () => window.ethereum?.isRabby ? window.ethereum : null,
    },
    {
      id: "phantom",
      name: "Phantom",
      icon: "https://187760183-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-MVOiF6Zqit57q_hxJYp%2Fuploads%2FHEjleywo9QOnfYebBPCZ%2FPhantom_SVG_Icon.svg?alt=media&token=71b80a0a-def7-4f98-ae70-5e0843fdaaec",
      getProvider: async () => window.phantom?.ethereum || (window.ethereum?.isPhantom ? window.ethereum : null),
    },
  ];

  // Helper functions
  const getStoredItem = (key) => localStorage.getItem(STORAGE_KEYS[key]);
  const setStoredItem = (key, value) => localStorage.setItem(STORAGE_KEYS[key], value);
  const clearStoredItems = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  };

  const getAuthHeaders = () => ({
    headers: {
      Authorization: getStoredItem("TOKEN")
    }
  });

  // Sign message handler - simplified with early returns and better error handling
  const handleSignMessage = async (publicAddress, nonce, provider) => {
    try {
      const web3 = new Web3(provider);
      
      // Get account information
      const { data: accountResponse } = await axios.get(
        `${API_HOST}/user/info/${publicAddress}`
      );
      
      if (!accountResponse?.data?.[0]) {
        throw new Error("Could not retrieve account information");
      }
      
      // Determine message based on registration status
      const isRegistered = Boolean(accountResponse.data[0].registered);
      
      const msg = isRegistered 
        ? `Please sign nonce ${nonce} to authenticate account ownership.` 
        : `${nonce}
      
    By signing this message and playing with the MindRune Plugin with the registration key provided to you, you agree to the following terms:

    Granting Permission for Data Use:
    You hereby grant MindRune.xyz permission to access, store, and use any data you submit through the registration key. This includes but is not limited to your Ethereum address, registration information, and any other associated data submitted during the registration process.

    Use of Submitted Data:
    You acknowledge that the data you submit may be used by us for purposes related to the registration process, user management, or providing services related to our application, including analytics, communication, and improving the platform's functionality. We may also use the data to personalize your experience or for other purposes as described in our Privacy Policy.

    No Expiry on Registration Key:
    The registration key issued to you is valid indefinitely, unless explicitly revoked or terminated by us. It is your responsibility to keep this key safe and secure.

    No Refunds or Reversals:
    Once the message is signed and the registration key is issued, it is non-reversible. You cannot undo or withdraw the registration after submitting it, as transactions are final and immutable.

    Security and Privacy:
    We are committed to protecting your privacy. However, you acknowledge and accept that the information submitted may be visible on the blockchain, depending on the platform's settings and public visibility of transactions.

    Limitation of Liability:
    You agree that, to the fullest extent permitted by applicable law, we shall not be held liable for any damage, loss, or risk arising out of your use of the registration key, data submission, or transactions. You understand any token affiliated with MindRune is not an investment vehicle with no speculative value.
    `;
      
      return await web3.eth.personal.sign(
        web3.utils.fromUtf8(msg),
        publicAddress,
        "" // Empty password
      );
    } catch (error) {
      console.error("Signing error:", error);
      throw error;
    }
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

  // Setup event listeners for wallet providers
  const setupWalletListeners = async (provider) => {
    if (!provider) return;
    
    // Remove any existing listeners to prevent duplicates
    provider.removeAllListeners?.("accountsChanged");
    provider.removeAllListeners?.("chainChanged");
    
    // Add new listeners
    provider.on("accountsChanged", async (newAccounts) => {
      if (newAccounts.length > 0) {
        // Clear existing account data when account changes
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
        
        // Force a new authentication flow for the new account
        const walletId = getStoredItem("WALLET_PROVIDER");
        const walletConfig = walletConfigs.find(w => w.id === walletId);
        if (walletConfig) {
          await handleConnect(walletConfig);
        }
      } else {
        // User disconnected their wallet
        handleDisconnect();
      }
    });

    provider.on("chainChanged", async (newChain) => {
      await changeChain(newChain);
    });
  };

  // Initialization effects
  useEffect(() => {
    const init = async () => {
      checkTokenExpiration();
      await detectWallets();
      await checkConnection();
    };
    
    init();
  }, []);

  // Detect available wallets
  const detectWallets = async () => {
    const wallets = await Promise.all(
      walletConfigs.map(async (wallet) => {
        const provider = await wallet.getProvider();
        return { ...wallet, isInstalled: !!provider };
      })
    );
    
    setAvailableWallets(wallets);
  };

  // Check existing connection
  const checkConnection = async () => {
    try {
      const walletId = getStoredItem("WALLET_PROVIDER");
      const account = getStoredItem("ACCOUNT");
      
      if (walletId && account) {
        const walletConfig = walletConfigs.find(w => w.id === walletId);
        if (walletConfig) {
          const provider = await walletConfig.getProvider();
          if (provider) {
            await setupWalletListeners(provider);
          }
        }
      }
    } catch (error) {
      console.error("Connection check error:", error);
    }
  };

  // Account change handler
  const changeAccounts = async (account, provider) => {
    try {
      setIsLoading(true);
      
      // Register account or get nonce
      const { data: registerResponse } = await axios.post(
        `${API_HOST}/auth/register`,
        { account },
        getAuthHeaders()
      );
      
      if (!registerResponse?.nonce) {
        throw new Error("Failed to get nonce from server");
      }
      
      // Sign message with nonce
      const signedMessage = await handleSignMessage(
        account,
        registerResponse.nonce,
        provider
      );
      
      // Send signature to backend for verification
      const { data: signResponse } = await axios.post(
        `${API_HOST}/auth/sign`,
        { account, signature: signedMessage },
        getAuthHeaders()
      );
      
      if (!signResponse?.success) {
        throw new Error("Signature verification failed");
      }
      
      // Store authentication data
      setStoredItem("TOKEN", signResponse.token);
      setStoredItem("ACCOUNT", account);
      await setAccount(account);
      
      return true;
    } catch (error) {
      console.error("Account authentication error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Chain change handler
  const changeChain = async (chainId) => {
    try {
      const chainName = CHAIN_NAMES[chainId] || "Unsupported Chain";
      setStoredItem("BLOCKCHAIN", chainName);
    } catch (error) {
      console.error("Error changing chain:", error);
    }
  };

  // Connect handler
  const handleConnect = async (walletConfig) => {
    try {
      setIsLoading(true);
      const provider = await walletConfig.getProvider();

      if (!provider?.request) {
        // Wallet not installed - open download page
        window.open(WALLET_DOWNLOAD_URLS[walletConfig.id], "_blank");
        return;
      }
      
      // Request accounts and chain ID
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const chainId = await provider.request({ method: "eth_chainId" });
      
      if (accounts.length > 0) {
        // Save wallet info
        setStoredItem("WALLET_PROVIDER", walletConfig.id);
        
        // Setup listeners for this provider
        await setupWalletListeners(provider);
        
        // Process account and chain
        await changeAccounts(accounts[0], provider);
        await changeChain(chainId);
      }
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    clearStoredItems();
    setAccount(null);
  };

  // Render wallet option
  const renderWalletOption = (wallet) => (
    <Flex
      key={wallet.id}
      onClick={() => {
        handleConnect(wallet);
        onClose();
      }}
      direction="column"
      alignItems="center"
      justifyContent="center"
      p={4}
      mb={3}
      borderRadius="lg"
      cursor="pointer"
      _hover={{ bg: "gray.50" }}
      transition="all 0.2s"
      border="1px solid"
      borderColor="gray.200"
    >
      <Image src={wallet.icon} alt={`${wallet.name} icon`} boxSize="64px" mb={3} />
      <Text fontWeight="bold" mb={1}>{wallet.name}</Text>
      <Text fontSize="sm" color="gray.600" textAlign="center">
        Connect using {wallet.name} wallet
      </Text>
      {availableWallets.find(w => w.id === wallet.id && w.isInstalled) && (
        <Text fontSize="xs" color="green.500" fontWeight="bold" mt={1}>
          Detected
        </Text>
      )}
    </Flex>
  );

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
          aria-label="Disconnect Button"
          bg="red.500"
          ml="10px"
          onClick={handleDisconnect}
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
          Disconnect
        </Button>
      ) : (
        <>
          <Button
            aria-label="Connect Button"
            bg="green.500"
            isLoading={isLoading}
            loadingText="Connecting..."
            onClick={onOpen}
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
            Connect
          </Button>

          <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
            <ModalOverlay backdropFilter="blur(5px)" />
            <ModalContent borderRadius="xl" py={2}>
              <ModalHeader textAlign="center" fontSize="xl">
                Connect Your Wallet
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {walletConfigs.map(renderWalletOption)}
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default ConnectButton;