"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "../lib/swr/config";

interface SWRProviderProps {
  children: React.ReactNode;
}

export const SWRProvider: React.FC<SWRProviderProps> = ({ children }) => {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
};
