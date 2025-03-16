import React, { useMemo } from 'react';
import { Box, Flex } from "@chakra-ui/react";

// Improved hash function with normalization
const createAvatarHash = (str) => {
  if (!str || typeof str !== 'string') return { h1: 9876543210, h2: 1234567890, h3: 5678901234, h4: 3456789012 };
  
  // Normalize the string input - lowercase, trim whitespace, remove '0x' prefix if present
  const normalized = str.toLowerCase().trim().replace(/^0x/, '');
  
  // Use multiple hashing techniques for maximum variance
  let h1 = 0, h2 = 0, h3 = 0, h4 = 0;
  
  // Different algorithms to create multiple hash values
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    h1 = ((h1 << 5) - h1 + char) & 0xFFFFFFFF;
    h2 = ((h2 << 7) ^ char) & 0xFFFFFFFF;
    h3 = (h3 * 31 + char) & 0xFFFFFFFF;
    h4 = ((h4 << 3) - h4 - char) & 0xFFFFFFFF;
  }
  
  h1 = Math.abs(h1);
  h2 = Math.abs(h2);
  h3 = Math.abs(h3);
  h4 = Math.abs(h4);
  
  return { h1, h2, h3, h4 };
};

// OSRS item colors - expanded with more authentic game colors
const COLORS = {
  // Item colors from OSRS
  primary: [
    '#A12722', // Dragon items
    '#6184BA', // Rune items (more accurate blue)
    '#C7A764', // Gold/gilded items
    '#FFCE55', // Golden items (brighter)
    '#705C48', // Bronze items
    '#7A7978', // Iron items
    '#ABA6A5', // Steel items
    '#91A1C7', // Mithril items
    '#7AD6DE', // Adamant items
    '#E0DCDB', // White items
    '#201B16', // Black items
    '#59774E', // Guthix green
    '#726255', // Leather items
    '#694F39', // Wooden items
    '#AF7655', // Copper items
    '#A66E3D', // Bronze armor
  ],
  
  // Colors from OSRS UI elements
  secondary: [
    '#FF981F', // Energy/spec bar (classic OSRS orange)
    '#0DC10D', // Poison green
    '#FFB83F', // Prayer points
    '#FF0000', // Hitpoints
    '#FFFF00', // Main text color (yellow)
    '#00FFFF', // Cyan text (teleport options)
    '#AD4848', // Damage splats
    '#4CFA48', // Heal splats
    '#3366FF', // Magic
    '#FFFFFF', // White text
    '#00C100', // Green text (trade)
    '#6BB5FF', // Light blue text (public chat)
  ],
  
  // Background colors from OSRS interfaces
  background: [
    '#483F33', // Main OSRS interface brown
    '#3E3529', // Chatbox brown
    '#5B5242', // Inventory slots
    '#2A2722', // Dark brown borders
    '#171615', // Black background (bank)
    '#000000', // Pure black (modal backgrounds)
    '#47413A', // Lighter interface brown
  ]
};

