export interface Fact {
  id: string;
  profile_id: string;
  fact_text: string;
  source: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserProfile {
  id: string;
  discord_user_id: string;
  guild_id: string;
  display_name: string | null;
  avatar_hash: string | null;
  created_at: string;
  updated_at: string | null;
  user_facts?: Fact[] | null;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
