import { Link, Box, useDisclosure, Avatar, useBreakpointValue, useMediaQuery  } from "@chakra-ui/react";
import Footer from "components/footer/FooterAdmin.js";
import Navbar from "components/navbar/NavbarAdmin.js";
import mind_rune from "../..//src/assets/img/mind-rune.webp";
import React, { useState } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import routes from "routes.js";

export default function Dashboard(props) {
  const { ...rest } = props;
  const [isLargerThan1300] = useMediaQuery("(min-width: 1300px)");
  // states and functions
  const [fixed] = useState(false);
  
  // Responsive logo size
  const logoSize = useBreakpointValue({ base: "70px", md: "85px", lg: "100px" });
  const logoTop = useBreakpointValue({ base: "10px", md: "15px", lg: "20px" });
  const logoLeft = useBreakpointValue({ base: "15px", md: "25px", lg: "35px" });

  const getActiveRoute = (routes) => {
    for (let i = 0; i < routes.length; i++) {
      if (
        routes[i].name === "Home" &&
        window.location.pathname === routes[i].layout + routes[i].path
      ) {
        return "Home";
      }
      if (routes[i].subMenu) {
        let subRoute = getActiveRoute(routes[i].subMenu);
        if (subRoute) {
          return subRoute;
        }
      } else {
        if (window.location.pathname === routes[i].layout + routes[i].path) {
          return routes[i].name;
        }
      }
    }
    return null;
  };

  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].name !== "Home") {
        if (routes[i].collapse) {
          let collapseActiveNavbar = getActiveNavbar(routes[i].items);
          if (collapseActiveNavbar) {
            return collapseActiveNavbar;
          }
        } else if (routes[i].category) {
          let categoryActiveNavbar = getActiveNavbar(routes[i].items);
          if (categoryActiveNavbar) {
            return categoryActiveNavbar;
          }
        } else {
          // Check for submenu
          if (routes[i].subMenu) {
            let subRoute = getActiveNavbar(routes[i].subMenu);
            if (subRoute) {
              return subRoute;
            }
          }

          // Check if the current path matches
          if (window.location.pathname === routes[i].layout + routes[i].path) {
            return routes[i].secondary;
          }
        }
      }
    }
    return activeNavbar;
  };


  const getRoutes = (routes) => {
    return routes.flatMap((prop, key) => {
      if (prop.subMenu) {
        return prop.subMenu.map((subProp, subKey) => (
          <Route
            path={subProp.layout + subProp.path}
            component={subProp.component}
            key={`${key}-${subKey}`}
          />
        ));
      }
      return (
        <Route
          path={prop.layout + prop.path}
          component={prop.component}
          key={key}
        />
      );
    });
  };

  const activeRoute = getActiveRoute(routes);
  const activeSecondary = activeRoute !== "Home" && getActiveNavbar(routes);

  document.documentElement.dir = "ltr";
  const { onOpen } = useDisclosure();
  return (
    <Box>
      {isLargerThan1300 && <Link href="/" _hover={{ textDecoration: "none" }}>
        <Avatar
          w={logoSize}
          h={logoSize}
          name="MindRune Logo"
          src={mind_rune}
          position="fixed"
          top={logoTop}
          left={logoLeft}
          zIndex="1000"
          boxShadow="md"
          border="none"
          borderColor="gray.700"
          cursor="pointer"
          display={{ base: "block", sm: "block" }}
        />
      </Link>}
      <Box
        height="100%"
        overflow="auto"
        position="relative"
        maxHeight="100vh"
        w="100%"
        transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
        transitionDuration=".2s, .2s, .35s"
        transitionProperty="top, bottom, width"
        transitionTimingFunction="linear, linear, ease"
      >
        <Box>
          <Navbar
            onOpen={onOpen}
            logoText={"MindRune Logo"}
            brandText={activeRoute}
            secondary={activeSecondary}
            fixed={fixed}
            routes={routes}
            display="none"
            {...rest}
          />
        </Box>
        <Box mx="auto" height="100%" bgColor="#202020">
          <Switch>
            {getRoutes(routes)}
            <Redirect from="/" exact to="/home" />
          </Switch>
        </Box>
        <Box>
          <Footer bottom="0" />
        </Box>
      </Box>
    </Box>
  );
}