// OSRS Item elements that appear in the avatar
const OSRS_ITEMS = [
  // Dragon Scimitar - iconic OSRS weapon
  (color, size=35) => (
    <>
      {/* Blade */}
      <Box
        position="absolute"
        top="30%"
        left="30%"
        width={`${size * 0.35}px`}
        height={`${size * 0.25}px`}
        bg={color}
        borderRadius="1px"
        transform="rotate(-10deg) skewX(30deg)"
        zIndex={2}
      />
      {/* Handle */}
      <Box
        position="absolute"
        bottom="30%"
        right="30%"
        width={`${size * 0.1}px`}
        height={`${size * 0.25}px`}
        bg="#8B4513"
        borderRadius="1px"
        transform="rotate(-10deg)"
        zIndex={1}
      />
      {/* Guard */}
      <Box
        position="absolute"
        top="55%"
        left="45%"
        width={`${size * 0.25}px`}
        height={`${size * 0.08}px`}
        bg="#FFD700"
        borderRadius="1px"
        transform="rotate(-10deg)"
        zIndex={3}
      />
    </>
  ),
  
  // Rune Platebody - iconic armor
  (color, size=35) => (
    <>
      {/* Main body */}
      <Box
        position="absolute"
        top="25%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.6}px`}
        height={`${size * 0.4}px`}
        bg={color}
        borderRadius="2px"
        zIndex={1}
      />
      {/* Shoulder left */}
      <Box
        position="absolute"
        top="30%"
        left="25%"
        width={`${size * 0.15}px`}
        height={`${size * 0.15}px`}
        bg={color}
        borderRadius="full"
        zIndex={2}
      />
      {/* Shoulder right */}
      <Box
        position="absolute"
        top="30%"
        right="25%"
        width={`${size * 0.15}px`}
        height={`${size * 0.15}px`}
        bg={color}
        borderRadius="full"
        zIndex={2}
      />
      {/* Trim line */}
      <Box
        position="absolute"
        top="45%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.4}px`}
        height={`${size * 0.05}px`}
        bg="#FFD700"
        zIndex={3}
      />
    </>
  ),
  
  // Abyssal Whip - popular weapon
  (color, size=35) => (
    <>
      {/* Whip body - curved shape */}
      <Box
        position="absolute"
        top="20%"
        left="30%"
        width={`${size * 0.4}px`}
        height={`${size * 0.5}px`}
        borderRadius={`${size * 0.2}px 0 0 ${size * 0.2}px`}
        border={`${size * 0.03}px solid ${color}`}
        borderRight="none"
        transform="rotate(30deg)"
        zIndex={2}
      />
      {/* Handle */}
      <Box
        position="absolute"
        bottom="25%"
        right="35%"
        width={`${size * 0.08}px`}
        height={`${size * 0.2}px`}
        bg="#8B4513"
        borderRadius="1px"
        transform="rotate(30deg)"
        zIndex={1}
      />
    </>
  ),
  
  // Party Hat - rare item
  (color, size=35) => (
    <>
      {/* Hat base */}
      <Box
        position="absolute"
        top="30%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.6}px`}
        height={`${size * 0.3}px`}
        bg={color}
        clipPath="polygon(0 100%, 50% 0, 100% 100%)"
        zIndex={2}
      />
      {/* Rim */}
      <Box
        position="absolute"
        top="60%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.6}px`}
        height={`${size * 0.05}px`}
        bg="#FFFFFF"
        zIndex={3}
      />
    </>
  ),
  
  // Dragon Full Helm
  (color, size=35) => (
    <>
      {/* Helm base */}
      <Box
        position="absolute"
        top="30%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.5}px`}
        height={`${size * 0.4}px`}
        bg={color}
        borderRadius={`${size * 0.25}px ${size * 0.25}px 0 0`}
        zIndex={1}
      />
      {/* Face guard */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.4}px`}
        height={`${size * 0.15}px`}
        bg="#222222"
        zIndex={2}
      />
      {/* Spike */}
      <Box
        position="absolute"
        top="20%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.08}px`}
        height={`${size * 0.15}px`}
        bg={color}
        zIndex={1}
      />
    </>
  ),
  
  // Fire Cape - iconic cape
  (color, size=35) => (
    <>
      {/* Cape base */}
      <Box
        position="absolute"
        top="20%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.5}px`}
        height={`${size * 0.6}px`}
        bg="#FF4500"
        borderRadius="2px"
        zIndex={1}
      />
      {/* Lava streaks */}
      <Box
        position="absolute"
        top="30%"
        left="40%"
        width={`${size * 0.15}px`}
        height={`${size * 0.4}px`}
        bg="#FFCC00"
        transform="rotate(10deg)"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="35%"
        right="40%"
        width={`${size * 0.1}px`}
        height={`${size * 0.3}px`}
        bg="#FFCC00"
        transform="rotate(-15deg)"
        zIndex={2}
      />
    </>
  ),
  
  // Magic Potion
  (color, size=35) => (
    <>
      {/* Bottle */}
      <Box
        position="absolute"
        top="35%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.3}px`}
        height={`${size * 0.4}px`}
        bg="#6184BA"
        borderRadius="2px"
        zIndex={1}
      />
      {/* Neck */}
      <Box
        position="absolute"
        top="25%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.15}px`}
        height={`${size * 0.1}px`}
        bg="#333333"
        zIndex={2}
      />
      {/* Liquid line */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.3}px`}
        height={`${size * 0.03}px`}
        bg="#FFFFFF"
        opacity={0.5}
        zIndex={2}
      />
    </>
  ),
  
  // Rune Essence
  (color, size=35) => (
    <>
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width={`${size * 0.4}px`}
        height={`${size * 0.4}px`}
        bg="#DDDDDD"
        opacity={0.9}
        zIndex={1}
      />
      {/* Rune symbols */}
      <Box
        position="absolute"
        top="40%"
        left="40%"
        width={`${size * 0.1}px`}
        height={`${size * 0.2}px`}
        bg="#3366FF"
        opacity={0.8}
        zIndex={2}
      />
      <Box
        position="absolute"
        top="40%"
        right="40%"
        width={`${size * 0.15}px`}
        height={`${size * 0.05}px`}
        bg="#3366FF"
        opacity={0.8}
        zIndex={2}
      />
    </>
  ),
  
  // Slayer Helmet
  (color, size=35) => (
    <>
      {/* Helmet base */}
      <Box
        position="absolute"
        top="30%"
        left="50%"
        transform="translateX(-50%)"
        width={`${size * 0.5}px`}
        height={`${size * 0.35}px`}
        bg="#777777"
        borderRadius={`${size * 0.25}px ${size * 0.25}px 0 0`}
        zIndex={1}
      />
      {/* Red eye */}
      <Box
        position="absolute"
        top="45%"
        left="40%"
        width={`${size * 0.15}px`}
        height={`${size * 0.1}px`}
        bg="#FF0000"
        borderRadius="full"
        zIndex={2}
      />
      {/* Spikes on top */}
      <Box
        position="absolute"
        top="25%"
        left="40%"
        width={`${size * 0.05}px`}
        height={`${size * 0.1}px`}
        bg="#333333"
        transform="rotate(-15deg)"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="25%"
        right="40%"
        width={`${size * 0.05}px`}
        height={`${size * 0.1}px`}
        bg="#333333"
        transform="rotate(15deg)"
        zIndex={2}
      />
    </>
  )
];

// Background patterns inspired by OSRS interfaces
const BACKGROUND_PATTERNS = [
  // Basic OSRS interface background (brown with slight texture)
  (color) => (
    <>
      <Box position="absolute" top="0" left="0" width="100%" height="100%" bg={color} />
      {/* Add subtle texture dots */}
      <Box 
        position="absolute" top="20%" left="20%" 
        width="2px" height="2px" 
        bg="#000000" opacity={0.1} 
      />
      <Box 
        position="absolute" top="40%" right="30%" 
        width="2px" height="2px" 
        bg="#000000" opacity={0.1} 
      />
      <Box 
        position="absolute" bottom="30%" left="35%" 
        width="2px" height="2px" 
        bg="#000000" opacity={0.1} 
      />
      <Box 
        position="absolute" bottom="20%" right="20%" 
        width="2px" height="2px" 
        bg="#000000" opacity={0.1} 
      />
    </>
  ),
  
  // Inventory slot pattern (with the characteristic bevel)
  (bgColor, borderColor) => (
    <>
      <Box position="absolute" top="0" left="0" width="100%" height="100%" bg={bgColor} />
      {/* Classic OSRS inventory slot beveled edge */}
      <Box position="absolute" top="0" left="0" width="100%" height="100%" 
           borderTop={`2px solid ${borderColor}`}
           borderLeft={`2px solid ${borderColor}`}
           borderRight={`2px solid #000000`}
           borderBottom={`2px solid #000000`} />
    </>
  ),
  
  // Split background (like chat options)
  (color1, color2) => (
    <>
      <Box position="absolute" top="0" left="0" width="100%" height="50%" bg={color1} />
      <Box position="absolute" bottom="0" left="0" width="100%" height="50%" bg={color2} />
      {/* Divider line */}
      <Box 
        position="absolute" 
        top="50%" left="0" 
        width="100%" height="1px" 
        bg="#000000" opacity={0.3} 
      />
    </>
  ),
  
  // Corner decorated background (like scrolls)
  (bgColor, borderColor) => (
    <>
      <Box position="absolute" top="0" left="0" width="100%" height="100%" bg={bgColor} />
      
      {/* Corner decorations */}
      <Box 
        position="absolute" top="3px" left="3px" 
        width="5px" height="5px" 
        bg={borderColor} 
      />
      <Box 
        position="absolute" top="3px" right="3px" 
        width="5px" height="5px" 
        bg={borderColor} 
      />
      <Box 
        position="absolute" bottom="3px" left="3px" 
        width="5px" height="5px" 
        bg={borderColor} 
      />
      <Box 
        position="absolute" bottom="3px" right="3px" 
        width="5px" height="5px" 
        bg={borderColor} 
      />
    </>
  ),
  
  // Prayer background (blue gradient like prayer interface)
  (bgColor) => (
    <>
      <Box position="absolute" top="0" left="0" width="100%" height="100%" bg="#1F3D6B" />
      <Box 
        position="absolute" 
        top="30%" left="0" 
        width="100%" height="40%" 
        bgGradient="linear(to-b, #1F3D6B, #2A5398, #1F3D6B)" 
      />
    </>
  )
];

