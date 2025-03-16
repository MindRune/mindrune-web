import { Box, Flex, Text, VStack, Link, useBreakpointValue } from "@chakra-ui/react";
import React, { useState, useMemo } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
} from "react-icons/fa";

export default function MemoryMenu(props) {
  const { memories_data } = props;
  const [selectedItem, setSelectedItem] = useState(null);

  // Responsive values
  const fontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md", lg: "lg" });
  const titleFontSize = useBreakpointValue({ base: "lg", md: "xl" });
  const pointsFontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
  const padding = useBreakpointValue({ base: 2, md: 3 });
  const maxHeight = useBreakpointValue({ base: "400px", md: "540px", lg: "640px" });
  const containerWidth = useBreakpointValue({ base: "95%", md: "90%" });

  function formatNumberWithSpaces(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Function to extract memory name from UAL (text after the last slash)
  function extractMemoryName(ual) {
    if (!ual) return "";
    const parts = ual.split("/");
    return parts[parts.length - 1];
  }

  const handleItemClick = (itemId) => {
    setSelectedItem(itemId === selectedItem ? null : itemId);
    // You can add additional functionality here when an item is clicked
  };

  return (
    memories_data && (
      <Flex justify="center" align="center" w="100%" h="100%">
        <Box
          direction="column"
          w={containerWidth}
          h="100%"
          mb={{ base: "10px", md: "20px" }}
          position="relative"
          bgColor="nonergba(32, 32, 32, 0.85)"
          pt={{ base: "20px", md: "30px" }}
          borderRadius="8px"
        >
          <Text
            color="#efefef"
            fontSize={titleFontSize}
            fontWeight="bold"
            position="sticky"
            mb={{ base: "15px", md: "20px" }}
            px={{ base: "15px", md: "25px" }}
          >
            Memories
          </Text>
          <Box 
            overflowY="auto" 
            maxHeight={maxHeight} 
            px={{ base: "15px", md: "25px" }}
          >
            <VStack spacing={{ base: 1, md: 2 }} align="stretch" width="100%">
              {memories_data.map((item, index) => {
                // Generate a unique key for the item
                const itemId = `${item.ual}-${index}`;
                // Extract memory name
                const memoryName = extractMemoryName(item.ual);

                return (
                  <Box
                    key={itemId}
                    onClick={() => handleItemClick(itemId)}
                    bg={
                      selectedItem === itemId
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent"
                    }
                    borderRadius="md"
                    p={padding}
                    cursor="pointer"
                    _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                    transition="background-color 0.2s"
                    borderLeft={
                      selectedItem === itemId
                        ? "4px solid #3182CE"
                        : "4px solid transparent"
                    }
                  >
                    <Flex 
                      justify="space-between" 
                      align="center" 
                      direction="row"
                    >
                      <Box>
                        <Text
                          color="#efefef"
                          fontSize={fontSize}
                          fontWeight="400"
                          mb="1"
                          isTruncated
                          maxW={{ base: "140px", sm: "180px", md: "220px" }}
                        >
                          Memory: {memoryName}
                        </Text>
                        <Text
                          color="#efefef"
                          fontSize="xs"
                          fontWeight="400"
                          mb="1"
                        >
                          <Link
                            href={`https://dkg-testnet.origintrail.io/explore?ual=${item.ual}`}
                            textDecoration="underline"
                            target="_blank"
                          >
                            View Memory
                          </Link>
                        </Text>
                      </Box>
                      <Box 
                        textAlign="right"
                        width="auto"
                      >
                        <Text
                          color="#efefef"
                          fontSize={pointsFontSize}
                          fontWeight="700"
                          mb="1"
                        >
                          Points
                        </Text>
                        <Text 
                          color="#efefef" 
                          fontSize={pointsFontSize} 
                          fontWeight="400"
                        >
                          {formatNumberWithSpaces(item.points)}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </Box>
      </Flex>
    )
  );
}