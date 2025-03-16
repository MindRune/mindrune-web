import React from "react";
import { Icon } from "@chakra-ui/react";
import {
  MdBarChart,
  MdDashboard,
  MdPerson
} from "react-icons/md";
import Home from "views/home";
import Account from "views/account";
import Scoreboard from "views/scoreboard";
import Claim from "views/claim";
import Forge from "views/forge";

const routes = [
  {
    name: "Home",
    layout: "",
    path: "/home", // Changed from "/" to "/home"
    icon: <Icon as={MdDashboard} width='20px' height='20px' color='inherit' />,
    component: Home
  },
  {
    name: "Account",
    layout: "",
    path: "/account",
    icon: <Icon as={MdPerson} width='20px' height='20px' color='inherit' />,
    component: Account
  },
  {
    name: "Scoreboard",
    layout: "",
    path: "/scoreboard",
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    component: Scoreboard
  },
  {
    name: "Claim",
    layout: "",
    path: "/claim",
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    component: Claim
  },
  {
    name: "Forge",
    layout: "",
    path: "/forge",
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    component: Forge
  }
];

export default routes;