// src/index.js or wherever you configure Apollo

import React from "react";
import ReactDOM from "react-dom/client";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  split,
  HttpLink,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import App from "./App";
import { ApolloLink, Observable } from "@apollo/client/core";
import { print } from "graphql";

const APPSYNC_URL = process.env.REACT_APP_APPSYNC_URL; // e.g. https://xxx.appsync-api.us-east-1.amazonaws.com/graphql
const APPSYNC_API_KEY = process.env.REACT_APP_APPSYNC_API_KEY;

if (!APPSYNC_URL) {
  console.error("APPSYNC_URL is not set! Check your .env file.");
}

if (!APPSYNC_API_KEY) {
  console.error("APPSYNC_API_KEY is not set! Check your .env file.");
}

// Derive the HTTP host from the AppSync URL
const APPSYNC_HOST = new URL(APPSYNC_URL).host; // e.g. "yourappsync.appsync-api.us-east-1.amazonaws.com"

// 1) For queries/mutations (HTTP)
const httpLink = new HttpLink({
  uri: APPSYNC_URL,
  headers: {
    "x-api-key": APPSYNC_API_KEY,
  },
});

function encodeAppSyncCredentials() {
  const creds = {
    host: APPSYNC_HOST,
    "x-api-key": APPSYNC_API_KEY,
  };
  return window.btoa(JSON.stringify(creds));
}

function getWebsocketUrl() {
  // Convert https:// to wss:// and append /realtime for WebSocket connections
  const wsUrl = APPSYNC_URL.replace('https://', 'wss://') + '/realtime';
  const header = encodeAppSyncCredentials();
  const payload = window.btoa(JSON.stringify({}));
  return `${wsUrl}?header=${header}&payload=${payload}`;
}

const subscriptionLink = new ApolloLink((operation) => {
  return new Observable((observer) => {
    const wsUrl = getWebsocketUrl();
    console.log("Attempting WebSocket connection to:", wsUrl);

    const websocket = new WebSocket(wsUrl, ["graphql-ws"]);

    // Generate a unique subscription ID (ensure uniqueness for each session)
    const subscriptionId = window.crypto.randomUUID();

    websocket.onopen = () => {
      console.log("WebSocket open, sending connection_init");
      websocket.send(JSON.stringify({ type: "connection_init" }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("WebSocket received message:", message);

      if (message.type === "connection_ack") {
        // Connection acknowledged. Now send the subscription start message.
        const { query, variables, operationName } = operation;
        const queryString = print(query);

        const startMessage = {
          id: subscriptionId,
          type: "start",
          payload: {
            data: JSON.stringify({
              query: queryString,
              variables,
              operationName,
            }),
            extensions: {
              authorization: {
                host: new URL(APPSYNC_URL).host,
                "x-api-key": APPSYNC_API_KEY,
              },
            },
          },
        };

        console.log("Sending start message:", startMessage);
        websocket.send(JSON.stringify(startMessage));
      } else if (message.type === "ka") {
        // Ignore keep-alive messages.
        return;
      } else if (message.type === "data") {
        console.log("Received data message:", message.payload);
        observer.next(message.payload);
      } else if (message.type === "error") {
        console.error("Received error message:", message.payload);
        observer.error(message.payload);
      } else if (message.type === "complete") {
        observer.complete();
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket encountered an error:", error);
      observer.error(error);
    };

    // Cleanup when unsubscribing.
    return () => {
      const stopMessage = { id: subscriptionId, type: "stop" };
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(stopMessage));
      }
      websocket.close();
    };
  });
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  subscriptionLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);