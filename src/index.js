import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import AdminLayout from "layouts";
import { ChakraProvider } from "@chakra-ui/react";
import { AccountProvider } from "./AccountContext";
import { Buffer } from 'buffer';

window.Buffer = Buffer;

ReactDOM.render(
  <ChakraProvider>
    <React.StrictMode>
      <AccountProvider>
          <Router>
            <Switch>
              <Route path="/" component={AdminLayout} />
              <Redirect from="*" to="/account" />
            </Switch>
          </Router>
      </AccountProvider>
    </React.StrictMode>
  </ChakraProvider>,
  document.getElementById("root")
);