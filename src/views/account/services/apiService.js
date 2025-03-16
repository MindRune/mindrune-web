import axios from "axios";

// API service
const apiService = {
  // Execute a Neo4j query through our API
  executeQuery: async (query, params = {}) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_HOST}/osrs/query`,
        {
          query,
          params,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  },

  getTotalPoints: async (account) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_HOST}/osrs/scoreboard/${account}`
      );
      return response.data.data[0];
    } catch (error) {
      console.error("Error fetching scoreboard data:", error);
      throw error;
    }
  },

  // Get account data from SQL database
  getAccountData: async (account) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_HOST}/user/info/${account}`
      );
      return response.data.data[0];
    } catch (error) {
      console.error("Error fetching account data:", error);
      throw error;
    }
  },

  // Get account data from SQL database
  getRegistrationKey: async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_HOST}/user/registrationKey`,
        {},
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      return response.data.result[0].registration_key;
    } catch (error) {
      console.error("Error fetching account data:", error);
      throw error;
    }
  },

  // Update account alias
  updateAccount: async (account, newAlias) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_HOST}/user/edit`,
        {
          account,
          alias: newAlias,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating account alias:", error);
      throw error;
    }
  },

  // Get players associated with account from Neo4j
  getPlayerData: async (userId) => {
    try {
      // Get all players associated with this account from Neo4j
      const playersQuery = `
      MATCH (p:Player {account: $account})
      RETURN p.playerId AS id, p.name AS name, p.combatLevel AS combatLevel
    `;

      const playersResult = await apiService.executeQuery(playersQuery, {
        account: userId,
      });
      return playersResult.records.map((record) => ({
        id: record.id,
        name: record.name,
        combatLevel: record.combatLevel,
      }));
    } catch (error) {
      console.error("Error fetching player data:", error);
      throw error;
    }
  },

  // Get graph data for visualization
  getGraphData: async (userId, playerId = null) => {
    try {
      let query;
      const params = { account: userId };

      if (playerId) {
        // Single player mode
        query = `
    MATCH (p:Player {account: $account, playerId: $playerId})
    WITH p
    MATCH (e)-[:PERFORMED_BY]->(p)
    WITH p, e
    LIMIT 10000
    OPTIONAL MATCH (e)-[r]->(n)
    WHERE type(r) <> "PART_OF" AND type(r) <> "PERFORMED_BY"
    WITH p, e, r, n
    RETURN 
      collect(distinct p) as players,
      collect(distinct e) as events,
      collect(distinct n) as entities,
      collect(distinct r) as relationships
  `;
        params.playerId = playerId;

        const result = await apiService.executeQuery(query, params);

        if (!result.records || result.records.length === 0) {
          // If no results, but we know the player ID exists, create a placeholder graph with just the player
          const playerQuery = `
            MATCH (p:Player {account: $account, playerId: $playerId})
            RETURN p.playerId AS id, p.name AS name, p.combatLevel AS combatLevel
          `;
          const playerResult = await apiService.executeQuery(
            playerQuery,
            params
          );

          if (playerResult.records && playerResult.records.length > 0) {
            const playerRecord = playerResult.records[0];
            return {
              nodes: [
                {
                  id: `player-${playerRecord.id}`,
                  label: "Player",
                  name: playerRecord.name || playerRecord.id,
                  color: "#eb4034",
                  properties: {
                    combatLevel: playerRecord.combatLevel,
                    playerId: playerRecord.id,
                  },
                },
              ],
              links: [],
            };
          }
          return { nodes: [], links: [] };
        }

        // Process single player result
        return processGraphData(result.records[0]);
      } else {
        // For multiple players, we need to get player-event relationships first
        const playerEventQuery = `
          MATCH (p:Player {account: $account})
          MATCH (e)-[:PERFORMED_BY]->(p)
          RETURN p.playerId as playerId, e.uuid as eventId
        `;

        const playerEventResult = await apiService.executeQuery(
          playerEventQuery,
          params
        );

        // Create a map to store which events belong to which player
        const playerEventMap = new Map();
        if (playerEventResult.records && playerEventResult.records.length > 0) {
          playerEventResult.records.forEach((record) => {
            const playerId = record.playerId;
            const eventId = record.eventId;

            if (playerId && eventId) {
              if (!playerEventMap.has(playerId)) {
                playerEventMap.set(playerId, new Set());
              }
              playerEventMap.get(playerId).add(eventId);
            }
          });
        }

        // Now get all the data with the same query as before
        query = `
          MATCH (p:Player {account: $account})
          WITH p
          MATCH (e)-[:PERFORMED_BY]->(p)
          WITH p, e
          LIMIT 10000
          OPTIONAL MATCH (e)-[r]->(n)
          WHERE type(r) <> "PART_OF" AND type(r) <> "PERFORMED_BY"
          WITH p, e, r, n
          RETURN 
            collect(distinct p) as players,
            collect(distinct e) as events,
            collect(distinct n) as entities,
            collect(distinct r) as relationships
        `;

        const result = await apiService.executeQuery(query, params);

        if (!result.records || result.records.length === 0) {
          return { nodes: [], links: [] };
        }

        // Process multi-player result with the playerEventMap
        return processGraphData(result.records[0], playerEventMap);
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      throw error;
    }
  },
};

// Helper function to process graph data - moved out of getGraphData for clarity
function processGraphData(record, playerEventMap = null) {
  // Helper function to clean label (remove leading colon)
  function cleanLabel(label) {
    if (typeof label === "string" && label.startsWith(":")) {
      return label.substring(1);
    }
    return label;
  }
  // Extract all nodes and relationships
  const players = record.players || [];
  const events = record.events || [];
  const entities = record.entities || [];
  const relationships = record.relationships || [];

  // Transform Neo4j data to format compatible with visualization libraries
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  // Add players to nodes
  players.forEach((player) => {
    // Check if player has the necessary properties
    if (!player || !player.properties || !player.properties.playerId) {
      console.log("Skipping player due to missing properties:", player);
      return;
    }

    const nodeId = `player-${player.properties.playerId}`;
    if (!nodeMap.has(nodeId)) {
      const node = {
        id: nodeId,
        label: "Player", // This is hardcoded, so no cleaning needed
        name: player.properties.name || player.properties.playerId,
        color: "#000000",
        properties: player.properties,
        // Store the Neo4j node ID to help with relationship mapping
        neo4jId: player.identity ? player.identity.low.toString() : null,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Also map by Neo4j ID for easier relationship linking
      if (player.identity) {
        nodeMap.set(player.identity.low.toString(), node);
      }
    }
  });

  // Add events to nodes
  events.forEach((event) => {
    if (!event || !event.properties || !event.properties.uuid) return;

    const nodeId = `event-${event.properties.uuid}`;
    if (!nodeMap.has(nodeId)) {
      let color = "#999"; // default color
      let label = "Event";

      const eventLabels = event.labels || [];
      // Clean labels by removing leading colons
      const cleanedEventLabels = eventLabels.map(cleanLabel);

      if (cleanedEventLabels.length > 0) {
        if (cleanedEventLabels.includes("CombatEvent")) {
          color = "#ED8936"; // orange - already matches Combat color
          label = "";
        } else if (cleanedEventLabels.includes("XpGainEvent")) {
          color = "#48BB78"; // green - already matches XP Gain color
          label = "";
        } else if (cleanedEventLabels.includes("InventoryChangeEvent")) {
          color = "#9F7AEA"; // purple - already matches Inventory Change color
          label = "";
        } else if (cleanedEventLabels.includes("MenuClickEvent")) {
          color = "#4299E1"; // blue - already matches Menu color
          label = "";
        } else if (cleanedEventLabels.includes("WorldChangeEvent")) {
          color = "#ECC94B"; // yellow - already matches World Change color
          label = "";
        } else if (cleanedEventLabels.includes("QuestCompletionEvent")) {
          color = "#1ff5ef"; // Updated to Quest Complete color
          label = "";
        } else if (cleanedEventLabels.includes("AchievementDiaryEvent")) {
          color = "#B794F4"; // purple - already matches Diary color
          label = "";
        } else if (
          cleanedEventLabels.includes("CombatAchievementEvent")
        ) {
          color = "#F687B3"; // pink - already matches Combat Achievement color
          label = "";
        } else {
          label = cleanedEventLabels[0];
        }
      } else if (event.properties.eventType) {
        label = event.properties.eventType;
      }

      // Extract name from properties
      let name = "Event";
      const props = event.properties;

      if (props.eventType === "HIT_SPLAT") {
        name = `Hit ${props.target || "Unknown"} for ${
          props.damage || "0"
        } damage`;
      } else if (props.eventType === "XP_GAIN") {
        name = `Gained ${props.xpGained || "?"} XP in ${
          props.skill || "Unknown"
        }`;
      } else if (props.eventType === "INVENTORY_CHANGE") {
        name = `Inventory Change`;
      } else if (props.eventType === "MENU_CLICK") {
        name = `${props.action || "?"} ${
          props.target ? ` ${props.target}` : ""
        }`;
      } else if (props.eventType === "WORLD_CHANGE") {
        name = "World Change";
      } else if (
        props.eventType === "QUEST_COMPLETION" &&
        props.questName
      ) {
        name = `${props.questName}`;
      } else if (
        props.eventType === "ACHIEVEMENT_DIARY_COMPLETION" &&
        props.diaryName
      ) {
        name = `${props.diaryName} ${props.diaryTier || ""}`;
      } else if (
        props.eventType === "COMBAT_ACHIEVEMENT_COMPLETION" &&
        props.achievementName
      ) {
        name = `${props.achievementName}`;
      } else {
        name = props.eventType || "Event";
      }

      const node = {
        id: nodeId,
        label,
        name,
        color,
        properties: props,
        // Store the Neo4j node ID to help with relationship mapping
        neo4jId: event.identity ? event.identity.low.toString() : null,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Also map by Neo4j ID for easier relationship linking
      if (event.identity) {
        nodeMap.set(event.identity.low.toString(), node);
      }
    }
  });

  // Add other entities to nodes
  entities.forEach((entity) => {
    if (!entity || !entity.properties) return;

    const entityLabels = entity.labels || [];
    // Clean labels by removing leading colons
    const cleanedEntityLabels = entityLabels.map(cleanLabel);

    if (cleanedEntityLabels.length === 0) return;

    let nodeId;
    let label;
    let name;
    let color = "#999"; // default color

    const props = entity.properties;

    if (cleanedEntityLabels.includes("Item")) {
      // Item handling from before
      nodeId = `item-${props.itemId}`;
      label = "Item";
      name = props.name || `${props.itemId}`;
      color = "#eb4034"; // Updated to Inventory Change color
    } else if (cleanedEntityLabels.includes("Skill")) {
      // Skill handling from before
      nodeId = `skill-${props.name}`;
      label = "Skill";
      name = props.name;
      color = "#ECC94B"; // Updated to Skill color
    } else if (cleanedEntityLabels.includes("Character")) {
      // Character handling from before
      nodeId = `char-${props.name}`;
      label = "Character";
      name = props.name;
      color = "#964B00"; // Updated to Character color
    } else if (cleanedEntityLabels.includes("Location")) {
      // Location handling from before
      nodeId = `loc-${props.x}-${props.y}-${props.plane}`;
      label = "Location";
      name = `(${props.x}, ${props.y}, ${props.plane})`;
      color = "#CBD5E0"; // Kept as is - matches Location color
    } else if (cleanedEntityLabels.includes("Quest")) {
      // Quest handling
      nodeId = `quest-${props.name}`;
      label = "Quest";
      name = props.name;
      color = "#1ff5ef"; // Updated to Quest Complete color
    } else if (cleanedEntityLabels.includes("AchievementDiary")) {
      // Achievement Diary handling
      nodeId = `diary-${props.name}-${props.tier || ""}`;
      label = "Diary";
      name = `${props.name} ${props.tier || ""}`;
      color = "#B794F4"; // Kept as is - matches Diary color
    } else if (cleanedEntityLabels.includes("CombatAchievement")) {
      // Combat Achievement handling
      nodeId = `combat-ach-${props.name}`;
      label = "Combat Achievement";
      name = props.name;
      color = "#F687B3"; // Kept as is - matches Combat Achievement color
    } else {
      nodeId = `entity-${
        entity.identity
          ? entity.identity.low
          : Math.random().toString(36).substring(2, 10)
      }`;
      label = cleanedEntityLabels[0] || "Entity";
      name = props.name || label;
    }

    // Clean the name if it has a colon prefix
    if (typeof name === "string" && name.startsWith(":")) {
      name = name.substring(1);
    }

    // Rest of the entity processing (same as before)
    if (!nodeMap.has(nodeId)) {
      const node = {
        id: nodeId,
        label,
        name,
        color,
        properties: props,
        neo4jId: entity.identity ? entity.identity.low.toString() : null,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      if (entity.identity) {
        nodeMap.set(entity.identity.low.toString(), node);
      }
    }
  });

  const nodeByNeo4jId = new Map();
  nodes.forEach((node) => {
    if (node.neo4jId) {
      nodeByNeo4jId.set(node.neo4jId, node);
    }
  });

  // Process relationships using the already formatted structure
  relationships.forEach((rel) => {
    if (!rel || !rel.source || !rel.target) return;

    // Find source and target nodes using Neo4j IDs
    const sourceId =
      typeof rel.source === "object" && rel.source.low !== undefined
        ? rel.source.low.toString()
        : rel.source.toString();

    const targetId =
      typeof rel.target === "object" && rel.target.low !== undefined
        ? rel.target.low.toString()
        : rel.target.toString();

    const sourceNode = nodeByNeo4jId.get(sourceId);
    const targetNode = nodeByNeo4jId.get(targetId);

    if (sourceNode && targetNode) {
      links.push({
        id: `link-${
          rel.id || Math.random().toString(36).substring(2, 10)
        }`,
        source: sourceNode.id,
        target: targetNode.id,
        type: cleanLabel(rel.type) || "RELATED_TO", // Clean relationship type as well
      });
    }
  });

  // Add explicit links from players to their events
  if (players.length > 0 && events.length > 0) {
    // For multi-player mode with playerEventMap
    if (playerEventMap) {
      players.forEach((player) => {
        if (!player || !player.properties || !player.properties.playerId)
          return;

        const playerId = player.properties.playerId;
        const playerNodeId = `player-${playerId}`;
        const playerEvents = playerEventMap.get(playerId);

        if (playerEvents) {
          events.forEach((event) => {
            if (!event || !event.properties || !event.properties.uuid)
              return;

            const eventId = event.properties.uuid;
            const eventNodeId = `event-${eventId}`;

            // Only connect events that belong to this player
            if (playerEvents.has(eventId)) {
              links.push({
                id: `player-event-${playerId}-${eventId}`,
                source: playerNodeId,
                target: eventNodeId,
                type: "PERFORMED",
              });
            }
          });
        }
      });
    } else {
      // For single player mode, connect all events to the player
      players.forEach((player) => {
        if (!player || !player.properties || !player.properties.playerId)
          return;

        const playerNodeId = `player-${player.properties.playerId}`;
        if (nodeMap.has(playerNodeId)) {
          events.forEach((event) => {
            if (event && event.properties && event.properties.uuid) {
              const eventNodeId = `event-${event.properties.uuid}`;
              if (nodeMap.has(eventNodeId)) {
                links.push({
                  id: `player-event-${player.properties.playerId}-${event.properties.uuid}`,
                  source: playerNodeId,
                  target: eventNodeId,
                  type: "PERFORMED",
                });
              }
            }
          });
        }
      });
    }
  }

  return {
    nodes,
    links,
  };
}

export default apiService;