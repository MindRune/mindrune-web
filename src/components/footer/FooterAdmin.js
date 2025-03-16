/*eslint-disable*/
import React from "react";
import {
  Flex,
  Link,
  Text,
  useColorMode,
  useColorModeValue,
  Box,
  useBreakpointValue
} from "@chakra-ui/react";

export default function Footer() {
  const textColor = useColorModeValue("gray.400", "white");
  const { toggleColorMode } = useColorMode();
  
  // Responsive font sizes
  const fontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
  
  return (
    <Flex
      h={{ base: "auto", sm: "55px" }}
      minH="55px"
      zIndex="3"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      bgColor="rgba(51, 51, 51)"
      px={{ base: "10px", sm: "20px", md: "50px" }}
      py={{ base: "10px", sm: "0px" }}
    >
      <Box maxW="100%" overflow="hidden" whiteSpace={{ base: "normal", md: "nowrap" }}>
        <Text
          color="#efefef"
          textAlign="center"
          fontSize={fontSize}
          lineHeight="1.4"
        >
          &copy; {1900 + new Date().getYear()}
          <Text as="span" fontWeight="500" mx="4px">
            RuneBoy. Open-Sourced on
            <Link
              mx={{ base: "1px", sm: "3px" }}
              color={textColor}
              href="https://github.com/OSRSMindRune"
              target="_blank"
              fontWeight="700"
            >
              Github.
            </Link>
            Supported by the OSRS Community. Thank you!
          </Text>
        </Text>
      </Box>
    </Flex>
  );
}