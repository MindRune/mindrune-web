import axios from "axios";

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "token",
  ACCOUNT: "account",
  REGISTRATION_KEY: "registration_key",
};

// API service
const apiService = {
  // Helper method to get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },

  // Auth methods
  refreshToken: async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_HOST}/auth/refresh`,
        {},
        {
          headers: apiService.getAuthHeaders(),
        }
      );

      if (response.data.success && response.data.token) {
        localStorage.setItem(
          STORAGE_KEYS.TOKEN,
          response.data.token.replace("Bearer ", "")
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  },

  getRegistrationKey: async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_HOST}/auth/registration-key`,
        {
          headers: apiService.getAuthHeaders(),
        }
      );

      if (response.data.success && response.data.registration_key) {
        localStorage.setItem(
          STORAGE_KEYS.REGISTRATION_KEY,
          response.data.registration_key
        );
        return response.data.registration_key;
      }
      return null;
    } catch (error) {
      console.error("Error fetching registration key:", error);
      throw error;
    }
  },

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
          headers: apiService.getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error executing query:", error);
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
          headers: apiService.getAuthHeaders(),
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

  // Get graph data for visualization with a comprehensive query
  // Updated getGraphData method for multi-player support
  // Only updating the multi-player mode section while keeping single-player untouched

  getGraphData: async (userId, playerId = null) => {
    try {
      let query;
      const params = { account: userId };

      if (playerId) {
        // Single player mode stays exactly the same as you requested
        query = `
      MATCH (p:Player {account: $account, playerId: $playerId})
      
      // Collect ALL events related to this player with various relationship types
      WITH p
      
      // First get events where player is the target with specific relationships
      OPTIONAL MATCH (e1)-[:PERFORMED_BY]->(p)
      OPTIONAL MATCH (e2)-[:GAINED_BY]->(p)
      OPTIONAL MATCH (e3)-[:RECEIVED_BY]->(p)
      OPTIONAL MATCH (e4)-[:TARGETED]->(p)
      
      // Also get events where player is the source
      OPTIONAL MATCH (p)-[:PERFORMED]->(e5)
      OPTIONAL MATCH (p)-[:KILLED]->(e6)
      
      // Group by player and collect events
      WITH p, collect(distinct e1) + collect(distinct e2) + collect(distinct e3) + 
           collect(distinct e4) + collect(distinct e5) + collect(distinct e6) as player_events
      
      // Limit events per player and collect all players
      WITH p, player_events[0..300] as limited_events
      ORDER BY p.playerId
      
      // Collect all players and their events
      WITH collect({player: p, events: limited_events}) as player_data
      
      // Unwind and collect all events
      UNWIND player_data as pd
      UNWIND pd.events as event
      WITH collect(distinct pd.player) as players, collect(distinct event) as events
      
      // Now process relationships for these events
      UNWIND events as e
      
      // Get outgoing relationships from events
      OPTIONAL MATCH (e)-[r1]->(n1)
      WHERE NOT type(r1) = "PART_OF"
      
      // Get incoming relationships to events
      OPTIONAL MATCH (n2)-[r2]->(e)
      WHERE NOT n2:Player OR NOT any(p IN players WHERE n2.playerId = p.playerId)
      
      RETURN 
        players,
        events,
        collect(distinct n1) + collect(distinct n2) as entities,
        collect(distinct r1) + collect(distinct r2) as relationships
      `;
        params.playerId = playerId;

        const result = await apiService.executeQuery(query, params);

        if (!result.records || result.records.length === 0) {
          // If no results, create a placeholder graph with just the player
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
                  color: "#000000",
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

        // Process single player result with improved processing
        return processGraphData(result.records[0], playerId);
      } else {
        // UPDATED Multi-player mode with player-centric processing
        // First, get all players for this account
        const playersQuery = `
        MATCH (p:Player {account: $account})
        RETURN p.playerId AS id, p.name AS name, p.combatLevel AS combatLevel
      `;

        const playersResult = await apiService.executeQuery(
          playersQuery,
          params
        );

        if (!playersResult.records || playersResult.records.length === 0) {
          return { nodes: [], links: [] };
        }

        // Create a base graph with just the player nodes
        const baseGraph = {
          nodes: playersResult.records.map((record) => ({
            id: `player-${record.id}`,
            label: "Player",
            name: record.name || record.id,
            color: "#000000",
            properties: {
              combatLevel: record.combatLevel,
              playerId: record.id,
            },
          })),
          links: [],
        };

        // Get data for all players with a modified query that processes each player separately
        query = `
      MATCH (p:Player {account: $account})
      
      // Process each player separately to ensure proper data association
      WITH p
      
      // For each player, get a limited set of their most relevant events
      OPTIONAL MATCH (e1)-[:PERFORMED_BY]->(p)
      OPTIONAL MATCH (e2)-[:GAINED_BY]->(p)
      OPTIONAL MATCH (e3)-[:RECEIVED_BY]->(p)
      OPTIONAL MATCH (e4)-[:TARGETED]->(p)
      OPTIONAL MATCH (p)-[:PERFORMED]->(e5)
      OPTIONAL MATCH (p)-[:KILLED]->(e6)
      
      // Collect events for this player
      WITH p, 
           collect(distinct e1) + 
           collect(distinct e2) + 
           collect(distinct e3) + 
           collect(distinct e4) + 
           collect(distinct e5) + 
           collect(distinct e6) as events
      
      // Limit to most recent/relevant events
      WITH p, events[0..30] as limited_events
      
      // Get player and player's events
      RETURN p as player, limited_events as events
      `;

        const result = await apiService.executeQuery(query, params);

        if (!result.records || result.records.length === 0) {
          return baseGraph; // Return just player nodes if no events
        }

        // Process each player's data separately and combine results
        const combinedGraph = {
          nodes: [...baseGraph.nodes],
          links: [],
        };

        // Track nodes we've already added to avoid duplicates
        const addedNodeIds = new Set(baseGraph.nodes.map((node) => node.id));

        // Process each player's data separately
        for (const record of result.records) {
          const player = record.player;
          const events = record.events || [];

          if (
            !player ||
            !player.properties ||
            !player.properties.playerId ||
            events.length === 0
          ) {
            continue;
          }

          // Get expanded data for this player's events
          const playerEventsQuery = `
        UNWIND $eventIds as eventId
        MATCH (e) WHERE id(e) = eventId
        
        // Get outgoing relationships from events
        OPTIONAL MATCH (e)-[r1]->(n1)
        WHERE NOT type(r1) = "PART_OF"
        
        // Get incoming relationships to events
        OPTIONAL MATCH (n2)-[r2]->(e)
        WHERE NOT n2:Player OR n2.playerId <> $playerId
        
        RETURN 
          collect(distinct e) as events,
          collect(distinct n1) + collect(distinct n2) as entities,
          collect(distinct r1) + collect(distinct r2) as relationships
        `;

          // Extract event IDs for this player
          const eventIds = events
            .filter((event) => event && event.identity)
            .map((event) => event.identity.low);

          // Skip if no events
          if (eventIds.length === 0) continue;

          // Query for expanded event data for this player
          const eventResult = await apiService.executeQuery(playerEventsQuery, {
            eventIds,
            playerId: player.properties.playerId,
          });

          if (!eventResult.records || eventResult.records.length === 0)
            continue;

          // Process this player's data
          const playerRecord = eventResult.records[0];

          // Create a temporary structure for processing
          const tempRecord = {
            players: [player],
            events: playerRecord.events || [],
            entities: playerRecord.entities || [],
            relationships: playerRecord.relationships || [],
          };

          // Process this player's graph data
          const playerGraph = processGraphData(
            tempRecord,
            player.properties.playerId
          );

          // Merge into combined graph (avoid duplicates)
          playerGraph.nodes.forEach((node) => {
            if (!addedNodeIds.has(node.id)) {
              combinedGraph.nodes.push(node);
              addedNodeIds.add(node.id);
            }
          });

          // Add all links
          combinedGraph.links.push(...playerGraph.links);
        }

        return combinedGraph;
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      throw error;
    }
  },
};

// Comprehensive function to process graph data from Neo4j
function processGraphData(record, specificPlayerId = null) {
  console.log("Processing graph data", record);

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

  // Debugging
  console.log(
    `Found: ${players.length} players, ${events.length} events, ${entities.length} entities, ${relationships.length} relationships`
  );

  // Sample some events to understand what we're getting
  if (events.length > 0) {
    const eventTypes = new Set();
    events.slice(0, Math.min(events.length, 10)).forEach((event) => {
      if (event && event.properties && event.properties.eventType) {
        eventTypes.add(event.properties.eventType);
      }
    });
    console.log("Event types in data:", Array.from(eventTypes));
  }

  // Color mapping based on legend
  const colorMap = {
    Player: "#000000",
    Combat: "#f57e64",
    Kill: "#fa0202",
    "XP Gain": "#80bf9b",
    Item: "#F1C40F",
    Menu: "#0279db",
    Inventory: "#78b0de",
    Quest: "#88fcf1",
    Diary: "#F687B3",
    "Combat Achievement": "#e07ede", // "Cmb Achieve" in legend
    Skill: "#027a34",
    Character: "#8B4513",
    Location: "#CBD5E0",
    Reward: "#8E44AD",
    Affliction: "#03fc88",
    Object: "#D0AC5E",
  };

  // Transform Neo4j data to format compatible with visualization libraries
  const nodes = [];
  const links = [];
  const nodeMap = new Map();
  const playerNodeIds = new Map(); // Map player Neo4j ID to node ID

  // Create a map to help with relationship linking by Neo4j ID
  const nodeIdByNeo4jId = new Map();

  // Add players to nodes first to ensure they're prioritized
  players.forEach((player) => {
    // Check if player has the necessary properties
    if (!player || !player.properties || !player.properties.playerId) {
      console.log("Skipping player due to missing properties:", player);
      return;
    }

    const playerId = player.properties.playerId;
    const nodeId = `player-${playerId}`;
    if (!nodeMap.has(nodeId)) {
      const node = {
        id: nodeId,
        label: "Player",
        name: player.properties.name || playerId,
        color: colorMap["Player"],
        properties: player.properties,
        neo4jId: player.identity ? player.identity.low.toString() : null,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Add to neo4j ID map
      if (player.identity) {
        const neo4jId = player.identity.low.toString();
        nodeIdByNeo4jId.set(neo4jId, nodeId);
        playerNodeIds.set(neo4jId, nodeId);
      }
    }
  });

  // Add events to nodes with proper labeling
  events.forEach((event) => {
    if (!event || !event.properties) return;

    // Ensure we have a unique ID for each event
    const eventId =
      event.properties.uuid ||
      `event-${
        event.identity
          ? event.identity.low
          : Math.random().toString(36).substring(2, 10)
      }`;
    const nodeId = `event-${eventId}`;

    if (!nodeMap.has(nodeId)) {
      let color = "#999"; // default color
      let label = "Event";

      // Clean and extract labels
      const eventLabels = event.labels || [];
      const cleanedEventLabels = eventLabels.map(cleanLabel);
      const eventType = event.properties.eventType || "";

      if (cleanedEventLabels.length > 0) {
        // Match against known event types
        if (cleanedEventLabels.includes("HitSplat")) {
          color = colorMap["Combat"];
          label = "Combat";
        } else if (cleanedEventLabels.includes("XpGain")) {
          color = colorMap["XP Gain"];
          label = "XP Gain";
        } else if (cleanedEventLabels.includes("InventoryChange")) {
          color = colorMap["Inventory"];
          label = "Inventory";
        } else if (cleanedEventLabels.includes("MenuClick")) {
          color = colorMap["Menu"];
          label = "Menu";
        } else if (cleanedEventLabels.includes("WorldChangeEvent")) {
          color = colorMap["Location"]; // Using Location color for World Change
          label = "World Change";
        } else if (cleanedEventLabels.includes("QuestCompletionEvent")) {
          color = colorMap["Quest"];
          label = "Quest";
        } else if (cleanedEventLabels.includes("AchievementDiaryEvent")) {
          color = colorMap["Diary"];
          label = "Diary";
        } else if (cleanedEventLabels.includes("CombatAchievementEvent")) {
          color = colorMap["Combat Achievement"];
          label = "Cmb Achieve";
        } else if (cleanedEventLabels.includes("MonsterKill")) {
          color = colorMap["Kill"];
          label = "Kill";
        } else if (cleanedEventLabels.includes("Reward")) {
          color = colorMap["Reward"];
          label = "Reward";
        } else {
          // Use the first label if no specific match
          label = cleanedEventLabels[0];
        }
      }
      // Fallback to event type if no label matched
      else if (eventType) {
        switch (eventType) {
          case "HIT_SPLAT":
            color = colorMap["Combat"];
            label = "Combat";
            break;
          case "XP_GAIN":
            color = colorMap["XP Gain"];
            label = "XP Gain";
            break;
          case "INVENTORY_CHANGE":
            color = colorMap["Inventory"];
            label = "Inventory";
            break;
          case "MENU_CLICK":
            color = colorMap["Menu"];
            label = "Menu";
            break;
          case "WORLD_CHANGE":
            color = colorMap["Location"];
            label = "Location";
            break;
          case "QUEST_COMPLETION":
            color = colorMap["Quest"];
            label = "Quest";
            break;
          case "ACHIEVEMENT_DIARY_COMPLETION":
            color = colorMap["Diary"];
            label = "Diary";
            break;
          case "COMBAT_ACHIEVEMENT_COMPLETION":
            color = colorMap["Combat Achievement"];
            label = "Cmb Achieve";
            break;
          case "MONSTER_KILL":
            color = colorMap["Kill"];
            label = "Kill";
            break;
          case "REWARD":
            color = colorMap["Reward"];
            label = "Reward";
            break;
          default:
            label = eventType;
        }
      }

      // Extract descriptive name from properties
      let name = "Event";
      const props = event.properties;

      // Create readable names based on event type
      if (eventType === "HIT_SPLAT") {
        if (props.direction === "outgoing") {
          // Ensure target is never "Unknown" if possible
          const target = props.target || props.targetName || "Unknown";
          name = `Hit ${target} for ${props.damage || "0"} damage`;
        } else if (props.direction === "incoming") {
          // Ensure source is never "Unknown" if possible
          const source = props.source || props.sourceName || "Unknown";
          name = `Took ${props.damage || "0"} damage from ${source}`;
        } else {
          name = `Hit for ${props.damage || "0"} damage`;
        }
        if (props.isMaxHit) {
          name += " (MAX HIT)";
        }
      } else if (eventType === "XP_GAIN") {
        name = `Gained ${props.xpGained || "?"} XP in ${
          props.skill || "Unknown"
        }`;
        if (props.level) {
          name += ` (Level ${props.level})`;
        }
      } else if (eventType === "INVENTORY_CHANGE") {
        if (props.changeType === "MOVE") {
          name = `Moved ${props.itemName || "item"}`;
        } else {
          name = `${props.changeType || "Changed"} ${props.itemName || "item"}`;
          if (props.quantity && props.quantity > 1) {
            name += ` x${props.quantity}`;
          }
        }
      } else if (eventType === "MENU_CLICK") {
        name = `${props.action || "?"} ${
          props.target ? ` ${props.target}` : ""
        }`;
        if (props.targetType) {
          name += ` (${props.targetType})`;
        }
      } else if (eventType === "WORLD_CHANGE") {
        name = `World ${props.previousWorldId || "?"} → ${
          props.worldId || "?"
        }`;
      } else if (eventType === "QUEST_COMPLETION" && props.questName) {
        name = `Completed ${props.questName}`;
        if (props.questPoints) {
          name += ` (${props.questPoints} QP)`;
        }
      } else if (
        eventType === "ACHIEVEMENT_DIARY_COMPLETION" &&
        props.diaryName
      ) {
        name = `Completed ${props.diaryName} ${props.diaryTier || ""}`;
      } else if (
        eventType === "COMBAT_ACHIEVEMENT_COMPLETION" &&
        props.achievementName
      ) {
        name = `Unlocked ${props.achievementName}`;
        if (props.tier) {
          name += ` (${props.tier})`;
        }
      } else if (eventType === "MONSTER_KILL") {
        name = `Killed ${props.monsterName || "Unknown monster"}`;
        if (props.combatLevel) {
          name += ` (lvl ${props.combatLevel})`;
        }
        if (props.itemCount && props.itemCount > 0) {
          name += ` - ${props.itemCount} ${
            props.itemCount === 1 ? "drop" : "drops"
          }`;
        }
      } else if (eventType === "REWARD") {
        name = `Reward from ${props.rewardSource || "Unknown source"}`;
        if (props.completionCount && props.completionCount > 1) {
          name += ` (x${props.completionCount})`;
        }
      } else {
        name = props.eventType || "Event";
      }

      const node = {
        id: nodeId,
        label,
        name,
        color,
        properties: props,
        neo4jId: event.identity ? event.identity.low.toString() : null,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Add to neo4j ID map
      if (event.identity) {
        nodeIdByNeo4jId.set(event.identity.low.toString(), nodeId);
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

    // Skip adding Player nodes if they're in the playerNodeIds map
    // This prevents duplicate player nodes
    if (
      entity.identity &&
      playerNodeIds.has(entity.identity.low.toString()) &&
      cleanedEntityLabels.includes("Player")
    ) {
      return;
    }

    let nodeId;
    let label;
    let name;
    let color = "#999"; // default color

    const props = entity.properties;

    // Determine nodeId, label, name, and color based on entity type
    if (cleanedEntityLabels.includes("Item")) {
      const itemName =
        props.name || (props.itemId ? `Item ${props.itemId}` : "Unknown Item");
      nodeId = `item-${itemName}`;
      label = "Item";
      name = itemName;
      color = colorMap["Item"];
    } else if (cleanedEntityLabels.includes("Skill")) {
      nodeId = `skill-${props.name}`;
      label = "Skill";
      name = props.name || "Unknown Skill";
      color = colorMap["Skill"];
    } else if (cleanedEntityLabels.includes("Character")) {
      nodeId = `char-${props.name}`;
      label = "Character";
      name = props.name || "Unknown Character";
      color = colorMap["Character"];
    } else if (cleanedEntityLabels.includes("Location")) {
      nodeId = `loc-${props.x}-${props.y}-${props.plane}`;
      label = "Location";
      name = `(${props.x}, ${props.y}, ${props.plane})`;
      color = colorMap["Location"];
    } else if (cleanedEntityLabels.includes("Quest")) {
      nodeId = `quest-${props.name}`;
      label = "Quest";
      name = props.name || "Unknown Quest";
      color = colorMap["Quest"];
    } else if (cleanedEntityLabels.includes("AchievementDiary")) {
      nodeId = `diary-${props.name}-${props.tier || ""}`;
      label = "Diary";
      name = `${props.name} ${props.tier || ""}`;
      color = colorMap["Diary"];
    } else if (cleanedEntityLabels.includes("CombatAchievement")) {
      nodeId = `combat-ach-${props.name}`;
      label = "Cmb Achieve";
      name = props.name || "Unknown Achievement";
      color = colorMap["Combat Achievement"];
    } else if (cleanedEntityLabels.includes("Object")) {
      nodeId = `object-${props.name}`;
      label = "Object";
      name = props.name || "Unknown Object";
      color = colorMap["Object"];
    } else if (cleanedEntityLabels.includes("World")) {
      nodeId = `world-${props.worldId}`;
      label = "World";
      name = `World ${props.worldId}`;
      color = colorMap["Location"]; // Using Location color
    } else if (
      cleanedEntityLabels.includes("Reward") ||
      cleanedEntityLabels.includes("RewardSource")
    ) {
      nodeId = `reward-${
        props.name ||
        props.rewardId ||
        props.uuid ||
        Math.random().toString(36).substring(2, 10)
      }`;
      label = "Reward";
      name = props.name || props.rewardSource || "Reward";
      color = colorMap["Reward"];
    } else if (cleanedEntityLabels.includes("Affliction")) {
      nodeId = `affliction-${props.name}`;
      label = "Affliction";
      name = props.name || "Unknown Affliction";
      color = colorMap["Affliction"];
    } else if (cleanedEntityLabels.includes("Player")) {
      // Special case for Player nodes found in entities
      // Make sure we use the same ID structure as the primary player nodes
      nodeId = `player-${props.playerId}`;
      label = "Player";
      name = props.name || props.playerId;
      color = colorMap["Player"];

      // Skip if this is not the specific player we're looking for in single-player mode
      if (specificPlayerId && props.playerId !== specificPlayerId) {
        // Still map the Neo4j ID but don't add the node
        if (entity.identity) {
          nodeIdByNeo4jId.set(entity.identity.low.toString(), nodeId);
        }
        return;
      }
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

      // Add to neo4j ID map
      if (entity.identity) {
        nodeIdByNeo4jId.set(entity.identity.low.toString(), nodeId);
      }
    }
  });

  // Process relationships to create links
  relationships.forEach((rel) => {
    if (!rel) return;

    // Extract relationship data
    const relType = rel.type || "RELATED_TO";

    // Get source and target Neo4j IDs
    // Try multiple ways to extract these IDs based on Neo4j's possible formats
    const sourceNeo4jId =
      rel.startNodeIdentity && typeof rel.startNodeIdentity === "object"
        ? rel.startNodeIdentity.low.toString()
        : rel.start &&
          typeof rel.start === "object" &&
          rel.start.low !== undefined
        ? rel.start.low.toString()
        : rel.source &&
          typeof rel.source === "object" &&
          rel.source.low !== undefined
        ? rel.source.low.toString()
        : rel.source
        ? rel.source.toString()
        : null;

    const targetNeo4jId =
      rel.endNodeIdentity && typeof rel.endNodeIdentity === "object"
        ? rel.endNodeIdentity.low.toString()
        : rel.end && typeof rel.end === "object" && rel.end.low !== undefined
        ? rel.end.low.toString()
        : rel.target &&
          typeof rel.target === "object" &&
          rel.target.low !== undefined
        ? rel.target.low.toString()
        : rel.target
        ? rel.target.toString()
        : null;

    // Skip if we can't determine source or target
    if (!sourceNeo4jId || !targetNeo4jId) {
      console.log(
        "Skipping relationship due to missing source or target:",
        rel
      );
      return;
    }

    // Look up corresponding node IDs
    const sourceNodeId = nodeIdByNeo4jId.get(sourceNeo4jId);
    const targetNodeId = nodeIdByNeo4jId.get(targetNeo4jId);

    // Only create links if both source and target nodes exist
    if (sourceNodeId && targetNodeId) {
      const linkId = `link-${
        rel.identity
          ? rel.identity.low
          : Math.random().toString(36).substring(2, 10)
      }`;

      // Extract properties if present
      const relProps = rel.properties || {};

      // Create the link with a clean relationship type
      links.push({
        id: linkId,
        source: sourceNodeId,
        target: targetNodeId,
        type: cleanLabel(relType),
        // Add any properties from the relationship
        properties: relProps,
      });
    } else {
      console.log(
        `Missing nodes for relationship: ${relType}, source=${sourceNeo4jId}, target=${targetNeo4jId}`
      );
    }
  });

  // Add explicit links from players to their events if not already created
  if (players.length > 0 && events.length > 0) {
    // Map of event IDs to help check for existing connections
    const eventConnections = new Map();

    // Build a map of existing connections
    links.forEach((link) => {
      const key = `${link.source}-${link.target}`;
      eventConnections.set(key, true);
    });

    // Process each player
    players.forEach((player) => {
      if (!player || !player.properties || !player.properties.playerId) return;

      const playerId = player.properties.playerId;
      const playerNodeId = `player-${playerId}`;

      // Skip if this is not the specific player we're looking for in single-player mode
      if (specificPlayerId && playerId !== specificPlayerId) return;

      // Check if this player node exists
      if (nodeMap.has(playerNodeId)) {
        events.forEach((event) => {
          if (!event || !event.properties) return;

          const eventId =
            event.properties.uuid ||
            (event.identity ? event.identity.low.toString() : null);

          if (!eventId) return;

          const eventNodeId = `event-${eventId}`;

          // Make sure the event node exists
          if (nodeMap.has(eventNodeId)) {
            // Check if we already have this connection in either direction
            const key1 = `${playerNodeId}-${eventNodeId}`;
            const key2 = `${eventNodeId}-${playerNodeId}`;

            if (!eventConnections.has(key1) && !eventConnections.has(key2)) {
              // Determine the likely relationship type based on event type
              let relType = "PERFORMED";
              let sourceId = playerNodeId;
              let targetId = eventNodeId;

              if (event.properties.eventType === "XP_GAIN") {
                relType = "GAINED";
                // For XP gain, event -> player
                sourceId = eventNodeId;
                targetId = playerNodeId;
              } else if (event.properties.eventType === "REWARD") {
                relType = "RECEIVED";
                // For rewards, event -> player
                sourceId = eventNodeId;
                targetId = playerNodeId;
              } else if (
                event.properties.eventType === "HIT_SPLAT" &&
                event.properties.direction === "incoming"
              ) {
                // For incoming hits, the player is the target
                relType = "TARGETED";
                // For incoming hits, event -> player
                sourceId = eventNodeId;
                targetId = playerNodeId;
              }

              // Add the link with proper direction
              links.push({
                id: `player-event-${playerId}-${eventId}`,
                source: sourceId,
                target: targetId,
                type: relType,
              });

              // Mark this connection as created
              eventConnections.set(`${sourceId}-${targetId}`, true);
            }
          }
        });
      }
    });
  }

  console.log(
    `Prepared graph with ${nodes.length} nodes and ${links.length} links`
  );

  return {
    nodes,
    links,
  };
}

export default apiService;
