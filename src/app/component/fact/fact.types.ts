export interface Fact {
  id: string;
  profile_id: string;
  fact_text: string;
  source: string;
  confidence_score: number;
  roastability_score: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  discord_user_id: string;
  guild_id: string;
  display_name: string;
  avatar_hash: string | null;
  created_at: string;
  user_facts?: Fact[];
}

export interface ApiResponse {
  success: Boolean;
  message: string;
}
