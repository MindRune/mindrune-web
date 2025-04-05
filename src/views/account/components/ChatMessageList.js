import React from "react";
import {
  Box,
  Text,
  Flex,
  Avatar,
  Code,
  VStack,
  Icon,
  Spinner,
  IconButton,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
} from "@chakra-ui/react";
import {
  FaUser,
  FaRobot,
  FaDatabase,
  FaInfoCircle,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { MESSAGE_TYPES } from "../constants/chatConstants";

const ChatMessageList = ({ messages, messagesEndRef, onFeedbackSubmit }) => {
  const renderMessage = (message) => {
    switch (message.type) {
      case MESSAGE_TYPES.USER:
        return (
          <Flex justify="flex-end" mb={4}>
            <Box maxW="70%" bg="blue.500" p={3} borderRadius="lg">
              <Flex align="center" mb={1}>
                <Avatar size="xs" icon={<FaUser />} mr={2} />
                <Text fontWeight="bold" fontSize="sm">
                  You
                </Text>
              </Flex>
              <Text fontSize="md">{message.content}</Text>
            </Box>
          </Flex>
        );

      case MESSAGE_TYPES.AI:
        return (
          <Flex mb={4} direction="column">
            <Box maxW="70%" bg="gray.700" p={3} borderRadius="lg">
              <Flex align="center" mb={1}>
                <Avatar size="xs" icon={<FaRobot />} mr={2} bg="blue.500" />
                <Text fontWeight="bold" fontSize="sm">
                  MindRune
                </Text>

                {/* Cypher query icon with hover popover - only shown if there's an associated query */}
                {message.query && (
                  <Popover placement="top-start" trigger="hover">
                    <PopoverTrigger>
                      <IconButton
                        icon={<FaDatabase />}
                        size="xs"
                        ml={2}
                        variant="ghost"
                        aria-label="View Cypher Query"
                        _hover={{ bg: "blue.800" }}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      bg="gray.800"
                      borderColor="gray.600"
                      maxW="500px"
                    >
                      <PopoverArrow bg="gray.800" />
                      <PopoverBody p={0}>
                        <Box p={2}>
                          <Text fontSize="xs" color="gray.400" mb={1}>
                            Generated Cypher Query
                          </Text>
                          <Code
                            p={2}
                            borderRadius="md"
                            variant="subtle"
                            colorScheme="gray"
                            fontSize="xs"
                            whiteSpace="pre-wrap"
                            overflowX="auto"
                            w="100%"
                          >
                            {message.query}
                          </Code>
                        </Box>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                )}
              </Flex>
              <Text fontSize="md" whiteSpace="pre-wrap">
                {message.content}
              </Text>
            </Box>

            {/* Feedback buttons */}
            {message.wasHelpful === null && (
              <Flex mt={1} ml={2}>
                <Tooltip label="This was helpful" placement="top">
                  <IconButton
                    icon={<FaThumbsUp />}
                    size="xs"
                    variant="ghost"
                    colorScheme={message.feedback === true ? "green" : "gray"}
                    mr={1}
                    onClick={() => onFeedbackSubmit(message.id, true)}
                    isDisabled={message.feedback !== undefined}
                    _hover={{ bg: "green.800" }}
                  />
                </Tooltip>
                <Tooltip label="This wasn't helpful" placement="top">
                  <IconButton
                    icon={<FaThumbsDown />}
                    size="xs"
                    variant="ghost"
                    colorScheme={message.feedback === false ? "red" : "gray"}
                    onClick={() => onFeedbackSubmit(message.id, false)}
                    isDisabled={message.feedback !== undefined}
                    _hover={{ bg: "red.800" }}
                  />
                </Tooltip>
              </Flex>
            )}
          </Flex>
        );

      case MESSAGE_TYPES.SYSTEM:
        return (
          <Flex justify="center" mb={4}>
            <Box bg="gray.800" p={2} borderRadius="md" maxW="80%">
              <Flex align="center">
                {message.content === "Thinking..." ? (
                  <Spinner size="xs" mr={2} />
                ) : (
                  <Icon as={FaInfoCircle} mr={2} />
                )}
                <Text fontSize="sm" color="gray.300">
                  {message.content}
                </Text>
              </Flex>
            </Box>
          </Flex>
        );

      // We no longer render QUERY messages directly
      case MESSAGE_TYPES.QUERY:
        return null;

      default:
        return null;
    }
  };

  // Filter out query messages since we're showing them in hovers
  const filteredMessages = messages.filter(
    (message) => message.type !== MESSAGE_TYPES.QUERY
  );

  return (
    <VStack align="stretch" spacing={0} w="100%">
      {filteredMessages.map((message) => (
        <Box key={message.id}>{renderMessage(message)}</Box>
      ))}
      <div ref={messagesEndRef} />
    </VStack>
  );
};

export default ChatMessageList;
