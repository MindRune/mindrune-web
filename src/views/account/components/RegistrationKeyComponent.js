import React from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  Card,
  CardBody,
  useToast,
} from "@chakra-ui/react";
import { FaCopy } from "react-icons/fa";
import apiService from "../services/apiService";

const RegistrationKeyComponent = () => {
  const toast = useToast();

  const copyRegistrationKey = async () => {
    try {
      const token = await apiService.getRegistrationKey();
      if (token) {
        navigator.clipboard.writeText(token);
        toast({
          title: "Registration key copied!",
          description: "Use this key to connect your MindRune client",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
      }
    } catch (error) {
      console.error("Error getting registration key:", error);
      toast({
        title: "Error getting registration key",
        description: "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Card
      bgColor="rgba(32, 32, 32, 0.85)"
      borderRadius="xl"
      boxShadow="lg"
      overflow="hidden"
      h="125px"
      maxH="150px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <CardBody width="100%" py={4} px={4}>
        <Box
          p={3}
          borderRadius="lg"
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          bgColor="#202020"
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={3}
            height="100%"
          >
            <Text
              fontWeight="bold"
              fontSize="xl"
              textAlign="center"
              color="#efefef"
            >
              MindRune Registration Key
            </Text>

            <Button
              leftIcon={<FaCopy />}
              bgColor="#FFD700"
              onClick={copyRegistrationKey}
              size="md"
              width="100%"
              fontWeight="bold"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "md",
              }}
              transition="all 0.2s"
            >
              Copy Key
            </Button>
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
};

export default RegistrationKeyComponent;