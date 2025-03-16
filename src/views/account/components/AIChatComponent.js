import React from "react";
import {
  Box,
  Text,
  Heading,
  List,
  ListItem,
  Badge,
  Flex,
  Icon,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react";
import {
  FaBrain,
  FaChartPie,
  FaGamepad,
  FaTrophy,
  FaArrowUp,
} from "react-icons/fa";

const AIChatComponent = () => {
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
          <Badge colorScheme="green" variant="subtle">
            Coming Soon
          </Badge>
        </Flex>
      </CardHeader>

      <CardBody
        flex="1"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        px={8}
      >
        <Icon
          as={FaBrain}
          boxSize={14}
          color="blue.400"
          opacity={0.7}
          mb={3}
          mt="-20px"
        />

        <Heading size="md" mb={4}>
          Play More to Unlock MindRune AI
        </Heading>

        <Text color="#efefef" mb={6}>
          Continue playing to generate more data for personalized
          analysis.
        </Text>

        <Box
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.700"
          p={4}
          width="100%"
        >
          <List spacing={1}>
            <ListItem>
              <Flex align="center">
                <Icon as={FaChartPie} color="green.500" mr={2} />
                <Text fontSize="sm">Gameplay pattern analysis</Text>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex align="center">
                <Icon as={FaGamepad} color="purple.500" mr={2} />
                <Text fontSize="sm">
                  Skill efficiency recommendations
                </Text>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex align="center">
                <Icon as={FaTrophy} color="yellow.500" mr={2} />
                <Text fontSize="sm">Progress optimization</Text>
              </Flex>
            </ListItem>
          </List>
        </Box>
      </CardBody>

      <Box
        p={4}
        bgColor="#202020"
        mb="20px"
        mr="5%"
        ml="5%"
        borderRadius="8px"
      >
        <Flex>
          <Input
            placeholder="Ask about your gameplay (coming soon)..."
            isDisabled={true}
            mr={2}
          />
          <Button colorScheme="green" isDisabled={true} px={6}>
            <FaArrowUp />
          </Button>
        </Flex>
      </Box>
    </Card>
  );
};

export default AIChatComponent;