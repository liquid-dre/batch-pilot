import { httpRouter } from "convex/server";
import { auth } from "./auth";

/** Mounts the Convex Auth HTTP routes (sign-in / token exchange / OAuth). */
const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
