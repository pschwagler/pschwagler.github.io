import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/chat", "routes/api.chat.ts"),
  route("api/contact", "routes/api.contact.ts"),
  route("api/suggestions", "routes/api.suggestions.ts"),
] satisfies RouteConfig;
