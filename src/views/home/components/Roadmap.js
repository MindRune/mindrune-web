import React from "react";
import {
  Box,
  VStack,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepDescription,
  StepSeparator,
  StepNumber,
  StepIcon,
  useSteps,
  useColorModeValue,
  useBreakpointValue
} from "@chakra-ui/react";

const Roadmap = () => {
  const tracColor = useColorModeValue("brand.900", "blue"); // Use a fallback Chakra color name
  
  // Responsive values
  const stepSpacing = useBreakpointValue({ base: 2, md: 4 });
  const titleFontSize = useBreakpointValue({ base: "lg", md: "xl", lg: "2xl" });
  const descFontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
  const stepHeight = useBreakpointValue({ base: "auto", md: "185px" });
  const stepperSize = useBreakpointValue({ base: "md", md: "lg" });
  const iconSize = useBreakpointValue({ base: "20px", md: "24px" });
  const padding = useBreakpointValue({ base: 2, md: 4 });
  const marginLeft = useBreakpointValue({ base: 2, md: 4 });
  
  const steps = [
    {
      title: "The 1st Age: Emergence",
      description:
        `Tell your friends! Beta players are invited to give feedback and report bugs. Expect semi-frequent changes as the MindRune team irons out any data kinks and new tools come online.`,
    },
    { 
      title: "The 2nd Age: Exploration", 
      description: "Let the games begin! As more memories are created, new connections give way to new kinds of insights. As more data is collected, new insights will be able to be revealed." 
    },
    { 
      title: "The 3rd Age: Enlightenment", 
      description: "We have the technology! In The 3rd Age we now have an abundance of data. The focus shifts to buildin features and APIs that utilize The MindRune Graph." 
    },
  ];
  
  const { activeStep } = useSteps({
    index: 0, // You can set the current step here
    count: steps.length,
  });
  
  return (
    <Box w="100%" p={padding} overflowY="auto" h="100%">
      <Stepper
        size={stepperSize}
        index={activeStep}
        orientation="vertical"
        gap="0"
        colorScheme="green"
      >
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon boxSize={iconSize} />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <VStack align="start" ml={marginLeft} spacing={stepSpacing} minH={stepHeight} py={2}>
              <StepTitle fontSize={titleFontSize} color="#202020" lineHeight="1.2">
                {step.title}
              </StepTitle>
              <StepDescription 
                color="gray.600" 
                textAlign="left"
                fontSize={descFontSize}
                mb={4}
              >
                {step.description}
              </StepDescription>
            </VStack>
            <StepSeparator
              borderColor={activeStep > index ? tracColor : "gray.300"}
            />
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default Roadmap;