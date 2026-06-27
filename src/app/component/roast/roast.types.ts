export interface NestedUserProfile {
  display_name: string;
  avatar_hash: string | null;
}

export interface RoastTargetDb {
  roast_id: string;
  discord_user_id: string;
  guild_id: string;
  damage_reason: string;
  user_profiles: NestedUserProfile | null;
}

export interface RoastLogResponse {
  id: string;
  guild_id: string;
  channel_id: string;
  roast_text: string;
  persona_used: string | null;
  primary_target_id: string;
  clapped_the_most_id: string;
  burn_accuracy: number; // 0-100
  severity_score: number; // 0-100
  created_at: string; // ISO Timestamp
  roast_targets: RoastTargetDb[];
}
