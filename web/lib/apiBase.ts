/**
 * lib/apiBase.ts
 *
 * Base URL for API requests, resolved strictly through lib/env.ts.
 */
import { ENV } from "@/lib/env";

export const API_BASE = ENV.apiUrl;
export default API_BASE;