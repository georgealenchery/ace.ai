import VapiModule from "@vapi-ai/web";
const Vapi = (VapiModule as any).default || VapiModule;
export const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);
