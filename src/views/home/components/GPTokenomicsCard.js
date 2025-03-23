import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Text, 
  Flex, 
  Heading, 
  Divider, 
  HStack,
  useBreakpointValue,
  SimpleGrid,
  Skeleton
} from '@chakra-ui/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Award } from 'lucide-react';

const GPTokenomicsCard = () => {
  // State to handle safe rendering
  const [chartMounted, setChartMounted] = useState(false);
  
  // Responsive values
  const chartHeight = useBreakpointValue({ base: "200px", sm: "250px", md: "300px", lg: "350px" });
  const pieRadius = useBreakpointValue({ base: 60, sm: 80, md: 100 });
  const fontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });
  const subHeadingSize = useBreakpointValue({ base: "sm", md: "md" });
  const iconSize = useBreakpointValue({ base: 16, md: 20 });
  const legendHeight = useBreakpointValue({ base: 110, md: 80 });
  const legendLayout = useBreakpointValue({ base: "horizontal", md: "vertical" });
  const legendFontSize = useBreakpointValue({ base: '11px', sm: '13px', md: '15px' });
  const spacing = useBreakpointValue({ base: 2, md: 3 });
  const pieTop = useBreakpointValue({ base: "60%", md: "60%", lg: "50%" });
  // Safely mount chart after component is fully rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartMounted(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const distributionData = [
    { name: 'Dev Excellerator (10%) - $GP Staker Voted', value: 10, color: '#38B2AC' }, // Teal
    { name: 'MindRune Core Team (5%) - 2y vest | 1y cliff', value: 5, color: '#F56565' }, // Red
    { name: 'Player Rewards and Events (85%)', value: 85, color: '#667EEA' }, // Indigo/Blue
  ];

  return (
    <Card
      w="100%"
      h={{ base: "auto", sm: "auto", md: "auto", lg: "800px" }}
      minH={{ base: "500px", sm: "500px" }}
      mt={{ base: 0, sm: 0, md: "-40px" }}
      boxShadow="lg"
      backgroundColor="#FFFFFF"
      zIndex={2}
      p={{ base: 3, sm: 4, md: 8 }}
      bg="#efefef"
      borderRadius="8px"
      position="relative"
      overflow={{ base: "visible", md: "auto" }}
    >
      <Heading as="h2" size={headingSize} mb={3} textAlign="center">
        $GP Token Distribution and Utility
      </Heading>
      
      <Text fontSize={fontSize} mb={2}>
        $GP quantifies value and commitment within the MindRune ecosystem with no promise of price accrual. 
        Only active contributors are eligible for rewards.
      </Text>
      
      <Text fontWeight="bold" mb={3} fontSize={fontSize}>
        Total Supply (Max Cash): 2,147,483,647 $GP
      </Text>
      
      <Box height={chartHeight} mb={3}>
        {chartMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy={pieTop}
                labelLine={true}
                outerRadius={pieRadius}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend 
                verticalAlign="bottom" 
                height={legendHeight}
                layout={legendLayout}
                wrapperStyle={{ 
                  fontSize: legendFontSize, 
                  paddingTop: '10px', 
                  fontWeight: 'bold'
                }}
                cy={pieTop}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          // Show skeleton while chart is loading
          <Skeleton height={chartHeight} width="100%" startColor="gray.100" endColor="gray.300" />
        )}
      </Box>
      
      <Divider my={3} />
      
      <Heading as="h3" size={subHeadingSize} mb={3}>
        Utility
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Vote on MindRune features and excellerator recipients</Text>
          </HStack>
        </Box>
        
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Access to premium MindRune website features</Text>
          </HStack>
        </Box>
        
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Dictates API rate limits for developers</Text>
          </HStack>
        </Box>
        
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Incentivizes new applications that utilize The MindRune Graph</Text>
          </HStack>
        </Box>
        
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Funds annual RuneFest sponsorship</Text>
          </HStack>
        </Box>
        
        <Box mb={2}>
          <HStack align="start" spacing={spacing}>
            <Award size={iconSize} />
            <Text fontSize={fontSize} textAlign="left">Fee token for the MindRune Forge</Text>
          </HStack>
        </Box>
      </SimpleGrid>
    </Card>
  );
};

export default GPTokenomicsCard;