import {
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  IconButton,
  Select,
  Box,
  Icon,
  Input,
  useBreakpointValue,
  HStack,
  VStack,
  useMediaQuery,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

import {
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
} from "react-icons/fa";

import { MdSearch } from "react-icons/md";
import { columnsDataComplex } from "views/scoreboard/variables/columnsData";
import OSRSAvatar from "components/OSRSAvatar";

export default function ScoreTable(props) {
  const { player_profiles, scoreboard_data, setPlayerFilter } = props;
  const columns = useMemo(() => columnsDataComplex, []);
  let data = useMemo(() => scoreboard_data, [scoreboard_data]);
  
  // Media query hooks for responsive design
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [isLargerThan480] = useMediaQuery("(min-width: 480px)");
  
  // Responsive values based on screen size
  const containerWidth = useBreakpointValue({ 
    base: "95%", 
    sm: "90%", 
    md: "80%", 
    lg: "70%", 
    xl: "60%" 
  });
  
  const containerPadding = useBreakpointValue({ 
    base: "10px", 
    sm: "20px", 
    md: "30px", 
    lg: "50px" 
  });
  
  const tablePadding = useBreakpointValue({ 
    base: "5px", 
    sm: "10px", 
    md: "20px", 
    lg: "50px" 
  });
  
  const avatarSize = useBreakpointValue({ 
    base: 25, 
    sm: 30, 
    md: 35 
  });

  // Pre-compute responsive values for column widths
  const profileImgWidth = useBreakpointValue({ base: "70px", sm: "90px", md: "110px" });
  const playerWidth = useBreakpointValue({ base: "120px", sm: "200px", md: "250px", lg: "350px" });
  const pointsWidth = useBreakpointValue({ base: "80px", sm: "100px", md: "120px" });
  
  // Define column widths using the pre-computed values
  const getColumnWidth = (header) => {
    switch (header) {
      case "PROFILE_IMG":
        return profileImgWidth;
      case "PLAYER":
        return playerWidth;
      case "POINTS":
        return pointsWidth;
      default:
        return "auto";
    }
  };

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 50,
        sortBy: [
          {
            id: "points",
            desc: true,
          },
        ],
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;

  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const getPlayerProfile = (account) => {
    if (!player_profiles) return null;
    return player_profiles.find((obj) => obj.account === account);
  };

  const getPlayerAlias = (account) => {
    const profile = getPlayerProfile(account);
    if (profile && profile.alias) {
      return profile.alias;
    } else {
      // If no alias exists, show first 10 and last 10 characters of the address
      // For mobile, show fewer characters
      if (account && account.length > 20) {
        if (!isLargerThan480) {
          return `${account.substring(0, 5)}...${account.substring(account.length - 5)}`;
        }
        return `${account.substring(0, 10)}...${account.substring(account.length - 10)}`;
      }
      return account;
    }
  };

  const searchPlayer = (player_input) => {
    if (!player_input || player_input.trim() === "") {
      setPlayerFilter(null); // Reset to null instead of setting to the entire dataset
      return;
    }

    const player_input_lower = player_input.toLowerCase().trim();
    const matchedPlayer = scoreboard_data.find((player) => {
      const playerAccount = player.account.toLowerCase();
      const alias = player.alias ? player.alias.toLowerCase() : "";

      return (
        playerAccount.includes(player_input_lower) ||
        (alias && alias.includes(player_input_lower))
      );
    });

    if (matchedPlayer) {
      setPlayerFilter(matchedPlayer);
    }
  };

  function formatNumberWithSpaces(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    data && (
      <Flex justify="center" align="center" w="100%" h="100%" pt={{ base: "160px", md: "120px", lg: "140px" }}>
        <Box
          direction="column"
          w={containerWidth}
          h={{ base: "80vh", md: "740px" }}
          mb="20px"
          overflowX={{ base: "hidden", sm: "hidden", lg: "hidden" }}
          position="relative"
          bgColor="rgba(32, 32, 32, 0.85)"
          pt={{ base: "15px", md: "30px" }}
          borderRadius="8px"
        >
          <Flex 
            px={{ base: "10px", md: "16px" }} 
            justify="flex-end" 
            mb={{ base: "10px", md: "20px" }} 
            w="100%"
            flexDir={{ base: "column", sm: "row" }}
            alignItems={{ base: "flex-start", sm: "center" }}
          >
            <Flex 
              maxW={{ base: "100%", sm: "300px" }}
              w={{ base: "100%", sm: "auto" }}
            >
              <Icon
                transition="0.2s linear"
                w={{ base: "24px", md: "30px" }}
                h={{ base: "24px", md: "30px" }}
                mr="5px"
                as={MdSearch}
                color="#efefef"
                _hover={{ cursor: "pointer" }}
                _active={{ borderColor: "#202020" }}
                _focus={{ bg: "#202020" }}
                onClick={() => {
                  const inputValue = document.getElementById("playerInput").value;
                  searchPlayer(inputValue);
                }}
              />
              <Input
                h={{ base: "24px", md: "30px" }}
                focusBorderColor="#efefef"
                id="playerInput"
                placeholder="Player Lookup..."
                color="#efefef"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchPlayer(e.target.value);
                  }
                }}
              ></Input>
            </Flex>
          </Flex>
          <Box
            overflowY="auto"
            overflowX="auto"
            maxHeight={{ base: "calc(70vh - 120px)", md: "610px" }}
            px={tablePadding}
            sx={{
              "& table": {
                tableLayout: "fixed",
                width: { base: "100%", md: "90%" },
              },
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0, 0, 0, 0.1)",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
              },
            }}
          >
            <Table
              {...getTableProps()}
              variant="simple"
              color="gray.500"
              mb="24px"
              tableLayout="fixed"
              width={{ base: "100%", md: "90%" }}
              mx="auto"
              size={{ base: "sm", md: "md" }}
            >
              <Thead>
                {headerGroups.map((headerGroup, index) => (
                  <Tr {...headerGroup.getHeaderGroupProps()} key={index}>
                    {headerGroup.headers.map((column, index) => (
                      <Th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        pe={column.Header === "POINTS" ? { base: "10px", md: "30px" } : { base: "5px", md: "10px" }}
                        key={index}
                        borderColor={borderColor}
                        width={getColumnWidth(column.Header)}
                      >
                        <Flex
                          justify={column.Header === "POINTS" ? "flex-end" : "flex-start"}
                          align="center"
                          fontSize={{ base: "8px", sm: "10px", lg: "12px" }}
                          color="gray.400"
                          pr={column.Header === "POINTS" ? { base: "10px", md: "30px" } : "0px"}
                        >
                          {column.Header !== "PROFILE_IMG" &&
                            column.Header !== "ALIAS" &&
                            column.render("Header")}
                        </Flex>
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {page.map((row, index) => {
                  prepareRow(row);

                  let player = row.cells
                    .filter((cell) => cell.column.Header === "PLAYER")
                    .map((cell) => cell.value)[0];

                  // Calculate rank directly here based on current page and index
                  let currentRank = pageIndex * pageSize + index + 1;

                  return (
                    <Tr {...row.getRowProps()} key={index}>
                      {row.cells.map((cell, index) => {
                        let data = "";

                        if (cell.column.Header === "PROFILE_IMG") {
                          // Ensure we have a unique account value
                          const accountValue = cell.value || `player-${currentRank}`;

                          data = (
                            <Flex align="center">
                              {/* Rank number */}
                              <Flex
                                align="center"
                                justify="center"
                                h={{ base: "20px", md: "29px" }}
                                w={{ base: "20px", md: "29px" }}
                                borderRadius="30px"
                                me={{ base: "3px", md: "7px" }}
                              >
                                <Text
                                  color="#efefef"
                                  fontSize={{ base: "xs", md: "md" }}
                                  fontWeight="700"
                                  mr={{ base: "5px", md: "10px" }}
                                  ml={{ base: "5px", md: "10px" }}
                                >
                                  {currentRank}
                                </Text>
                              </Flex>

                              {/* Use a keyed wrapper to force re-renders */}
                              <Box key={`avatar-wrapper-${accountValue}-${currentRank}`}>
                                <OSRSAvatar account={player} size={avatarSize} />
                              </Box>
                            </Flex>
                          );
                        } else if (cell.column.Header === "PLAYER") {
                          const playerAlias = getPlayerAlias(cell.value);
                          data = (
                            <Text
                              color="#efefef"
                              fontSize={{ base: "xs", sm: "sm", md: "md" }}
                              fontWeight="700"
                              isTruncated
                              pl={{ base: "2px", sm: "5px", md: "10px" }}
                            >
                              {playerAlias}
                            </Text>
                          );
                        } else if (cell.column.Header === "POINTS") {
                          data = (
                            <Text
                              color="#efefef"
                              fontSize={{ base: "xs", sm: "sm", md: "md" }}
                              fontWeight="700"
                              textAlign="right"
                              pr={{ base: "10px", md: "30px" }}
                            >
                              {`${formatNumberWithSpaces(cell.value)}`}
                            </Text>
                          );
                        }
                        return (
                          <Td
                            {...cell.getCellProps()}
                            key={index}
                            fontSize={{ base: "xs", sm: "sm", md: "md" }}
                            maxH="30px !important"
                            py={{ base: "4px", md: "8px" }}
                            width={getColumnWidth(cell.column.Header)}
                            maxW={getColumnWidth(cell.column.Header)}
                            borderColor="transparent"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                          >
                            {data}
                          </Td>
                        );
                      })}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
          <Flex
            justify="space-between"
            align="center"
            px={{ base: "10px", sm: "20px", md: "50px" }}
            position="absolute"
            bottom={{ base: "10px", md: "15px" }}
            bg="none"
            zIndex="10"
            w="100%"
            py="3"
            flexDir={{ base: "column", sm: "row" }}
            gap={{ base: "10px", sm: "0" }}
          >
            <HStack spacing={{ base: "2px", md: "8px" }}>
              <IconButton
                aria-label="First page"
                onClick={() => gotoPage(0)}
                isDisabled={!canPreviousPage}
                icon={<FaAngleDoubleLeft />}
                bg="#202020"
                color="#efefef"
                border="1px"
                borderColor="#efefef"
                _hover={{ bg: "#202020" }}
                _active={{ bg: "#202020" }}
                size={{ base: "xs", md: "md" }}
              />
              <IconButton
                aria-label="Previous page"
                onClick={() => previousPage()}
                isDisabled={!canPreviousPage}
                icon={<FaAngleLeft />}
                bg="#333333"
                color="#efefef"
                border="1px"
                borderColor="#efefef"
                _hover={{ bg: "#202020" }}
                _active={{ bg: "#202020" }}
                size={{ base: "xs", md: "md" }}
              />
              <Text color="#efefef" fontSize={{ base: "xs", md: "lg" }}>
                {isLargerThan480 ? 
                  `Page ${pageIndex + 1} of ${pageOptions.length}` : 
                  `${pageIndex + 1}/${pageOptions.length}`}
              </Text>
              <IconButton
                aria-label="Next page"
                onClick={() => nextPage()}
                isDisabled={!canNextPage}
                icon={<FaAngleRight />}
                bg="#333333"
                color="#efefef"
                border="1px"
                borderColor="#efefef"
                _hover={{ bg: "#202020" }}
                _active={{ bg: "#202020" }}
                size={{ base: "xs", md: "md" }}
              />
              <IconButton
                aria-label="Last page"
                onClick={() => gotoPage(pageCount - 1)}
                isDisabled={!canNextPage}
                icon={<FaAngleDoubleRight />}
                bg="#333333"
                color="#efefef"
                border="1px"
                borderColor="#efefef"
                _hover={{ bg: "#202020" }}
                _active={{ bg: "#202020" }}
                size={{ base: "xs", md: "md" }}
              />
            </HStack>
            <Select
              w={{ base: "60px", md: "75px" }}
              size={{ base: "xs", md: "md" }}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              bg="none"
              _hover={{ bg: "#202020" }}
              border="1px"
              borderColor="#efefef"
              color="#efefef"
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size} color="#333333">
                  {size}
                </option>
              ))}
            </Select>
          </Flex>
        </Box>
      </Flex>
    )
  );
}