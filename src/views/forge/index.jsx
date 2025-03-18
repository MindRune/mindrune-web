import React, { useEffect, useState, useRef, useContext } from "react";
import {
  SimpleGrid,
  GridItem,
  Card,
  Text,
  Heading,
  Icon,
  Container,
  Flex,
  Spinner,
  Stack,
  useBreakpointValue
} from "@chakra-ui/react";
import { FaHammer, FaUser } from "react-icons/fa";
import pyramid_plunder from "../../..//src/assets/img/cow-wizard.jpg";
import MemoryList from "views/forge/components/memoryList";
import { columnsDataComplex } from "views/forge/variables/columnsData";
import axios from "axios";
import { AccountContext } from "../../AccountContext";

export default function Forge() {
  const [memories_data, setMemoriesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useContext(AccountContext);
  
  // Responsive values
  const iconSize = useBreakpointValue({ base: 12, md: 16, lg: 20 });
  const headingSize = useBreakpointValue({ base: "md", md: "lg", lg: "xl" });
  const textSize = useBreakpointValue({ base: "sm", md: "md", lg: "xl" });
  const containerWidth = useBreakpointValue({ base: "95%", sm: "90%", md: "85%", lg: "80%" });
  const marginTop = useBreakpointValue({ base: "160px", md: "140px" });
  const cardMinHeight = useBreakpointValue({ base: "400px", md: "600px", lg: "740px" });
const padding = useBreakpointValue({ base: 4, md: 6, lg: 8 });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        let memories = await axios.get(
          `${process.env.REACT_APP_API_HOST}/osrs/memories/${account}`
        );
        console.log(memories);
        const memoriesData = memories.data.data;
        setMemoriesData(memoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [account]);
  
  if (!account) {
    // Not logged in state with centered styled text
    return (
      <Container
        maxW="100%"
        centerContent
        h="calc(100vh - 55px)"
        backgroundImage={pyramid_plunder}
        bgPos="center 15%"
        bgSize="cover"
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          bgColor="rgba(32, 32, 32, 0.85)"
          p={padding}
          borderRadius="xl"
          w={{ base: "90%", sm: "85%", md: "80%", lg: "70%", xl: "1200px" }}
          maxW="1400px"
          m={{ base: "auto", md: "140px auto auto" }}
          minH={{ base: "60vh", md: "600px", lg: "740px" }}
        >
          <Icon as={FaUser} w={20} h={20} color="#efefef" mb={6} />
          <Heading as="h2" size="xl" mb={4} textAlign="center" color="#efefef">
            Account Required
          </Heading>
          <Text fontSize="lg" mb={8} textAlign="center" color="#efefef">
            Please connect your wallet to use the forge.
          </Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container
      maxW="100%"
      centerContent
      h={{ base: "auto", md: "calc(100vh - 55px)" }}
      py={{ base: 4, md: 0 }}
      backgroundImage={pyramid_plunder}
      bgPos={{ base: "center", md: "center 25%" }}
      bgSize="cover"
      bgAttachment={{ base: "scroll", md: "fixed" }}
    >
      <SimpleGrid 
        columns={{ base: 1, md: 12 }} 
        spacing={{ base: 4, md: 4 }} 
        w={containerWidth} 
        mt={marginTop}
        mb={{ base: 4, md: 0 }}
      >
        {/* Left Card - Memory List */}
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Card
            bgColor="rgba(32, 32, 32, 0.85)"
            borderRadius="xl"
            overflow="hidden"
            shadow="md"
            minH={cardMinHeight}
            mb={{ base: 4, md: 0 }}
          >
            {!isLoading && memories_data ? (
              <MemoryList
                columnsData={columnsDataComplex}
                memories_data={memories_data}
              />
            ) : (
              <Flex justify="center" align="center" h="100%" minH={{ base: "400px", md: cardMinHeight }}>
                <Stack spacing={4} align="center">
                  <Spinner
                    thickness="6px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="efefef"
                    size="xl"
                  />
                  <Text fontSize="md" color="#efefef" justify="center" align="center">
                    Loading Memories...
                  </Text>
                </Stack>
              </Flex>
            )}
          </Card>
        </GridItem>
        
        {/* Right Card - Forge Info */}
        <GridItem colSpan={{ base: 12, md: 8 }}>
          <Card
            bgColor="rgba(32, 32, 32, 0.85)"
            borderRadius="xl"
            overflow="hidden"
            shadow="md"
            display="flex"
            flexDirection="column"
            color="#efefef"
            align="center"
            justify="center"
            p={{ base: 4, md: 6 }}
            minH={{ base: "400px", md: cardMinHeight }}
          >
            <Icon as={FaHammer} w={iconSize} h={iconSize} color="#efefef" mb={{ base: 4, md: 6 }} />
            <Heading
              as="h2"
              size={headingSize}
              mb={{ base: 3, md: 4 }}
              textAlign="center"
              color="#efefef"
              maxW={{ base: "100%", md: "500px" }}
              px={2}
            >
              Forge new collectibles with your hard earned $GP!
            </Heading>
            <Text
              fontSize={textSize}
              mb={{ base: 6, md: 8 }}
              textAlign="center"
              color="#efefef"
              maxW={{ base: "100%", md: "500px" }}
              px={2}
            >
              Connect your wallet here to create and view your collectibles.
              Collectibles are forged by combining 5 memories of similar score!
              Coming soon!
            </Text>
          </Card>
        </GridItem>
      </SimpleGrid>
    </Container>
  );
}