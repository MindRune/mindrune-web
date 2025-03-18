import React from "react";
import {
  Box,
  Text,
  Button,
  Flex,
  Avatar,
  Grid,
  GridItem,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack,
  SimpleGrid,
  useBreakpointValue,
  Container
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import mind_rune from "../../..//src/assets/img/mind-rune.webp";
import dragon_background from "../../..//src/assets/img/mind-altar.jpg";
import Card from "components/card/Card.js";
import Roadmap from "views/home/components/Roadmap";
import GPTokenomicsCard from "views/home/components/GPTokenomicsCard";
import {
  QuestionIcon,
  LockIcon,
  TimeIcon,
  InfoIcon,
  ChevronDownIcon,
  SearchIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";

// Create motion components once
const MotionBox = motion(Box);
const MotionText = motion(Text);

// Common animation properties
const sectionAnimation = {
  initial: { opacity: 0, y: 100 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1 }
};

// Common styles objects - made responsive
const headerTextStyle = {
  fontSize: { base: "36px", sm: "48px", md: "60px", lg: "75px" },
  fontWeight: "bold",
  color: "#efefef"
};

const sectionHeaderStyle = {
  fontSize: { base: "2xl", md: "3xl" },
  fontWeight: "bold",
  color: "#efefef",
  mb: 4,
};

const paragraphStyle = {
  fontSize: { base: "md", md: "lg" },
  color: "#efefef",
  lineHeight: "1.7"
};

const cardStyle = {
  w: "100%",
  h: { base: "auto", sm: "auto", md: "auto", lg: "800px" },
  minH: { base: "450px", sm: "500px" },
  boxShadow: "lg",
  bg: "#efefef",
  borderRadius: "8px",
  position: "relative",
  overflow: { base: "auto", md: "visible" },
  p: { base: 4, sm: 6, md: 8 }
};

const parallaxStyle = {
  w: "100%",
  h: { base: "80px", sm: "100px", lg: "400px" },
  bgSize: "cover",
  bgImage: dragon_background,
  bgAttachment: { base: "scroll", md: "fixed" }, // Fixed on desktop, scroll on mobile
  pos: "relative",
  bgRepeat: "no-repeat",
  zIndex: 0
};

const faqButtonStyle = {
  w: "full",
  textAlign: "left",
  h: { base: "auto", md: "60px" },
  py: { base: 3, md: 6 },
  px: "6",
  borderRadius: "lg",
  bg: "rgba(255, 255, 255, 0.08)",
  _hover: { bg: "rgba(255, 255, 255, 0.12)" },
  _active: { bg: "rgba(255, 255, 255, 0.16)" },
  color: "white",
  fontWeight: "500",
  transition: "all 0.2s",
  boxShadow: "sm"
};

const faqMenuListStyle = {
  bg: "gray.800",
  borderColor: "purple.700",
  boxShadow: "lg",
  p: "4",
  borderRadius: "md",
  maxW: { base: "calc(100vw - 32px)", md: "800px" }
};

const faqMenuItemStyle = {
  bg: "transparent",
  color: "gray.100",
  fontSize: { base: "sm", md: "md" },
  _hover: { bg: "rgba(255, 255, 255, 0.05)" },
  p: "4",
  maxWidth: "800px"
};

export default function FrontPage() {
  // Responsive adjustments
  const sectionHeight = useBreakpointValue({ 
    base: "auto", 
    sm: "auto", 
    md: "auto", 
    lg: "725px" 
  });
  
  const sectionPadding = useBreakpointValue({ 
    base: "60px 0", 
    md: "30px 0"
  });
  
  const gridTemplate = useBreakpointValue({ 
    base: "1fr", 
    md: "1fr 1fr" 
  });
  
  const heroTopPadding = useBreakpointValue({ 
    base: "150px", 
    sm: "200px", 
    md: "220px", 
    lg: "15%" 
  });
  
  const avatarSize = useBreakpointValue({ 
    base: "100px", 
    sm: "120px", 
    md: "150px" 
  });

  // Helper components
  const ParallaxBackground = ({ bgPos }) => (
    <Box {...parallaxStyle} bgPos="center 15%" />
  );

  const FaqItem = ({ icon, question, answer }) => (
    <Menu closeOnSelect={false} w="100%">
      <MenuButton
        as={Button}
        {...faqButtonStyle}
        leftIcon={<Icon as={icon} color="purple.300" />}
        rightIcon={<ChevronDownIcon />}
      >
        {question}
      </MenuButton>
      <MenuList {...faqMenuListStyle}>
        <MenuItem {...faqMenuItemStyle}>{answer}</MenuItem>
      </MenuList>
    </Menu>
  );

  const StepItem = ({ icon, text }) => (
    <Flex alignItems="flex-start">
      <Icon as={icon} boxSize={{ base: "18px", md: "24px" }} color="#202020" mr={{ base: 4, md: 8 }} mt="5px" />
      <Text
        color="#333333"
        fontSize={{ base: "md", md: "xl" }}
        fontWeight="medium"
        textAlign="left"
      >
        {text}
      </Text>
    </Flex>
  );

  const FeatureItem = ({ title, description }) => (
    <Box>
      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold">
        {title}
      </Text>
      <Text fontSize={{ base: "sm", md: "lg" }}>
        {description}
      </Text>
    </Box>
  );

  return (
    <Box maxW="100%" overflow="hidden" justifyContent="center">
      {/* Hero Section */}
      <Box minH={{ base: "90vh", md: "100vh" }} pt={heroTopPadding} w="100%">
        <Box
          position="relative"
          zIndex={1}
          textAlign="center"
          transform={{ base: "none", md: "translateY(-50%)" }}
        >
          <Flex
            justifyContent="center"
            pt={{ base: "35%", sm: "35%", md: "35%", lg: "25%" }}
          >
            <Avatar
              src={mind_rune}
              bg="none"
              borderWidth="none"
              w={avatarSize}
              h={avatarSize}
              boxShadow="md"
            />
          </Flex>
          <Flex justifyContent="center">
            <Text {...headerTextStyle}>MindRune</Text>
          </Flex>
          <Text fontSize={{ base: "xl", sm: "2xl", md: "3xl", lg: "4xl" }} fontWeight="bold" color="#efefef" mt="-10px">
            The Play-2-Earn Runelite Plugin.
          </Text>
          <Text fontSize={{ base: "md", md: "xl" }} color="#efefef" px={{ base: 4, md: 0 }}>
            Contribute for free and earn rewards!
          </Text>
          <Flex mt="30px" justifyContent="center">
            <Button
              as={RouterLink}
              to="/account"
              aria-label="Account Button"
              bg="green.500"
              color="white"
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="600"
              borderRadius="70px"
              mr="10px"
              px={{ base: "24px", md: "36px" }}
              py={{ base: "20px", md: "24px" }}
              size={{ base: "md", md: "lg" }}
              boxShadow="0px 4px 10px rgba(0, 0, 0, 0.2)"
              _hover={{
                bg: "green.400",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)",
              }}
              _active={{
                bg: "green.600",
                transform: "translateY(1px)",
                boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
              }}
              transition="all 0.2s ease"
            >
              Account
            </Button>
          </Flex>
          <Text fontSize="sm" color="#efefef" pt={"10px"}>
            No Affiliation with Jagex, Ltd.
          </Text>
          <Flex
            direction="column"
            align="center"
            mt={6}
            animation="bounce 2s infinite"
            sx={{
              "@keyframes bounce": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(10px)" },
              },
            }}
          >
            <Text fontSize="sm" color="#efefef" mb={1}>
              Scroll to explore
            </Text>
            <Icon as={ChevronDownIcon} color="#efefef" boxSize={6} />
          </Flex>
        </Box>
      </Box>

      {/* First Parallax */}
      <ParallaxBackground bgPos="50% 70%" />

      {/* What is MindRune Section */}
      <MotionBox
        id="section1"
        w="100%"
        textAlign="center"
        {...sectionAnimation}
        h={sectionHeight}
        py={sectionPadding}
        alignItems="center"
        position="relative"
        zIndex={1}
      >
        <Container maxW="1200px" px={{ base: 4, md: 6, lg: 8 }}>
          <Grid
            templateColumns={{ base: "1fr", md: gridTemplate }}
            gap={{ base: 8, md: 8 }}
            alignItems="center"
            w="100%"
          >
            <GridItem>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                textAlign="left"
                color="#efefef"
                mb={{ base: 8, md: 0 }}
              >
                <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" textAlign="center">
                  What is MindRune?
                </Text>
                <Text fontSize={{ base: "md", md: "lg" }} mt={4}>
                  MindRune is a combination of open source services that work together to
                  create the first OSRS graph database built by OSRS
                  players.
                </Text>
                <VStack align="start" spacing={{ base: 3, md: 4 }} mt={4} px={4}>
                  <FeatureItem 
                    title="The MindRune Plugin"
                    description="The MindRune plugin captures playdata (memories) and transmits them to The MindRune Graph. Points are awarded to players based on the quality and value of the memory which tracks contributions to The MindRune Graph."
                  />
                  <FeatureItem 
                    title="The MindRune Graph"
                    description="A next-generation data repository for all things OSRS. Graph databases provide enhanced capabilities for discovery and connections, enabling brand new features and plugins that couldn't exist before."
                  />
                  <FeatureItem 
                    title="The MindRune Memory Minter"
                    description="Each memory transmitted to MindRune is minted as a digital memory in your web3 wallet. Players remain in control of their memories and are free to trade them or forge them into new collectibles."
                  />
                  <FeatureItem 
                    title="The MindRune API"
                    description="A free open source API that connects players to The MindRune Graph."
                  />
                </VStack>
              </Box>
            </GridItem>
            <GridItem position="relative">
              <Card
                {...cardStyle}
                mt={{ base: 0, sm: 0, md: "-40px" }}
              >
                <VStack spacing={{ base: 4, md: 6 }} align="center" h="100%" justify="center">
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="#333333" textAlign="center">
                    Getting Started with MindRune
                  </Text>

                  <Text fontSize={{ base: "md", md: "xl" }} color="#333333" mb={2} textAlign="left">
                    Registering your Runelite client with MindRune is easy and
                    requires no personal information.
                  </Text>

                  <VStack spacing={{ base: 3, md: 4 }} align="flex-start" w="100%">
                    <StepItem 
                      icon={LockIcon} 
                      text="Connect to MindRune with your desired wallet."
                    />
                    <StepItem 
                      icon={InfoIcon} 
                      text="Navigate to your account and copy your registration key."
                    />
                    <StepItem 
                      icon={SearchIcon} 
                      text="Search for the MindRune Plugin in your Runelite client and install."
                    />
                    <StepItem 
                      icon={EditIcon} 
                      text="Paste your MindRune registration key into the configuration of your MindRune plugin."
                    />
                  </VStack>

                  <Box
                    mt={{ base: 4, md: 6 }}
                    p={{ base: 4, md: 6 }}
                    bg="rgba(0, 128, 0, 0.1)"
                    borderRadius="md"
                    borderLeft="4px solid green"
                    w="100%"
                  >
                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color="#333333">
                      That's all! You're now earning points and capturing your
                      play data!
                    </Text>
                    <Text fontSize={{ base: "md", md: "lg" }} color="#333333" mt={2}>
                      Visit your account to explore your gameplay and points.
                    </Text>
                  </Box>
                </VStack>
              </Card>
            </GridItem>
          </Grid>
        </Container>
      </MotionBox>

      {/* Second Parallax */}
      <ParallaxBackground bgPos="10% 30%" />

      {/* Roadmap Section */}
      <MotionBox
        id="section2"
        w="100%"
        alignItems="center"
        {...sectionAnimation}
        h={sectionHeight}
        py={sectionPadding}
        position="relative"
        zIndex={1}
      >
        <Container maxW="1200px" px={{ base: 4, md: 6, lg: 8 }}>
          <Grid
            templateColumns={{ base: "1fr", md: gridTemplate }}
            gap={{ base: 8, md: 8 }}
            alignItems="center"
            w="100%"
          >
            <GridItem position="relative" order={{ base: 2, md: 1 }}>
              <Card
                {...cardStyle}
                mt={{ base: 0, sm: 0, md: "-40px" }}
              >
                <Roadmap />
              </Card>
            </GridItem>

            <GridItem order={{ base: 1, md: 2 }}>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                textAlign="center"
                color="#efefef"
                px={{ base: 2, md: 6 }}
                mb={{ base: 8, md: 0 }}
              >
                <Text {...sectionHeaderStyle}>
                  Looking Forward
                </Text>
                <Text {...paragraphStyle}>
                  The goal of MindRune is simple: Grow The MindRune Graph with gameplay data and general OSRS knowledge. 
                </Text>
                <Text {...paragraphStyle} mt={4}>
                  The MindRune Graph uses a substrate purpose-built
                  for making connections which unlocks new plugins/apps that were not possible before. The evolution of MindRune is intended to be split
                  into 4 distinct ages. Each age signals the dawn of new incentives and
                  themes to encourage new memories and unlocking new connections.
                </Text>
                <Text {...paragraphStyle} mt={4}>
                  The Gold Pieces($GP) token can only be earned by contributing
                  real-time player data to the MindRune Graph. Furthermore, $GP
                  will be used to measure community involvement and unlock
                  advanced and exclusive features. The majority of the $GP supply
                  will be reserved for future Seasons and Events designed to
                  encouraged focused data collection.
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </MotionBox>

      {/* Third Parallax */}
      <ParallaxBackground bgPos="10% 80%" />

      {/* Tokenomics Section */}
      <MotionBox
        id="section3"
        w="100%"
        textAlign="center"
        {...sectionAnimation}
        h={sectionHeight}
        py={sectionPadding}
        position="relative"
        zIndex={1}
      >
        <Container maxW="1200px" px={{ base: 4, md: 6, lg: 8 }}>
          <Grid
            templateColumns={{ base: "1fr", md: gridTemplate }}
            gap={{ base: 8, md: 8 }}
            alignItems="center"
            w="100%"
          >
            <GridItem>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                textAlign="center"
                color="#efefef"
                mb={{ base: 8, md: 0 }}
              >
                <Text {...sectionHeaderStyle}>
                  $GP Tokenomics
                </Text>
                <Text fontSize={{ base: "md", md: "lg" }} mt={4}>
                  Points are earned through gameplay and determine $GP claiming
                  rewards:
                </Text>

                <Flex direction="column" mt={6} maxW="800px" px={{ base: 2, md: 4 }}>
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 4, md: 8 }}
                    width="100%"
                  >
                    <Box>
                      <Text fontWeight="bold" mb={2} fontSize={{ base: "lg", md: "xl" }}>
                        Base Point Values
                      </Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Combat: Damage Dealt</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>XP Gains: 4pts</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Skilling: 3pts</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Item Acquisiton: 2pts</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Character Interaction: 1pts</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Inventory & Menu: 0.5pts</Text>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" mb={2} fontSize={{ base: "lg", md: "xl" }}>
                        Key Multipliers
                      </Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Combat Damage > 10: up to 1.4x</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>XP Gain > 50: up to 1.3x</Text>
                      <Text mb={1} fontSize={{ base: "sm", md: "md" }}>Location included: 1.1x</Text>
                    </Box>
                  </SimpleGrid>

                  <Box mt={8}>
                    <Text fontWeight="bold" mb={2} fontSize={{ base: "lg", md: "xl" }}>
                      Special Rewards
                    </Text>
                    <Text mb={1} fontSize={{ base: "sm", md: "md" }}>
                      Quest Completion: up to 10k pts for Master Difficulty
                    </Text>
                    <Text mb={1} fontSize={{ base: "sm", md: "md" }}>
                      Achievement Diaries & Combat Achievements: 500 pts
                    </Text>
                  </Box>

                  <Box mt={8} bg="whiteAlpha.100" p={4} borderRadius="md">
                    <Text fontSize={{ base: "xs", md: "sm" }}>
                      Points are calculated per event, rounded to nearest integer,
                      and summed for total transaction value. Seasonal modifiers
                      may apply to further adjust earning rates. <Text fontWeight="bold">Any account banned by Jagex or transmitting spam/unnatural gameplay will be excluded from claim events.</Text>
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </GridItem>
            <GridItem position="relative">
              <GPTokenomicsCard />
            </GridItem>
          </Grid>
        </Container>
      </MotionBox>

      {/* Fourth Parallax */}
      <ParallaxBackground bgPos="10% 80%" />

      {/* FAQ Section */}
      <MotionBox
        id="section4"
        w="100%"
        mx="auto"
        textAlign="center"
        {...sectionAnimation}
        py={8}
        px={{ base: 4, md: 8 }}
        minH="300px"
        position="relative"
        zIndex={1}
      >
        <Text {...sectionHeaderStyle}>
          FAQ
        </Text>

        <VStack spacing={{ base: 4, md: 6 }} maxW="800px" w="100%" mx="auto" pb={{ base: 4, md: 6 }} pb={{ base: 'xs', md: 6 }}>
          <FaqItem 
            icon={QuestionIcon} 
            question="What personal data does MindRune capture?"
            answer="MindRune captures only in-game data provided by the MindRune Plugin. The only personal identifying information we retain is the public key of your Web3 wallet."
          />
          <FaqItem 
            icon={LockIcon} 
            question="Why do I have to sign in with a crypto wallet to participate?"
            answer="By using your web3 wallet, MindRune eliminates the need for an email address and password. This means no sensitive data is ever stored on MindRune servers. By using your web3 wallet, you're able to claim $GP in the future."
          />
          <FaqItem 
            icon={TimeIcon} 
            question="Why does there need to be a token?"
            answer="The $GP token is meant to quantify meaningful contributions to The MindRune Graph and is not meant for speculative value. Token earners are able to signal their contribution to the collective and gain access to features they helped create."
          />
          <FaqItem 
            icon={InfoIcon} 
            question="What's the point of all this?"
            answer="The simple answer is fun! The memories stored by MindRune will be used to create exciting future experiences for Old School Runescape players. The MindRune Team are passionate OSRS players and dedicated to the longevity of the game!"
          />
        </VStack>
      </MotionBox>
    </Box>
  );
}