import React from "react";
import { Icon } from "@chakra-ui/react";
import {
  MdDashboard,
  MdPerson
} from "react-icons/md";
import Home from "views/home";
import Account from "views/account";
import AuthCallback from "auth/AuthCallback.js";

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
    name: "Callback",
    layout: "",
    path: "/callback",
    icon: <Icon as={MdPerson} width='20px' height='20px' color='inherit' />,
    component: AuthCallback
  },
];

export default routes;