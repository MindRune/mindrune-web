import React, { useState, useEffect, useRef } from "react";

import {
  Box,
  Text,
  Icon,
  Spinner,
  SimpleGrid,
  HStack,
  useColorModeValue,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
} from "@chakra-ui/react";

import { FaNetworkWired, FaSearch, FaInfoCircle } from "react-icons/fa";

import ForceGraph2D from "react-force-graph-2d";

import apiService from "../services/apiService";

const Neo4jGraph = ({ userId, playerId }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [highlightedNodes, setHighlightedNodes] = useState(new Set());

  const [hoveredNode, setHoveredNode] = useState(null);

  const graphRef = useRef();

  const containerRef = useRef();

  const autoZoomTimerRef = useRef(null);

  const bgColor = useColorModeValue("white", "gray.800");

  const borderColor = useColorModeValue("gray.200", "gray.700");

  // State to track container dimensions

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Define the legend items based on node types in the graph

  const legendItems = [
    { label: "Player", color: "#000000" },

    { label: "Combat", color: "#f57e64" },

    { label: "Kill", color: "#fa0202" },

    { label: "XP Gain", color: "#80bf9b" },

    { label: "Item", color: "#F1C40F" },

    { label: "Menu", color: "#0279db" },

    { label: "Inventory", color: "#78b0de" },

    { label: "Quest", color: "#88fcf1" },

    { label: "Diary", color: "#F687B3" },

    { label: "Cmb Achieve", color: "#e07ede" },

    { label: "Skill", color: "#027a34" },

    { label: "Character", color: "#8B4513" },

    { label: "Location", color: "#CBD5E0" },

    { label: "Reward", color: "#8E44AD" },

    { label: "Affliction", color: "#03fc88" },

    { label: "Object", color: "#D0AC5E" },
  ];

  // Function to fix HitSplat node names by looking at their connected nodes

  // Function to fix HitSplat node names and create missing links

  const fixHitSplatNodeNames = (data) => {
    // Create a map to look up nodes by ID

    const nodeMap = new Map();

    data.nodes.forEach((node) => {
      nodeMap.set(node.id, node);
    });

    // Map to track Character/Affliction nodes by name

    const charactersByName = new Map();

    data.nodes.forEach((node) => {
      if (node.label === "Character" || node.label === "Affliction") {
        charactersByName.set(node.name, node);
      }
    });

    // Build a map of HitSplat targets/sources based on relationship data

    const hitSplatConnections = new Map();

    // First pass: find all direct relationships

    data.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;

      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      const sourceNode = nodeMap.get(sourceId);

      const targetNode = nodeMap.get(targetId);

      if (!sourceNode || !targetNode) return;

      // Any entity that PERFORMs or CAUSEs a Combat node could be a source

      if (
        (sourceNode.label === "Character" ||
          sourceNode.label === "Affliction" ||
          sourceNode.label === "Player") &&
        targetNode.label === "Combat" &&
        (link.type === "PERFORMED" || link.type === "CAUSED")
      ) {
        hitSplatConnections.set(targetNode.id, {
          ...(hitSplatConnections.get(targetNode.id) || {}),

          source: sourceNode.name,

          sourceNode: sourceNode,
        });
      }

      // Any entity that is TARGETed by a Combat node could be a target

      if (
        sourceNode.label === "Combat" &&
        (targetNode.label === "Character" ||
          targetNode.label === "Affliction" ||
          targetNode.label === "Player") &&
        link.type === "TARGETED"
      ) {
        hitSplatConnections.set(sourceNode.id, {
          ...(hitSplatConnections.get(sourceNode.id) || {}),

          target: targetNode.name,

          targetNode: targetNode,
        });
      }
    });

    // Second pass: Find likely enemies based on proximity

    const incomingHits = data.nodes.filter(
      (node) =>
        node.label === "Combat" &&
        node.properties &&
        node.properties.direction === "incoming" &&
        (!hitSplatConnections.has(node.id) ||
          !hitSplatConnections.get(node.id).source)
    );

    const outgoingHits = data.nodes.filter(
      (node) =>
        node.label === "Combat" &&
        node.properties &&
        node.properties.direction === "outgoing" &&
        hitSplatConnections.has(node.id) &&
        hitSplatConnections.get(node.id).target
    );

    // Use a different approach: if there's any enemy being targeted by outgoing hits,

    // use that as the source for incoming hits that don't have a source.

    // This is based on the assumption the player is fighting one enemy at a time.

    if (incomingHits.length > 0 && outgoingHits.length > 0) {
      // Get all enemies being targeted by outgoing hits

      const enemies = new Map();

      outgoingHits.forEach((hit) => {
        const connection = hitSplatConnections.get(hit.id);

        if (connection && connection.target && connection.targetNode) {
          enemies.set(connection.target, connection.targetNode);
        }
      });

      // If we found any enemies, use the first one as source for incoming hits without a source

      if (enemies.size > 0) {
        const enemyEntry = Array.from(enemies.entries())[0];

        const enemyName = enemyEntry[0];

        const enemyNode = enemyEntry[1];

        incomingHits.forEach((hit) => {
          if (
            !hitSplatConnections.has(hit.id) ||
            !hitSplatConnections.get(hit.id).source
          ) {
            hitSplatConnections.set(hit.id, {
              ...(hitSplatConnections.get(hit.id) || {}),

              source: enemyName,

              sourceNode: enemyNode,
            });
          }
        });
      }
    }

    // Create missing links between HitSplats and Characters

    const newLinks = [];

    data.nodes.forEach((node) => {
      if (
        node.label === "Combat" &&
        node.properties &&
        node.properties.direction === "incoming"
      ) {
        const connection = hitSplatConnections.get(node.id);

        if (connection && connection.source && connection.sourceNode) {
          // Check if we already have this link

          const hasLink = data.links.some((link) => {
            const sourceId =
              typeof link.source === "object" ? link.source.id : link.source;

            const targetId =
              typeof link.target === "object" ? link.target.id : link.target;

            return (
              (sourceId === connection.sourceNode.id &&
                targetId === node.id &&
                link.type === "PERFORMED") ||
              (sourceId === connection.sourceNode.id &&
                targetId === node.id &&
                link.type === "CAUSED")
            );
          });

          // Only add the link if it doesn't already exist

          if (!hasLink) {
            const linkType =
              connection.sourceNode.label === "Affliction"
                ? "CAUSED"
                : "PERFORMED";

            newLinks.push({
              id: `link-${connection.sourceNode.id}-${node.id}`,

              source: connection.sourceNode.id,

              target: node.id,

              type: linkType,
            });
          }
        }
      }
    });

    // Update the node names with better information

    const updatedNodes = data.nodes.map((node) => {
      if (node.label === "Combat" && node.properties) {
        const connection = hitSplatConnections.get(node.id);

        if (connection) {
          if (node.properties.direction === "outgoing" && connection.target) {
            return {
              ...node,

              name: `Hit ${connection.target} for ${
                node.properties.damage || "0"
              } damage`,
            };
          } else if (
            node.properties.direction === "incoming" &&
            connection.source
          ) {
            return {
              ...node,

              name: `Took ${node.properties.damage || "0"} damage from ${
                connection.source
              }`,
            };
          }
        }

        // For incoming hits that still have no source, get the damage type

        if (
          node.properties.direction === "incoming" &&
          (!connection || !connection.source)
        ) {
          // Try to use damage type as source if available

          let source = "Unknown";

          if (node.properties.damageType) {
            source = node.properties.damageType;
          } else if (node.properties.typeString) {
            source = node.properties.typeString;
          }

          return {
            ...node,

            name: `Took ${node.properties.damage || "0"} damage from ${source}`,
          };
        }
      }

      return node;
    });

    return {
      ...data,

      nodes: updatedNodes,

      // Add the new links to the existing links

      links: [...data.links, ...newLinks],
    };
  };

  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setLoading(true);

        const data = await apiService.getGraphData(userId, playerId);

        // Process the data to improve HitSplat node names

        const fixedData = fixHitSplatNodeNames(data);

        setGraphData(fixedData);

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

  // Handle node hover

  const handleNodeHover = (node) => {
    setHoveredNode(node);

    if (node) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  };

  // Handle node click - now with multi-select

  const handleNodeClick = (node, event) => {
    // Create a new set based on the current selection

    const newSelection = new Set(highlightedNodes);

    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      // Multi-select mode (with Ctrl/Cmd/Shift key)

      if (newSelection.has(node)) {
        // If already selected, remove it

        newSelection.delete(node);
      } else {
        // Otherwise add it to selection

        newSelection.add(node);
      }
    } else {
      // Single select mode (no modifier key)

      if (newSelection.size === 1 && newSelection.has(node)) {
        // If clicking the only selected node, deselect it

        newSelection.clear();
      } else {
        // Otherwise, select only this node

        newSelection.clear();

        newSelection.add(node);
      }
    }

    setHighlightedNodes(newSelection);

    // Clear any existing auto-zoom timers

    if (autoZoomTimerRef.current) {
      clearTimeout(autoZoomTimerRef.current);

      autoZoomTimerRef.current = null;
    }

    // Set a new timer for auto-zoom after interaction

    autoZoomTimerRef.current = setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400, 40);
      }
    }, 30000); // 30 seconds after user interaction
  };

  // Get all neighbor nodes for all highlighted nodes

  const getAllNeighborNodes = () => {
    if (highlightedNodes.size === 0) return new Set();

    const neighbors = new Set();

    // For each selected node, get its neighbors

    highlightedNodes.forEach((selectedNode) => {
      graphData.links.forEach((link) => {
        const sourceNode =
          typeof link.source === "object" ? link.source : link.source;

        const targetNode =
          typeof link.target === "object" ? link.target : link.target;

        if (
          sourceNode === selectedNode ||
          (typeof sourceNode === "object" && sourceNode.id === selectedNode.id)
        ) {
          neighbors.add(targetNode);
        } else if (
          targetNode === selectedNode ||
          (typeof targetNode === "object" && targetNode.id === selectedNode.id)
        ) {
          neighbors.add(sourceNode);
        }
      });
    });

    // Remove any highlighted nodes from neighbors (they're already highlighted)

    highlightedNodes.forEach((node) => {
      neighbors.delete(node);
    });

    return neighbors;
  };

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

      // Clear any timers when component unmounts

      if (autoZoomTimerRef.current) {
        clearTimeout(autoZoomTimerRef.current);
      }
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

        // Set up auto-zoom timer

        if (autoZoomTimerRef.current) {
          clearTimeout(autoZoomTimerRef.current);
        }

        autoZoomTimerRef.current = setTimeout(() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 40);
          }
        }, 30000); // Auto-recenter after 30 seconds
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

  // Get neighbor nodes of all highlighted nodes

  const neighborNodes = getAllNeighborNodes();

  // Check if a node is highlighted or a neighbor

  const isNodeHighlightedOrNeighbor = (node) => {
    return highlightedNodes.has(node) || neighborNodes.has(node);
  };

  // Calculate node size based on type

  const getNodeSize = (node) => {
    if (!node || !node.label) return 4;

    switch (node.label) {
      case "Character":
        return 1; // Largest

      case "Player":
        return 2;

      case "Item":
        return 1;

      case "Skill":
        return 1;

      case "Combat":
        return 1;

      case "XP Gain":
        return 1;

      case "Inventory Change":
        return 1;

      case "Menu":
        return 1;

      case "Quest Complete":
        return 1;

      case "Diary":
        return 1;

      case "Combat Achievement":
        return 1;

      case "Reward":
        return 1;

      case "Affliction":
        return 1;

      case "Object":
        return 1;

      case "Kill":
        return 1;

      case "Location":
        return 1; // Smallest

      default:
        return 1;
    }
  };

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
            {/* Help and Reset buttons */}

            <Box
              position="absolute"
              top={4}
              right={4}
              zIndex={2}
              display="flex"
              gap={2}
            >
              <Popover
                placement="bottom-end"
                closeOnBlur={true}
                trigger="hover"
              >
                <PopoverTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="#333333"
                    leftIcon={<FaInfoCircle />}
                  >
                    Help
                  </Button>
                </PopoverTrigger>

                <PopoverContent width="250px" _focus={{ outline: "none" }}>
                  <PopoverArrow />

                  <PopoverBody fontSize="sm">
                    <Text fontWeight="bold" mb={1}>
                      Graph Controls:
                    </Text>

                    <Text mb={1}>• Click a node to select it</Text>

                    <Text mb={1}>• Ctrl+click to select multiple nodes</Text>

                    <Text mb={1}>• Drag to pan, scroll to zoom</Text>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                variant="ghost"
                color="#333333"
                border="1px solid #333333"
                onClick={() => {
                  graphRef.current?.zoomToFit(400, 40);

                  setHighlightedNodes(new Set());

                  // Reset auto-zoom timer on manual reset

                  if (autoZoomTimerRef.current) {
                    clearTimeout(autoZoomTimerRef.current);
                  }

                  autoZoomTimerRef.current = setTimeout(() => {
                    if (graphRef.current) {
                      graphRef.current.zoomToFit(400, 40);
                    }
                  }, 30000);
                }}
              >
                Reset View
              </Button>
            </Box>

            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              nodeLabel={(node) => `${node.label}: ${node.name}`}
              nodeRelSize={4} // Base size for nodes
              nodeVal={(node) => getNodeSize(node)} // Dynamic sizing
              nodeColor={(node) => {
                // If nodes are highlighted, dim nodes that aren't connected

                if (highlightedNodes.size > 0) {
                  if (isNodeHighlightedOrNeighbor(node)) {
                    return node.color;
                  }

                  return "rgba(200, 200, 200, 0.5)";
                }

                return node.color;
              }}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              linkLabel={(link) => link.type}
              linkWidth={(link) => {
                // Thinner links overall

                // Highlight links connected to highlighted nodes

                if (highlightedNodes.size > 0) {
                  const sourceNode =
                    typeof link.source === "object" ? link.source : link.source;

                  const targetNode =
                    typeof link.target === "object" ? link.target : link.target;

                  if (
                    highlightedNodes.has(sourceNode) ||
                    highlightedNodes.has(targetNode)
                  ) {
                    return 0.8; // Slightly thicker for highlighted links
                  }

                  return 0.3; // Very thin for non-highlighted links
                }

                return 0.5; // Thin for all links when nothing is highlighted
              }}
              linkColor={(link) => {
                // Lighter links overall

                // Highlight links connected to highlighted nodes

                if (highlightedNodes.size > 0) {
                  const sourceNode =
                    typeof link.source === "object" ? link.source : link.source;

                  const targetNode =
                    typeof link.target === "object" ? link.target : link.target;

                  if (
                    highlightedNodes.has(sourceNode) ||
                    highlightedNodes.has(targetNode)
                  ) {
                    return "rgba(120, 120, 120, 0.6)"; // Slightly darker for highlighted links
                  }

                  return "rgba(180, 180, 180, 0.2)"; // Very light for non-highlighted links
                }

                return "rgba(150, 150, 150, 0.4)"; // Light gray for all links
              }}
              cooldownTicks={100}
              d3Force={(d3Force) => {
                d3Force("center", null);

                d3Force("x", null);

                d3Force("y", null);

                // Strengthen the charge force to spread out nodes more

                d3Force("charge").strength(-120);
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

                // Get node size based on type

                const nodeSize = getNodeSize(node) * (4 / globalScale);

                // Fade node if not highlighted

                let nodeOpacity = 1;

                if (
                  highlightedNodes.size > 0 &&
                  !isNodeHighlightedOrNeighbor(node)
                ) {
                  nodeOpacity = 0.3;
                }

                // Node circle

                ctx.beginPath();

                ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);

                const nodeColor = node.color;

                ctx.fillStyle = nodeColor.startsWith("rgba")
                  ? nodeColor
                  : `rgba(${parseInt(nodeColor.slice(1, 3), 16)}, 



                                   ${parseInt(nodeColor.slice(3, 5), 16)}, 



                                   ${parseInt(nodeColor.slice(5, 7), 16)}, 



                                   ${nodeOpacity})`;

                ctx.fill();

                // Add border for highlighted or hovered nodes

                if (highlightedNodes.has(node) || node === hoveredNode) {
                  ctx.strokeStyle = "#333";

                  ctx.lineWidth = 1 / globalScale;

                  ctx.stroke();
                }

                // Only show labels if the node is highlighted or a direct neighbor

                if (isNodeHighlightedOrNeighbor(node)) {
                  // Text background

                  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

                  ctx.fillRect(
                    node.x - textWidth / 2,

                    node.y + nodeSize + 1,

                    bgDimensions[0],

                    bgDimensions[1]
                  );

                  // Text

                  ctx.textAlign = "center";

                  ctx.textBaseline = "middle";

                  ctx.fillStyle = "#333";

                  ctx.fillText(
                    label,

                    node.x,

                    node.y + nodeSize + fontSize / 2 + 2
                  );
                }
              }}
              onNodeHover={handleNodeHover}
              onNodeClick={handleNodeClick}
            />
          </Box>

          {/* Legend and Selected Count */}

          <Box
            p={2}
            borderTop="1px"
            borderColor={borderColor}
            bg="#efefef"
            height="60px"
            overflowX="auto"
            overflowY="hidden"
          >
            <Box position="relative">
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
          </Box>
        </>
      )}
    </Box>
  );
};

export default Neo4jGraph;
