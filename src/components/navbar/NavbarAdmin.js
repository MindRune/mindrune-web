import {
  Box,
  Flex,
  Link,
  HStack,
  useBreakpointValue,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import AdminNavbarLinks from "components/navbar/NavbarLinksAdmin";

export default function AdminNavbar(props) {
  const { routes } = props;
  const [scrolled] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Responsive values
  const paddingX = useBreakpointValue({ base: "10px", md: "15px" });
  const navbarWidth = useBreakpointValue({
    base: "calc(100vw - 5%)",
    sm: "calc(100vw - 6%)",
    md: "calc(100vw - 8%)",
    lg: "calc(100vw - 6%)",
    xl: "calc(100vw - 350px)",
    "2xl": "calc(100vw - 365px)",
  });
  const navbarTop = useBreakpointValue({ base: "10px", md: "15px", lg: "20px" });
  const fontSize = useBreakpointValue({ base: "md", md: "lg" });
  const spacing = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const showLinks = useBreakpointValue({ base: false, md: true });
  
  useEffect(() => {
    // Your existing useEffect code here
  }, []);
  
  return (
    <Box
      boxShadow="lg"
      backgroundPosition="center"
      backgroundSize="cover"
      position="fixed"
      borderRadius="8px"
      transition="box-shadow 0.25s linear, background-color 0.25s linear, filter 0.25s linear, border 0s linear"
      alignItems="center"
      display="flex"
      minH={{ base: "70px", md: "85px", lg: "100px" }}
      justifyContent="space-between"
      lineHeight="25.6px"
      mx="auto"
      px={{ sm: paddingX, md: "10px" }}
      ps={{ xl: "12px" }}
      pt="8px"
      pb="8px"
      top={navbarTop}
      left="50%"
      transform="translateX(-50%)"
      w={navbarWidth}
      zIndex="101"
      bgColor="rgba(51, 51, 51)"
    >
      {/* Mobile menu button - only visible on small screens */}
      {!showLinks && (
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon />}
          variant="ghost"
          color="white"
          size="lg"
          ml={2}
          onClick={onOpen}
          display={{ base: "flex", md: "none" }}
        />
      )}
      
      {/* Mobile drawer menu */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent bg="#333333">
          <DrawerCloseButton color="white" />
          <DrawerBody mt={10}>
            <VStack spacing={6} align="start">
              <Link
                href="/account"
                color="#efefef"
                _hover={{ textDecoration: "none", color: "gray.300" }}
                fontSize="lg"
                fontWeight="bold"
                onClick={onClose}
              >
                About
              </Link>
              {/* <Link
                href="/scoreboard"
                color="#efefef"
                _hover={{ textDecoration: "none", color: "gray.300" }}
                fontSize="lg"
                fontWeight="bold"
                onClick={onClose}
              >
                Scoreboard
              </Link>
              <Link
                href="/claim"
                color="#efefef"
                _hover={{ textDecoration: "none", color: "gray.300" }}
                fontSize="lg"
                fontWeight="bold"
                onClick={onClose}
              >
                Claim
              </Link>
              <Link
                href="/forge"
                color="#efefef"
                _hover={{ textDecoration: "none", color: "gray.300" }}
                fontSize="lg"
                fontWeight="bold"
                onClick={onClose}
              >
                Forge
              </Link> */}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Left side navigation links - hidden on mobile */}
      <Flex alignItems="center" ml={4} display={{ base: showLinks ? "flex" : "none", md: "flex" }}>
        <HStack spacing={spacing}>
          <Link
            href="/about"
            color="#efefef"
            _hover={{ textDecoration: "none", color: "gray.300" }}
            fontSize={fontSize}
            fontWeight="bold"
          >
            About
          </Link>
          {/* <Link
            href="/scoreboard"
            color="#efefef"
            _hover={{ textDecoration: "none", color: "gray.300" }}
            fontSize={fontSize}
            fontWeight="bold"
          >
            Scoreboard
          </Link>
          <Link
            href="/claim"
            color="#efefef"
            _hover={{ textDecoration: "none", color: "gray.300" }}
            fontSize={fontSize}
            fontWeight="bold"
          >
            Claim
          </Link>
          <Link
            href="/forge"
            color="#efefef"
            _hover={{ textDecoration: "none", color: "gray.300" }}
            fontSize={fontSize}
            fontWeight="bold"
          >
            Forge
          </Link> */}
        </HStack>
      </Flex>
      
      {/* Right side nav elements */}
      <Box ms="auto" w={{ sm: "unset", md: "unset" }}>
        <AdminNavbarLinks
          onOpen={props.onOpen}
          logoText={props.logoText}
          secondary={props.secondary}
          fixed={props.fixed}
          scrolled={scrolled}
          routes={routes}
          mt="5px"
        />
      </Box>
    </Box>
  );
}

AdminNavbar.propTypes = {
  brandText: PropTypes.string,
  fixed: PropTypes.bool,
  onOpen: PropTypes.func,
};