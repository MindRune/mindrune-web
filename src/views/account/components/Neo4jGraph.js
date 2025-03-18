import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Text,
  Icon,
  Spinner,
  SimpleGrid,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaNetworkWired } from "react-icons/fa";
import ForceGraph2D from "react-force-graph-2d";
import apiService from "../services/apiService";

const Neo4jGraph = ({ userId, playerId }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const graphRef = useRef();
  const containerRef = useRef();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // State to track container dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Define the legend items based on node types in the graph
  const legendItems = [
    { label: "Player", color: "#000000" },
    { label: "Combat", color: "#ED8936" },
    { label: "XP Gain", color: "#48BB78" },
    { label: "Inventory Change", color: "#9F7AEA" },
    { label: "Item", color: "#eb4034" },
    { label: "Menu", color: "#4299E1" },
    { label: "Quest Complete", color: "#1ff5ef" },
    { label: "Diary", color: "#B794F4" },
    { label: "Combat Achievement", color: "#F687B3" },
    { label: "Skill", color: "#ECC94B" },
    { label: "Character", color: "#964B00" },
    { label: "Location", color: "#CBD5E0" },
    { label: "World Change", color: "#CBD5E0" },
  ];

  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setLoading(true);
        const data = await apiService.getGraphData(userId, playerId);
        setGraphData(data);
        setError(null);
      } catch (err) {
        console.error("Error loading graph data:", err);
        setError("Failed to load graph data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadGraphData();
    }
  }, [userId, playerId]);

  // Handle resize to update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: height - 60 }); // Subtract space for legend
      }
    };

    // Initial measurement
    updateDimensions();

    // Setup resize observer for container
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Setup window resize listener as fallback
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Handle zoom to fit when data or dimensions change
  useEffect(() => {
    if (
      graphRef.current &&
      graphData.nodes.length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      // Add slight delay to ensure graph has rendered
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 40);
      }, 500);
    }
  }, [graphData, dimensions, userId]);

  if (loading) {
    return (
      <Box
        ref={containerRef}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        bg={bgColor}
        height="100%"
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        shadow="md"
      >
        <Spinner size="xl" color="#efefef" mb={4} thickness="3px" />
        <Text>Loading graph data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        ref={containerRef}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        bg={bgColor}
        height="100%"
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        shadow="md"
      >
        <Icon as={FaNetworkWired} w={16} h={16} color="red.400" mb={4} />
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <Box
        ref={containerRef}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        bg={bgColor}
        height="100%"
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        shadow="md"
      >
        <Icon as={FaNetworkWired} w={16} h={16} color="#efefef" mb={4} />
        <Text>
          No graph data available for{" "}
          {playerId ? `Player ID: ${playerId}` : "this account"}.
        </Text>
        <Text mt={2} fontSize="sm" color="gray.500">
          Play more to generate activity data!
        </Text>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
      height="100%"
      bg="#efefef"
      borderRadius="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <>
          <Box flex="1" position="relative">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              nodeLabel={(node) => `${node.label}: ${node.name}`}
              nodeColor={(node) => node.color}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              linkLabel={(link) => link.type}
              linkWidth={1.5}
              cooldownTicks={100}
              d3Force={(d3Force) => {
                d3Force("center", null);
                d3Force("x", null);
                d3Force("y", null);
              }}
              forceEngine="d3"
              onEngineStop={() => graphRef.current?.zoomToFit(400, 40)}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bgDimensions = [textWidth, fontSize].map(
                  (n) => n + fontSize * 0.2
                );

                // Node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Only show labels if zoomed in enough
                if (globalScale >= 1.5) {
                  // Text background
                  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                  ctx.fillRect(
                    node.x - textWidth / 2,
                    node.y + 5 + 1,
                    bgDimensions[0],
                    bgDimensions[1]
                  );

                  // Text
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = "#333";
                  ctx.fillText(label, node.x, node.y + 5 + fontSize / 2 + 2);
                }
              }}
            />
          </Box>

          {/* Legend */}
          <Box
            p={2}
            borderTop="1px"
            borderColor={borderColor}
            bg="#efefef"
            height="60px"
            overflowX="auto"
            overflowY="hidden"
          >
            <SimpleGrid columns={[3, 4, 5, 6, 7]} spacing={2}>
              {legendItems.map((item) => (
                <HStack key={item.label} spacing={1} align="center">
                  <Box
                    width="10px"
                    height="10px"
                    borderRadius="full"
                    bg={item.color}
                  />
                  <Text fontSize="xs" noOfLines={1}>
                    {item.label}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Neo4jGraph;