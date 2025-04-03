import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Text,
  Heading,
  Flex,
  Icon,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FaBrain, FaArrowUp, FaUserAlt, FaUsers } from "react-icons/fa";
import { MESSAGE_TYPES } from "../constants/chatConstants";
import apiService from "../services/apiService";
import ChatMessageList from "./ChatMessageList";
import { v4 as uuidv4 } from "uuid"; // You'll need to install this package

const AIChatComponent = ({ userId, players, selectedPlayerId }) => {
  const [messages, setMessages] = useState([
    {
      id: uuidv4(),
      type: MESSAGE_TYPES.AI,
      content:
        "Hello! I'm MindRune AI. How can I help with your gameplay today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promptIds, setPromptIds] = useState({}); // Store mapping between message IDs and prompt UUIDs
  const messagesEndRef = useRef(null);
  const toast = useToast();

  // Get the selected player's name when selectedPlayerId changes
  const selectedPlayer = players.find(
    (player) => player.id === selectedPlayerId
  );
  const selectedPlayerName = selectedPlayer?.name;

  // Auto scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      type: MESSAGE_TYPES.USER,
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Add thinking message
      const thinkingMessageId = uuidv4();
      setMessages((prev) => [
        ...prev,
        {
          id: thinkingMessageId,
          type: MESSAGE_TYPES.SYSTEM,
          content: "Thinking...",
          timestamp: new Date(),
        },
      ]);

      // Prepare the payload with account ID
      const payload = {
        message: userMessage.content,
        account: userId,
        context: {},
      };

      // Only include player data if a player is selected
      if (selectedPlayerId) {
        payload.playerId = selectedPlayerId;
        payload.playerName = selectedPlayerName;
      }

      // Prepare request to agent endpoint
      const response = await apiService.processAgentMessage(payload);

      // Extract the data from the response
      const data = response.data || response;

      // Get the AI response
      const aiResponse = data.response || "I couldn't process your request.";

      // Get the promptUuid from the response
      const promptUuid = data.promptUuid || null;

      // Get the cypherQuery directly from the response
      const cypherQuery = data.cypherQuery || null;

      const aiMessageId = uuidv4();

      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingMessageId));

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          type: MESSAGE_TYPES.AI,
          content: aiResponse,
          timestamp: new Date(),
        },
      ]);

      // Store the mapping between message ID and prompt UUID if available
      if (promptUuid) {
        setPromptIds((prev) => ({
          ...prev,
          [aiMessageId]: promptUuid,
        }));
      }

      // If we have a Cypher query, add it as a message
      if (cypherQuery) {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            type: MESSAGE_TYPES.QUERY,
            content: cypherQuery,
            timestamp: new Date(),
          },
        ]);
      }

      // If we don't have a direct cypherQuery but have intermediateSteps or queryTrace,
      // try to extract the query from there
      else if (data.queryTrace || data.intermediateSteps) {
        const steps = data.queryTrace || data.intermediateSteps;
        let extractedQuery = null;

        // Look for Cypher queries in intermediate steps
        for (const step of steps) {
          if (
            step.action &&
            step.action.tool === "Neo4jGameDatabase" &&
            step.action.toolInput
          ) {
            try {
              const toolInput =
                typeof step.action.toolInput === "string"
                  ? JSON.parse(step.action.toolInput)
                  : step.action.toolInput;

              if (toolInput.query && typeof toolInput.query === "string") {
                extractedQuery = toolInput.query;
                // If there are multiple queries, take the last one
              }
            } catch (e) {
              console.warn("Failed to parse tool input", e);
            }
          }
        }

        // If we found a Cypher query, add it as a message
        if (extractedQuery) {
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              type: MESSAGE_TYPES.QUERY,
              content: extractedQuery,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error in chat flow:", error);

      // Remove thinking message and add error message
      setMessages((prev) => [
        ...prev.filter((msg) => msg.type !== MESSAGE_TYPES.SYSTEM),
        {
          id: uuidv4(),
          type: MESSAGE_TYPES.SYSTEM,
          content:
            "I'm sorry, I encountered an error while processing your request.",
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleFeedbackSubmit function for your AIChatComponent
  const handleFeedbackSubmit = async (messageId, wasHelpful) => {
    // Find the prompt UUID associated with this message
    const promptUuid = promptIds[messageId];
    const message = messages.find((msg) => msg.id === messageId);

    if (!message) {
      console.error("Message not found");
      toast({
        title: "Feedback Error",
        description: "Unable to submit feedback for this message.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Get the user query that preceded this AI message
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      let userQuery = "";

      // Look for the preceding user message
      if (messageIndex > 0) {
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (messages[i].type === MESSAGE_TYPES.USER) {
            userQuery = messages[i].content;
            break;
          }
        }
      }

      // Submit feedback to the API with the message content
      await apiService.learnFromFeedback(
        promptUuid || messageId, // Use the promptUuid if available, otherwise use messageId as fallback
        wasHelpful,
        userQuery,
        message.content
      );

      // Update the message to show selected feedback
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: wasHelpful } : msg
        )
      );

      toast({
        title: "Feedback Submitted",
        description: `Thank you for your feedback! ${
          wasHelpful
            ? "I'm glad that was helpful."
            : "I'll try to do better next time."
        }`,
        status: wasHelpful ? "success" : "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Feedback Error",
        description: "Unable to submit your feedback. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Card
      bgColor="rgba(32, 32, 32, 0.85)"
      borderRadius="xl"
      overflow="hidden"
      shadow="md"
      height="600px"
      display="flex"
      flexDirection="column"
      color="#efefef"
    >
      <CardHeader>
        <Flex justify="space-between" align="center">
          <Heading size="md">MindRune AI</Heading>
          <Flex align="center">
            <Icon as={FaBrain} color="blue.400" mr={2} />
            <Text fontSize="sm" color="blue.200">
              {selectedPlayerId
                ? `Character mode: ${
                    selectedPlayerName || "Selected character"
                  }`
                : "Account-wide mode"}
            </Text>
          </Flex>
        </Flex>
      </CardHeader>

      <CardBody
        flex="1"
        display="flex"
        flexDirection="column"
        overflowY="auto"
        px={4}
      >
        <ChatMessageList
          messages={messages}
          messagesEndRef={messagesEndRef}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      </CardBody>

      <Box p={4} bgColor="#202020" mb="20px" mr="5%" ml="5%" borderRadius="8px">
        <Flex>
          <Input
            placeholder={
              selectedPlayerId
                ? `Ask about ${selectedPlayerName || "your character"}...`
                : "Ask about your account..."
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            isDisabled={isLoading}
            mr={2}
            color="white"
          />
          <Button
            colorScheme="green"
            onClick={handleSendMessage}
            isDisabled={isLoading || !inputValue.trim()}
            px={6}
          >
            {isLoading ? <Spinner size="sm" /> : <FaArrowUp />}
          </Button>
        </Flex>
      </Box>
    </Card>
  );
};

export default AIChatComponent;
