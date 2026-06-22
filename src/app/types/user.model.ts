import { DiscordGuild } from './guild.model';

export interface DiscordAdminProfile {
  discord_user_id: string;
  display_name: string;
  avatar_url: string;
  managed_guilds: DiscordGuild[];
}
