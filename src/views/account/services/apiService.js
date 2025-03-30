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

  getGraphData: async (userId, playerId = null) => {
    try {
      let query;
      const params = { account: userId };

      if (playerId) {
        // Single player mode with optimized query using CALL {} UNION
        params.playerId = playerId;
        query = `
        // First collect the player
        MATCH (p:Player {account: $account, playerId: $playerId})
        
        // Use CALL blocks for better parallel execution
        CALL {
          WITH p
          
          // Collect incoming relationships in one operation
          CALL {
            WITH p
            MATCH (e)-[r]->(p)
            WHERE type(r) IN ["PERFORMED_BY", "GAINED_BY", "RECEIVED_BY", "TARGETED"]
            RETURN collect(DISTINCT e) AS incoming_events
          }
          
          // Collect outgoing relationships in one operation
          CALL {
            WITH p
            MATCH (p)-[r]->(e)
            WHERE type(r) IN ["PERFORMED", "KILLED"]
            RETURN collect(DISTINCT e) AS outgoing_events
          }
          
          // Combine all events
          WITH p, incoming_events + outgoing_events AS player_events
          RETURN player_events[0..300] AS limited_events
        }
        
        // Collect events with the original player
        WITH p, limited_events
        
        // Collect players and events
        WITH collect({player: p, events: limited_events}) AS player_data
        
        // Process relationships more efficiently using CALL blocks
        CALL {
          WITH player_data
          UNWIND player_data AS pd
          UNWIND pd.events AS event
          WITH collect(DISTINCT pd.player) AS players, collect(DISTINCT event) AS events
          
          // Use parallel CALL blocks for relationship collection
          CALL {
            WITH events
            UNWIND events AS e
            MATCH (e)-[r1]->(n1)
            WHERE NOT type(r1) = "PART_OF"
            RETURN collect(DISTINCT n1) AS out_entities, collect(DISTINCT r1) AS out_rels
          }
          
          CALL {
            WITH events, players
            UNWIND events AS e
            MATCH (n2)-[r2]->(e)
            WHERE NOT n2:Player OR NOT any(p IN players WHERE n2.playerId = p.playerId)
            RETURN collect(DISTINCT n2) AS in_entities, collect(DISTINCT r2) AS in_rels
          }
          
          RETURN players, events, out_entities + in_entities AS entities, out_rels + in_rels AS relationships
        }
        
        RETURN players, events, entities, relationships
        `;

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
        // Multi-player mode with optimized query
        console.log(
          "MULTI-PLAYER MODE: Starting multi-player graph data fetch for account",
          userId
        );

        // Optimized check if any events exist
        console.log("Checking if any events exist for this account");
        const accountEventsQuery = `
          MATCH (p:Player {account: $account})
          CALL {
            WITH p
            OPTIONAL MATCH (e)-[]->(p)
            OPTIONAL MATCH (p)-[]->(e2)
            RETURN count(e) + count(e2) AS eventCount
          }
          RETURN sum(eventCount) AS totalEventCount
        `;

        const accountEventsResult = await apiService.executeQuery(
          accountEventsQuery,
          { account: userId }
        );

        if (
          accountEventsResult.records &&
          accountEventsResult.records.length > 0
        ) {
          const eventCount = accountEventsResult.records[0].totalEventCount;
          console.log(`Total events found for this account: ${eventCount}`);
        }

        // Get all players for this account
        console.log("Running player query with account:", userId);
        const playersQuery = `
          MATCH (p:Player {account: $account})
          RETURN p
        `;

        const playersResult = await apiService.executeQuery(
          playersQuery,
          params
        );

        if (!playersResult.records || playersResult.records.length === 0) {
          console.log("No players found for this account");
          return { nodes: [], links: [] };
        }

        const players = playersResult.records.map((record) => record.p);
        console.log(`Found ${players.length} players for this account`);

        // Log player IDs for debugging
        players.forEach((player) => {
          if (player && player.properties) {
            console.log(
              `Found player: ${player.properties.name} (ID: ${player.properties.playerId})`
            );
          }
        });

        // Optimized unified query for all players using CALL blocks
        if (
          (accountEventsResult.records &&
            accountEventsResult.records.length > 0 &&
            accountEventsResult.records[0].totalEventCount > 0) ||
          true
        ) {
          // Force this path for now
          console.log("Using unified query approach for all players");

          query = `
// First match all players for this account
MATCH (p:Player {account: $account})

// Collect all players and process them in parallel
WITH collect(p) AS all_players

CALL {
  WITH all_players
  UNWIND all_players AS p
  
  // Get player events efficiently with CALL blocks
  CALL {
    WITH p
    // For incoming events, explicitly filter hit splats to ensure proper targeting
    MATCH (e)-[r]->(p)
    WHERE type(r) IN ["PERFORMED_BY", "GAINED_BY", "RECEIVED_BY", "TARGETED"]
    WITH e, p, r
    // For hit splats, ensure the targetPlayerId matches
    WHERE NOT (e:HitSplat AND e.direction = "incoming") OR e.targetPlayerId = p.playerId
    RETURN collect(DISTINCT e) AS in_events
  }
  
  CALL {
    WITH p
    MATCH (p)-[r]->(e)
    WHERE type(r) IN ["PERFORMED", "KILLED"]
    RETURN collect(DISTINCT e) AS out_events
  }
  
  WITH p, in_events + out_events AS player_events
  RETURN collect({player: p, events: player_events}) AS player_data
}
          
          // Process all events and relationships
          WITH player_data
          CALL {
            WITH player_data
            UNWIND player_data AS pd
            WITH pd.player AS player, pd.events AS events
            // Flatten events manually rather than using apoc.coll.flatten
            UNWIND events AS event_item
            WITH player, event_item
            WITH collect(DISTINCT player) AS players, collect(DISTINCT event_item) AS all_events
            
            // Use efficient UNWIND only when necessary
            WITH players, all_events
            UNWIND CASE WHEN size(all_events) > 0 THEN all_events ELSE [null] END AS event
            WITH players, event
            WHERE event IS NOT NULL
            WITH players, collect(DISTINCT event) AS events
            
            // Process relationships
            CALL {
              WITH events
              UNWIND events AS ev
              MATCH (ev)-[r3]->(n1)
              RETURN collect(DISTINCT n1) AS out_nodes, collect(DISTINCT r3) AS out_rels
            }
            
            CALL {
              WITH events
              UNWIND events AS ev
              MATCH (n2)-[r4]->(ev)
              RETURN collect(DISTINCT n2) AS in_nodes, collect(DISTINCT r4) AS in_rels
            }
            
            RETURN players, events, out_nodes + in_nodes AS entities, out_rels + in_rels AS relationships
          }
          
          RETURN players, events, entities, relationships
          `;

          const result = await apiService.executeQuery(query, params);

          if (!result.records || result.records.length === 0) {
            console.log("No data found from unified query approach");
            // Return just player nodes as before
            // Create safe player nodes with proper handling based on Neo4j response format
            const safePlayerNodes = [];
            players.forEach((player) => {
              console.log("Processing player:", player);

              // Check if player data is directly on the player object (not in properties)
              if (player && player.playerId) {
                safePlayerNodes.push({
                  id: `player-${player.playerId}`,
                  label: "Player",
                  name: player.name || player.playerId,
                  color: "#000000",
                  properties: player,
                  neo4jId: player.identity
                    ? player.identity.low.toString()
                    : null,
                });
              }
              // Check if player data is in properties (common Neo4j format)
              else if (
                player &&
                player.properties &&
                player.properties.playerId
              ) {
                safePlayerNodes.push({
                  id: `player-${player.properties.playerId}`,
                  label: "Player",
                  name: player.properties.name || player.properties.playerId,
                  color: "#000000",
                  properties: player.properties,
                  neo4jId: player.identity
                    ? player.identity.low.toString()
                    : null,
                });
              } else {
                console.log(
                  "Warning: Found player with missing playerId",
                  player
                );
              }
            });

            return {
              nodes: safePlayerNodes,
              links: [],
            };
          }

          // Process the result directly with our existing function
          console.log("Processing unified query result");
          return processGraphData(result.records[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      throw error;
    }
  },
};

// Comprehensive function to process graph data from Neo4j
// Modified processGraphData function to handle multi-player properly
// This function ensures events are only connected to their correct player

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

  // Track which events belong to which players
  const eventToPlayerMap = new Map();

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

  // First analyze relationships to determine event-player associations
  // This is crucial for multi-player mode to ensure events are only connected to their proper player
  relationships.forEach((rel) => {
    if (!rel) return;

    // Extract relationship data
    const relType = rel.type || "";

    // Skip if not a player-event relationship
    if (
      ![
        "PERFORMED_BY",
        "GAINED_BY",
        "RECEIVED_BY",
        "TARGETED",
        "PERFORMED",
        "KILLED",
      ].includes(relType)
    ) {
      return;
    }

    // Get source and target Neo4j IDs
    const sourceNeo4jId =
      rel.startNodeIdentity?.low?.toString() ||
      rel.start?.low?.toString() ||
      rel.source?.low?.toString() ||
      (rel.source ? rel.source.toString() : null);

    const targetNeo4jId =
      rel.endNodeIdentity?.low?.toString() ||
      rel.end?.low?.toString() ||
      rel.target?.low?.toString() ||
      (rel.target ? rel.target.toString() : null);

    // Skip if we can't determine source or target
    if (!sourceNeo4jId || !targetNeo4jId) return;

    // Check if this is a player-event relationship
    if (playerNodeIds.has(sourceNeo4jId)) {
      // Player -> Event relationship
      const playerNodeId = playerNodeIds.get(sourceNeo4jId);
      // Extract playerId from the node ID
      const playerId = playerNodeId.replace("player-", "");

      // Associate this event with this player
      if (!eventToPlayerMap.has(targetNeo4jId)) {
        eventToPlayerMap.set(targetNeo4jId, new Set());
      }
      eventToPlayerMap.get(targetNeo4jId).add(playerId);
    } else if (playerNodeIds.has(targetNeo4jId)) {
      // Event -> Player relationship
      const playerNodeId = playerNodeIds.get(targetNeo4jId);
      // Extract playerId from the node ID
      const playerId = playerNodeId.replace("player-", "");

      // Associate this event with this player
      if (!eventToPlayerMap.has(sourceNeo4jId)) {
        eventToPlayerMap.set(sourceNeo4jId, new Set());
      }
      eventToPlayerMap.get(sourceNeo4jId).add(playerId);
    }
  });

  console.log(
    `Built event-player map with ${eventToPlayerMap.size} events mapped to their players`
  );

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

      // Store which player(s) this event belongs to
      let playerIds = [];
      if (event.identity) {
        const eventNeo4jId = event.identity.low.toString();
        if (eventToPlayerMap.has(eventNeo4jId)) {
          playerIds = Array.from(eventToPlayerMap.get(eventNeo4jId));
        }
      }

      const node = {
        id: nodeId,
        label,
        name,
        color,
        properties: props,
        neo4jId: event.identity ? event.identity.low.toString() : null,
        playerIds: playerIds, // Store which players this event belongs to
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
      // MULTI-PLAYER FIX: Check if this is a player-event link and ensure it's connected to the correct player
      const sourceNode = nodeMap.get(sourceNodeId);
      const targetNode = nodeMap.get(targetNodeId);

      if (!sourceNode || !targetNode) return;

      // Check if this is a player-event link
      if (sourceNode.label === "Player" && targetNode.playerIds) {
        // This is a player->event link, make sure this player is associated with this event
        const playerId = sourceNode.properties.playerId.toString();

        // Extra check for hit splats - only connect if this player is the actual target
        if (
          targetNode.properties.eventType === "HIT_SPLAT" &&
          targetNode.properties.direction === "incoming"
        ) {
          // For incoming hit splats, verify this player is the actual target
          const targetPlayerId = targetNode.properties.targetPlayerId;
          if (targetPlayerId && targetPlayerId.toString() !== playerId) {
            // This hit splat is targeting a different player, don't connect
            return;
          }
        }

        if (!targetNode.playerIds.includes(playerId)) {
          // This player should not be connected to this event
          return;
        }
      } else if (targetNode.label === "Player" && sourceNode.playerIds) {
        // This is an event->player link, make sure this player is associated with this event
        const playerId = targetNode.properties.playerId.toString();

        // Extra check for hit splats - only connect if this player is the actual target
        if (
          sourceNode.properties.eventType === "HIT_SPLAT" &&
          sourceNode.properties.direction === "incoming"
        ) {
          // For incoming hit splats, verify this player is the actual target
          const targetPlayerId = sourceNode.properties.targetPlayerId;
          if (targetPlayerId && targetPlayerId.toString() !== playerId) {
            // This hit splat is targeting a different player, don't connect
            return;
          }
        }

        if (!sourceNode.playerIds.includes(playerId)) {
          // This player should not be connected to this event
          return;
        }
      }

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
          const eventNode = nodeMap.get(eventNodeId);

          if (!eventNode) return;

          // MULTI-PLAYER FIX: Only connect to events that belong to this player
          if (
            eventNode.playerIds &&
            !eventNode.playerIds.includes(playerId.toString())
          ) {
            return;
          }

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
