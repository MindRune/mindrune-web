import React, { useEffect, useState, useRef, useContext } from "react";
import {
  Flex,
  Text,
  Heading,
  Icon,
  Container,
  Box,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  FaCoins
} from "react-icons/fa";
import fishing_knight from "../../..//src/assets/img/fishing-knight.jpg";

export default function Claim() {
  // Responsive values based on screen size
  const iconSize = useBreakpointValue({ base: 12, md: 16, lg: 20 });
  const headingSize = useBreakpointValue({ base: "lg", md: "xl" });
  const textSize = useBreakpointValue({ base: "md", md: "lg", lg: "xl" });
  const padding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  
  return (
    <Container 
      maxW="100%" 
      p={0} 
      centerContent 
      h={{ base: "100vh", md: "calc(100vh - 55px)" }}
      bgImage={fishing_knight}
      bgPosition={{ base: "center", md: "center 25%" }}
      bgSize="cover"
      bgRepeat="no-repeat"
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
        <Icon as={FaCoins} w={iconSize} h={iconSize} color="#efefef" mb={6} />
        <Heading as="h2" size={headingSize} mb={4} textAlign="center" color="#efefef">
          Claim $GP!
        </Heading>
        <Text fontSize={textSize} mb={8} textAlign="center" color="#efefef">
          Connect your wallet here to claim $GP at the end of each season!
        </Text>
      </Flex>
    </Container>
  );
}