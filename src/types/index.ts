/**
 * Core entity types for the Oracle campaign manager.
 */

export type Visibility = "public" | "private" | "secret";

export interface WorldLore {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  campaign_id?: string | null;
  owner_id: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export type Role = "DM" | "PLAYER";
