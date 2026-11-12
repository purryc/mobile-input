import { createContext, useContext, type ReactNode } from "react";
export interface WidgetEnvironment {
  language: string;
  translate: (text: string) => string;
  assetBase: string;
  portalRoot?: HTMLElement | null;
}
const Environment = createContext<WidgetEnvironment>({
  language: "zh-CN",
  translate: (text) => text,
  assetBase: "",
});
export function WidgetProvider({
  children,
  ...value
}: WidgetEnvironment & { children: ReactNode }) {
  return <Environment.Provider value={value}>{children}</Environment.Provider>;
}
export const useWidgetEnvironment = () => useContext(Environment);
export const useWidgetText = () => useWidgetEnvironment().translate;
export function assetUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^(?:\.\/|\/)/, "")}`;
}
