import React from "react";

import {
  Box,
  Button,
  Flex,
  Text,
  Heading,
  List,
  ListItem,
  Badge,
  Divider,
  Card,
  CardBody,
  useColorModeValue,
} from "@chakra-ui/react";

import { FaKhanda } from "react-icons/fa";

import Neo4jGraph from "./Neo4jGraph";

const GraphExplorerComponent = ({
  userId,

  players,

  selectedPlayerId,

  onSelectPlayer,
}) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Card
      bgColor="rgba(32, 32, 32, 0.85)"
      borderRadius="xl"
      overflow="hidden"
      shadow="md"
    >
      <CardBody p={0}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="stretch"
          height="600px"
        >
          {/* Player selection sidebar */}

          <Box
            width={{ base: "100%", lg: "250px" }}
            p={4}
            borderRight={{ base: "none", lg: "1px" }}
            borderBottom={{ base: "1px", lg: "none" }}
            borderColor={borderColor}
            overflowY="auto"
          >
            <Heading as="h3" size="md" mb={4} color="#efefef">
              Your Characters
            </Heading>

            <List spacing={2}>
              <ListItem>
                <Button
                  leftIcon={<FaKhanda />}
                  colorScheme={selectedPlayerId === null ? "#202020" : "gray"}
                  variant={selectedPlayerId === null ? "solid" : "ghost"}
                  size="md"
                  width="100%"
                  justifyContent="flex-start"
                  borderRadius="md"
                  onClick={() => onSelectPlayer(null)}
                  _hover={{
                    bg: selectedPlayerId === null ? "#202020" : "#202020",
                  }}
                  color="#efefef"
                >
                  All Characters
                </Button>
              </ListItem>

              <Divider my={3} />

              {players.length > 0 ? (
                players.map((player) => (
                  <ListItem key={player.id}>
                    <Button
                      leftIcon={<FaKhanda color="#efefef" />}
                      colorScheme={
                        selectedPlayerId === player.id ? "#202020" : "gray"
                      }
                      variant={
                        selectedPlayerId === player.id ? "solid" : "ghost"
                      }
                      size="md"
                      width="100%"
                      justifyContent="flex-start"
                      borderRadius="md"
                      onClick={() => onSelectPlayer(player.id)}
                      _hover={{
                        bg:
                          selectedPlayerId === player.id
                            ? "#202020"
                            : "#202020",
                      }}
                      _active={{
                        bg:
                          selectedPlayerId === player.id
                            ? "#202020"
                            : "#202020",
                      }}
                    >
                      <Flex justify="space-between" width="100%" align="center">
                        <Text color="#efefef">{player.name}</Text>

                        {player.combatLevel && (
                          <Badge ml={2} colorScheme="green">
                            Lvl {player.combatLevel}
                          </Badge>
                        )}
                      </Flex>
                    </Button>
                  </ListItem>
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <Text color={secondaryTextColor}>No players found</Text>
                </Box>
              )}
            </List>
          </Box>

          {/* Graph visualization */}

          <Box flex="1" height="100%">
            <Neo4jGraph
              userId={userId}
              playerId={selectedPlayerId}
              maxW="100%"
            />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default GraphExplorerComponent;