// Accent elements inspired by OSRS emblems
const ACCENT_ELEMENTS = [
  // Prayer symbol
  (color) => (
    <>
      <Box
        position="absolute"
        top="65%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="4px"
        height="12px"
        bg={color}
        zIndex={5}
      />
      <Box
        position="absolute"
        top="60%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="10px"
        height="4px"
        bg={color}
        zIndex={5}
      />
    </>
  ),
  
  // Combat icon (crossed swords)
  (color) => (
    <>
      <Box
        position="absolute"
        bottom="20%"
        left="40%"
        width="10px"
        height="2px"
        bg={color}
        transform="rotate(45deg)"
        zIndex={5}
      />
      <Box
        position="absolute"
        bottom="20%"
        right="40%"
        width="10px"
        height="2px"
        bg={color}
        transform="rotate(-45deg)"
        zIndex={5}
      />
    </>
  ),
  
  // Magic icon (star)
  (color) => (
    <>
      <Box
        position="absolute"
        bottom="20%"
        left="50%"
        transform="translate(-50%, 0)"
        width="12px"
        height="12px"
        zIndex={5}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path 
            d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" 
            fill={color} 
          />
        </svg>
      </Box>
    </>
  ),
  
  // Ranged icon (bow)
  (color) => (
    <>
      <Box
        position="absolute"
        bottom="25%"
        left="50%"
        transform="translateX(-50%)"
        width="2px"
        height="14px"
        bg={color}
        zIndex={5}
      />
      <Box
        position="absolute"
        bottom="25%"
        left="50%"
        transform="translateX(-50%) rotate(-30deg)"
        width="8px"
        height="2px"
        bg={color}
        borderRadius="1px"
        transformOrigin="left center"
        zIndex={5}
      />
      <Box
        position="absolute"
        bottom="25%"
        left="50%"
        transform="translateX(-50%) rotate(30deg)"
        width="8px"
        height="2px"
        bg={color}
        borderRadius="1px"
        transformOrigin="left center"
        zIndex={5}
      />
    </>
  ),
  
  // None
  () => null
];

