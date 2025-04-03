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
  // Render different message types
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
                  Eliza
                </Text>
              </Flex>
              <Text fontSize="md" whiteSpace="pre-wrap">
                {message.content}
              </Text>
            </Box>

            {/* Feedback buttons */}
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

      case MESSAGE_TYPES.QUERY:
        return (
          <Flex justify="center" mb={4}>
            <Box bg="gray.800" p={3} borderRadius="md" maxW="90%">
              <Flex align="center" mb={1}>
                <Icon as={FaDatabase} mr={2} color="gray.400" />
                <Text fontSize="xs" color="gray.400">
                  Generated Cypher Query
                </Text>
              </Flex>
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
                {message.content}
              </Code>
            </Box>
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" spacing={0} w="100%">
      {messages.map((message, index) => (
        <Box key={index}>{renderMessage(message)}</Box>
      ))}
      <div ref={messagesEndRef} />
    </VStack>
  );
};

export default ChatMessageList;
