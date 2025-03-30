import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Flex,
  Heading,
  Card,
  CardBody,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { Filter } from "glin-profanity";
import apiService from "../services/apiService";

// Helper function for number formatting
function formatNumberWithSpaces(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const AccountDataComponent = ({ accountData, userId, onAccountDataUpdate }) => {
  const [newAlias, setNewAlias] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Update newAlias when accountData changes
  useEffect(() => {
    if (accountData?.alias) {
      setNewAlias(accountData.alias);
    }
  }, [accountData]);

  // Profanity check for alias
  const containsProfanity = (text) => {
    try {
      // Create a new Filter instance and use it to check the text
      const filter = new Filter();
      return filter.isProfane(text);
    } catch (error) {
      // Fallback to simplified implementation
      const lowercaseText = text.toLowerCase();
      const profanityList = ["badword1", "badword2"]; // Replace with your actual list

      return profanityList.some((word) => {
        if (lowercaseText.includes(word)) {
          return true;
        }
        try {
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = new RegExp(`\\b${escapedWord}\\b`);
          return pattern.test(lowercaseText);
        } catch (error) {
          console.error(`Error with regex for word: ${word}`, error);
          return lowercaseText.includes(word);
        }
      });
    }
  };

  const handleUpdateAlias = async () => {
    if (!newAlias.trim()) {
      toast({
        title: "Invalid alias",
        description: "Please enter a valid alias",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check for profanity
    if (containsProfanity(newAlias)) {
      toast({
        title: "Inappropriate alias",
        description:
          "Please choose an appropriate name without offensive language",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await apiService.updateAccount(userId, newAlias);

      // Update local state through parent component
      const updatedData = {
        ...accountData,
        alias: newAlias,
      };
      onAccountDataUpdate(updatedData);

      toast({
        title: "Alias updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error("Error updating alias:", error);
      toast({
        title: "Error updating alias",
        description: error.response?.data?.msg || "Please try again later",
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
      boxShadow="lg"
      overflow="hidden"
      h="125px"
      minH="125px"
      maxH="150px"
      color="#efefef"
      mt={{ base: "20px", md: 0 }} // Added 20px top margin on mobile for nav bar space
    >
      <CardBody py={{ base: 4, md: 3 }}>
        <Flex
          h="100%"
          direction="row"
          align="center"
          justify="space-between"
          mt={{ base: 0, md: "-10px" }}
          flexWrap={{ base: "wrap", md: "nowrap" }}
        >
          <Flex
            align="center"
            direction="row"
            textAlign="left"
            width={{ base: "100%", md: "auto" }}
            mb={{ base: 3, md: 0 }}
          >
            <Box
              borderRadius="full"
              overflow="hidden"
              border="4px solid #202020"
              mr={{ base: 2, sm: 4 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="md"
              flexShrink={0}
              mt="auto"
              mb="auto"
            >
              <Avatar src={accountData.img} alt="profile" w="75px" h="75px"/>
            </Box>

            <Heading
              as="h2"
              size={{ base: "md", md: "lg" }}
              mr={2}
              fontSize={{ base: "22px", sm: "30px", md: "40px", lg: "50px" }}
              lineHeight="1.2"
            >
              {accountData?.alias ||
                `${userId?.substring(0, 6)}...${userId?.substring(
                  userId.length - 6
                )}`}
            </Heading>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default AccountDataComponent;
