import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  Heading,
  Icon,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { FaEdit, FaMedal } from "react-icons/fa";
import { Filter } from "glin-profanity";
import OSRSAvatar from "components/OSRSAvatar";
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
              width="65px"
              height="65px"
              borderRadius="full"
              overflow="hidden"
              border="4px solid #202020"
              mr={{ base: 2, sm: 4 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="md"
              flexShrink={0}
            >
              <OSRSAvatar account={userId} size={55} />
            </Box>

            <Box>
              <Flex 
                align="center"
                mb={1}
                flexDir="row"
              >
                <Heading 
                  as="h2" 
                  size={{ base: "md", md: "lg" }} 
                  mr={2}
                  fontSize={{ base: "22px", sm: "30px", md: "40px", lg: "50px" }}
                  lineHeight="1.2"
                  isTruncated
                  maxW={{ base: "160px", sm: "250px", md: "100%" }}
                >
                  {accountData?.alias ||
                    `${userId?.substring(0, 6)}...${userId?.substring(
                      userId.length - 6
                    )}`}
                </Heading>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={onOpen}
                  p={{ base: 1, md: 2 }}
                  minW="auto"
                >
                  <Box display={{ base: "none", sm: "block" }}>Edit</Box>
                </Button>
              </Flex>

              {/* Wallet info - hidden on mobile, visible on md and up */}
              <Text 
                fontSize={{ base: "xs", md: "sm" }} 
                color="#efefef"
                textAlign="left"
                display={{ base: "none", md: "block" }}
              >
                <strong>Wallet:</strong> {userId?.substring(0, 6)}...
                {userId?.substring(userId.length - 6)}
              </Text>
              
              {/* Points info - visible only on mobile in place of wallet */}
              <Flex 
                align="center"
                display={{ base: "flex", md: "none" }}
                fontSize="xs"
                color="#efefef"
              >
                <Icon
                  as={FaMedal}
                  color="yellow.500"
                  mr={1}
                  boxSize="14px"
                />
                <Text fontSize="16px">
                  <strong>Points:</strong> {accountData?.points
                    ? formatNumberWithSpaces(accountData?.points)
                    : "0"}
                </Text>
              </Flex>
            </Box>
          </Flex>

          <Stat 
            textAlign="right"
            flexShrink={0} 
            mt={{ base: 0, md: "10px" }}
            ml={{ base: "auto", md: 0 }}
            marginRight={{ base: "5px", md: 0 }}
            display={{ base: "none", md: "block" }} // Hide on mobile
          >
            <StatLabel 
              fontSize={{ base: "16px", sm: "20px", md: "30px" }} 
              fontWeight="bold"
            >
              Total Points
            </StatLabel>
            <Flex 
              align="center" 
              justify="flex-end"
            >
              <Icon
                as={FaMedal}
                color="yellow.500"
                mr={1}
                boxSize={{ base: "20px", sm: "24px", md: "36px" }}
                mt={{ base: "-2px", md: "-10px" }}
              />
              <StatNumber 
                fontSize={{ base: "22px", sm: "28px", md: "35px" }} 
                mt={{ base: "-2px", md: "-10px" }}
              >
                {accountData?.points
                  ? formatNumberWithSpaces(accountData?.points)
                  : "0"}
              </StatNumber>
            </Flex>
          </Stat>
        </Flex>
      </CardBody>
      
      {/* Edit Alias Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bgColor="#333333" color="#efefef" mx={4}>
          <ModalHeader>Update Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input
                value={newAlias}
                onChange={(e) => {
                  // Limit input to 12 characters
                  if (e.target.value.length <= 12) {
                    setNewAlias(e.target.value);
                  }
                }}
                placeholder="Enter your display name"
                maxLength={12} // HTML attribute to limit input length
              />
              <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                {newAlias.length}/12 characters
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              color="#efefef"
              border="1px solid #efefef"
            >
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleUpdateAlias}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default AccountDataComponent;