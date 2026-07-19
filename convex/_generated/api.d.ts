/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as benchmark from "../benchmark.js";
import type * as collection from "../collection.js";
import type * as dataset from "../dataset.js";
import type * as farm from "../farm.js";
import type * as growers from "../growers.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as ross from "../ross.js";
import type * as seed from "../seed.js";
import type * as tenancy from "../tenancy.js";
import type * as users from "../users.js";
import type * as writes from "../writes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auth: typeof auth;
  benchmark: typeof benchmark;
  collection: typeof collection;
  dataset: typeof dataset;
  farm: typeof farm;
  growers: typeof growers;
  http: typeof http;
  lib: typeof lib;
  ross: typeof ross;
  seed: typeof seed;
  tenancy: typeof tenancy;
  users: typeof users;
  writes: typeof writes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
