import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Spinner,
  Text,
  Container,
  SimpleGrid,
  GridItem,
  Icon,
  Flex,
  Heading,
  useBreakpointValue
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { AccountContext } from "../../AccountContext";
import monkeys from "../../..//src/assets/img/monkeys.jpg";
import apiService from "./services/apiService";
import AccountDataComponent from "views/account/components/AccountDataComponent";
import RegistrationKeyComponent from "views/account/components/RegistrationKeyComponent";
import GraphExplorerComponent from "views/account/components/GraphExplorerComponent";
import AIChatComponent from "./components/AIChatComponent";

export default function Account() {
  const [accountData, setAccountData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [userId, setUserId] = useState(null);
  const { account } = useContext(AccountContext);
  const padding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  // Get the current user account from localStorage (set during web3 wallet authentication)
  useEffect(() => {
    if (account) {
      setUserId(account);
    } else {
      // Clear all data when account is disconnected
      setUserId(null);
      setAccountData(null);
      setPlayers([]);
    }
  }, [account]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch user account data from SQL (public endpoint)
        const accountInfo = await apiService.getAccountData(userId);

        // Fetch scoreboard points
        const scoreboard = await apiService.getTotalPoints(userId);

        // Combine account info with points from scoreboard
        const combinedAccountData = {
          ...accountInfo,
          points: scoreboard?.points || 0,
        };

        setAccountData(combinedAccountData);

        // Fetch players data from Neo4j
        const playersData = await apiService.getPlayerData(userId);
        setPlayers(playersData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const selectPlayer = (playerId) => {
    if (selectedPlayerId === playerId) {
      // If clicking the already selected player, deselect it to show all data
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(playerId);
    }
  };

  if (loading && account) {
    return (
      <Container maxW="1200px" p={5} centerContent h="100vh">
        <Flex direction="column" align="center" justify="center" h="100%">
          <Spinner size="xl" thickness="4px" color="#efefef" mb={4} />
          <Text fontSize="xl" color="#efefef">
            Loading account data...
          </Text>
        </Flex>
      </Container>
    );
  }

  if (!account) {
    // Not logged in state with centered styled text
    return (
      <Container
        maxW="100%"
        centerContent
        h="calc(100vh - 55px)"
        backgroundImage={monkeys}
        bgPos="center 15%"
        bgSize="cover"
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          bgColor="rgba(32, 32, 32, 0.85)"
          p={padding}
          borderRadius="xl"
          w={{ base: "90%", sm: "85%", md: "80%", lg: "70%", xl: "1200px" }}
          maxW="1400px"
          m={{ base: "auto", md: "140px auto auto" }}
          minH={{ base: "60vh", md: "600px", lg: "740px" }}
        >
          <Icon as={FaUser} w={20} h={20} color="#efefef" mb={6} />
          <Heading as="h2" size="xl" mb={4} textAlign="center" color="#efefef">
            Account Required
          </Heading>
          <Text fontSize="lg" mb={8} textAlign="center" color="#efefef">
            Please connect your wallet to view your account dashboard and game
            data.
          </Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container
      maxW="100vw"
      p={0}
      backgroundImage={monkeys}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      bgPos="center"
    >
      <Box maxW="80%" mx="auto" px={{ base: 4, md: 6 }} pt="140px">
        {/* Two distinct cards side by side */}
        <SimpleGrid columns={{ base: 1, md: 12 }} spacing={6} mb={4}>
          {/* Left Card - Account & Points Info (Takes 8 of 12 columns) */}
          <GridItem colSpan={{ base: 12, md: 8 }}>
            <AccountDataComponent
              accountData={accountData}
              userId={userId}
              onAccountDataUpdate={(updatedData) => setAccountData(updatedData)}
            />
          </GridItem>

          {/* Right Card - Registration Key (Takes 4 of 12 columns) */}
          <GridItem colSpan={{ base: 12, md: 4 }}>
            <RegistrationKeyComponent />
          </GridItem>
        </SimpleGrid>

        <Box pb={5}>
          <SimpleGrid columns={{ base: 1, md: 12 }} spacing={6}>
            {/* Left Card - Player Selection and Graph Visualization (Takes 8 of 12 columns) */}
            <GridItem colSpan={{ base: 12, md: 8 }}>
              <GraphExplorerComponent
                userId={userId}
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={selectPlayer}
              />
            </GridItem>

            {/* Right Card - AI Chat (Takes 4 of 12 columns) */}
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <AIChatComponent />
            </GridItem>
          </SimpleGrid>
        </Box>
      </Box>
    </Container>
  );
}