const OSRSAvatar = ({ account, size = 35 }) => {
  // Generate the avatar only when account changes
  return useMemo(() => {
    const safeAccount = account || "";
    
    // Generate multiple hash values for maximum variance
    const { h1, h2, h3, h4 } = createAvatarHash(safeAccount);
    
    // Select a background pattern
    const bgPatternIndex = h1 % BACKGROUND_PATTERNS.length;
    
    // Select an OSRS item
    const itemIndex = h2 % OSRS_ITEMS.length;
    
    // Select an accent element
    const accentIndex = h3 % ACCENT_ELEMENTS.length;
    
    // Select colors
    const primaryColorIndex = h1 % COLORS.primary.length;
    const secondaryColorIndex = (h2 >> 4) % COLORS.secondary.length;
    const bgColorIndex = h4 % COLORS.background.length;
    
    // Get actual colors
    const primaryColor = COLORS.primary[primaryColorIndex];
    const secondaryColor = COLORS.secondary[secondaryColorIndex];
    const bgColor = COLORS.background[bgColorIndex];
    
    // Generate each element
    const backgroundElement = 
      bgPatternIndex <= 2 
        ? BACKGROUND_PATTERNS[bgPatternIndex](bgColor, secondaryColor)
        : BACKGROUND_PATTERNS[bgPatternIndex](bgColor, primaryColor);
    
    const itemElement = OSRS_ITEMS[itemIndex](primaryColor, size);
    
    const accentElement = accentIndex === ACCENT_ELEMENTS.length - 1
      ? null
      : ACCENT_ELEMENTS[accentIndex](secondaryColor);
    
    return (
      <Box
        position="relative"
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="full"
        overflow="hidden"
        boxShadow="md"
        // Key for React, but without Date.now() to ensure consistency
        key={`osrs-avatar-${safeAccount}`}
      >
        {/* Background */}
        {backgroundElement}
        
        {/* OSRS Item */}
        {itemElement}
        
        {/* Accent Element */}
        {accentElement}
      </Box>
    );
  }, [account, size]);
};

export default OSRSAvatar;