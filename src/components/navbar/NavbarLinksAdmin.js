import {
  Flex,
  Text,
  Box,
  useBreakpointValue,
  HStack
} from "@chakra-ui/react";
import React, { useState, useContext, useEffect } from "react";
import ConnectButton from "./ConnectButton";
import axios from "axios";
import { AccountContext } from "../../AccountContext";
import GP from "../../..//src/assets/img/$GP.webp";
import OSRSAvatar from "components/OSRSAvatar"; // Import our custom avatar component

export default function HeaderLinks(props) {
  const { secondary } = props;
  const [user_info, setUserInfo] = useState(null);
  const { balance, saved } = useContext(AccountContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const blockchain = localStorage.getItem("blockchain");
  const userAccount = localStorage.getItem("account");
  
  // Responsive values
  const direction = useBreakpointValue({ base: "column", sm: "row" });
  const avatarSize = useBreakpointValue({ base: "32px", md: "40px" });
  const fontSize = useBreakpointValue({ base: "sm", md: "md" });
  const padding = useBreakpointValue({ base: "4px", md: "6px" });
  const margin = useBreakpointValue({ base: "2px", md: "6px" });
  const iconSize = useBreakpointValue({ base: "16px", md: "20px" });
  const spacing = useBreakpointValue({ base: "1", md: "2" });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token && !!userAccount);
    
    async function fetchData() {
      if (!userAccount) return;
      
      try {
        let response = await axios.get(
          `${process.env.REACT_APP_API_HOST}/osrs/scoreboard/${userAccount}`
        );

        if (response.data && response.data.data && response.data.data.length > 0) {
          setUserInfo(response.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // We don't set user_info to null here so previous data isn't lost on error
      }
    }

    fetchData();
  }, [userAccount, saved]);

  return (
    <Flex
      w={{ base: "100%", md: "auto" }}
      mt={{ base: "5px", md: "0px" }}
      alignItems="center"
      flexDirection={direction}
      bg="#202020"
      p={{ base: "6px", md: "10px" }}
      borderRadius="8px"
      boxShadow="md"
      flexWrap={secondary ? { base: "wrap", md: "nowrap" } : "unset"}
    >
      <HStack 
        direction={direction} 
        spacing={spacing} 
        align="center" 
        mb={{ base: direction === "column" ? 2 : 0, sm: 0 }}
        w={{ base: "100%", sm: "auto" }}
      >
        {isAuthenticated && (
          <Box
            _hover={{ cursor: "pointer" }}
            boxShadow="md"
            mr={{ base: "3px", md: "10px" }}
            borderRadius="full"
            overflow="hidden"
            width={avatarSize}
            height={avatarSize}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {/* Replace standard Avatar with our custom OSRSAvatar */}
            <OSRSAvatar 
              account={user_info && user_info.account ? user_info.account : userAccount} 
              size={parseInt(avatarSize)} 
            />
          </Box>
        )}
        
        {isAuthenticated && (
          <Flex
            bg="#333333"
            display="flex"
            borderRadius="30px"
            ms={{ base: "0", sm: "auto" }}
            p={padding}
            align="center"
            me={{ base: "0", sm: margin }}
            opacity="100%"
            mb={{ base: direction === "column" ? 2 : 0, sm: 0 }}
          >
            <Flex
              align="center"
              justify="center"
              bg="#333333"
              h={iconSize}
              w={iconSize}
              borderRadius="30px"
              me="5px"
            >
              <img
                w="100%"
                h="100%"
                src={GP}
                alt='$GP'
              />
            </Flex>
            <Text
              w="max-content"
              color="#FFD700"
              fontSize={fontSize}
              fontWeight="700"
              me={margin}
            >
              {(blockchain === "NeuroWeb Mainnet" ||
                blockchain === "NeuroWeb Testnet") &&
              balance &&
              balance.ERC20 &&
              balance.ERC20[0] &&
              Number(balance.ERC20[0].balance)
                ? (balance.ERC20[0].balance / 1000000000000000000).toFixed(4)
                : (blockchain === "Gnosis Mainnet" ||
                    blockchain === "Chiado Testnet" ||
                    blockchain === "Base Mainnet" ||
                    blockchain === "Base Testnet") &&
                  balance &&
                  balance.trac
                ? (balance.trac / 1000000000000000000).toFixed(4)
                : "0"}
              <Text
                as="span"
                display={{ base: "none", md: "unset" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                {" "}
                $GP
              </Text>
            </Text>
          </Flex>
        )}
        
        {isAuthenticated && (
          <Flex
            bg="#333333"
            display="flex"
            borderRadius="30px"
            ms={{ base: "0", sm: "auto" }}
            p={padding}
            align="center"
            mb={{ base: direction === "column" ? 2 : 0, sm: 0 }}
          >
            <Text
              w="max-content"
              color="#efefef"
              fontSize={fontSize}
              fontWeight="700"
              me={margin}
            >
              {(() => {
                // Get points value, defaulting to 0 if not available
                const points = user_info && user_info.points !== undefined ? user_info.points : 0;
                
                // Format points with K or M suffix based on value
                if (points >= 1000000) {
                  return (points / 1000000).toFixed(1) + "M ";
                } else if (points >= 1000) {
                  return (points / 1000).toFixed(1) + "K ";
                } else {
                  return points + " ";
                }
              })()}
              <Text
                as="span"
                display={{ base: "none", md: "unset" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Points
              </Text>
            </Text>
          </Flex>
        )}
      </HStack>
      
      <ConnectButton />
    </Flex>
  );
}