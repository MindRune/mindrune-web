// In your Settings.js component
import {
  Box,
  Flex,
  Stack,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { useState, useEffect, useContext, useMemo } from "react";
import Scoreboard from "views/scoreboard/components/Scoreboard";
import { columnsDataComplex } from "views/scoreboard/variables/columnsData";
import axios from "axios";
import { AccountContext } from "../../AccountContext";
import boats from "../../..//src/assets/img/boats.jpg";

export default function Settings() {
  const [player_profiles, setPlayerProfiles] = useState(null);
  const [scoreboard_data, setScoreboardData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useContext(AccountContext);

  // Fetch data only when component mounts or account changes
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        let scoreboard = await axios.get(
          `${process.env.REACT_APP_API_HOST}/osrs/scoreboard`
        );
        let players = await axios.get(
          `${process.env.REACT_APP_API_HOST}/user/info`
        );
        
        const scoreboardData = scoreboard.data.data;
        setScoreboardData(scoreboardData);
        setFilteredData(scoreboardData); // Initialize filtered data with all data
        setPlayerProfiles(players.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [account]);

  // Handle player filtering locally without API refetch
  const handlePlayerFilter = (filter) => {
    if (!filter) {
      // Reset to show all data
      setFilteredData(scoreboard_data);
    } else {
      // Filter to show specific player
      setFilteredData([filter]);
    }
  };

  return (
    <Box w="100%" h="100%">
      {!isLoading && filteredData ? (
        <Box
          backgroundImage={boats}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        >
          <Scoreboard
            columnsData={columnsDataComplex}
            scoreboard_data={filteredData}
            player_profiles={player_profiles}
            setPlayerFilter={handlePlayerFilter}
          />
        </Box>
      ) : (
        <Flex justify="center" align="center" h="100%">
          <Stack spacing={4} align="center">
            <Spinner
              thickness="6px"
              speed="0.65s"
              emptyColor="gray.200"
              color="#efefef"
              size="xl"
            />
            <Text fontSize="md" color="#efefef">
              Loading Player Scores...
            </Text>
          </Stack>
        </Flex>
      )}
    </Box>
  );
}