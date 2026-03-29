import VapiModule from "@vapi-ai/web";
const VapiConstructor = (
  VapiModule as unknown as { default?: typeof VapiModule }
).default ?? VapiModule;
export const vapi = new VapiConstructor(import.meta.env.VITE_VAPI_PUBLIC_KEY);
