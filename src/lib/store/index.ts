/**
 * Unified data store — uses Supabase when configured, otherwise file-backed local store.
 */
import { hasSupabase } from "@/lib/env";
import * as local from "./local";
import * as supabase from "./supabase";

const backend = hasSupabase() ? supabase : local;

export const DEMO_USER_ID = local.DEMO_USER_ID;

export const createScan = backend.createScan;
export const getScan = backend.getScan;
export const listScans = backend.listScans;
export const updateScan = backend.updateScan;
export const deleteScan = backend.deleteScan;
export const saveIdentification = backend.saveIdentification;
export const savePriceResults = backend.savePriceResults;
export const getPriceResults = backend.getPriceResults;
export const saveListing = backend.saveListing;
export const getListingByScan = backend.getListingByScan;
export const saveMarketplacePost = backend.saveMarketplacePost;
export const getPostsForListing = backend.getPostsForListing;
export const getEbayTokens = backend.getEbayTokens;
export const saveEbayTokens = backend.saveEbayTokens;
export const clearEbayTokens = backend.clearEbayTokens;
export const getUserSettings = backend.getUserSettings;
export const saveUserSettings = backend.saveUserSettings;