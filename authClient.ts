import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import config from "./env";

export const authClient = createAuthClient({
  baseURL: config.BACKEND_URL,
  plugins: [
    expoClient({
      scheme: "app",
      storagePrefix: "auth_prefix",
      storage: SecureStore,
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
});