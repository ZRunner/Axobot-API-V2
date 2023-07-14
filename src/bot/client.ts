import { Client, Events, GatewayIntentBits, Routes } from "discord.js";

import { isDiscordAPIError } from "../modules/discord/types/typeguards";

export default class DiscordClient {
    private static instance: DiscordClient;

    private client: Client | null = null;

    private constructor() {}

    public static getInstance(): DiscordClient {
        if (!DiscordClient.instance) {
            DiscordClient.instance = new DiscordClient();
        }
        return DiscordClient.instance;
    }

    public getClient(): Client {
        if (!this.client) {
            this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
            this.client.once(Events.ClientReady, c => {
                console.log(`Ready! Logged in as ${c.user.tag}`);
            });
            this.client.login(process.env.DISCORD_BOT_TOKEN);
        }
        return this.client;
    }

    public async logout() {
        this.getClient().destroy();
    }

    public async resolveUser(userId: string) {
        try {
            return await this.getClient().users.fetch(userId);
        } catch (err) {
            if (isDiscordAPIError(err) && err.code === 10013) {
                return null;
            }
            throw err;
        }
    }

    public getAvatarUrlFromHash(hash: string | null, userId: string) {
        if (hash === null) {
            const index = (BigInt(userId) >> 22n) % 6n;
            return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
        }
        return `https://cdn.discordapp.com/avatars/${userId}/${hash}.png`;
    }

    public async resolveGuild(guildId: string) {
        try {
            return await this.getClient().guilds.fetch(guildId);
        } catch (err) {
            if (isDiscordAPIError(err) && err.code === 10013) {
                return null;
            }
            throw err;
        }
    }

    public async checkUserPresenceInGuild(userId: string, guildId: string) {
        try {
            await this.getClient().rest.get(Routes.guildMember(guildId, userId));
        } catch (err) {
            if (isDiscordAPIError(err) && (["10004", "10013", "10007"].includes(err.code.toString()))) {
                // unknown guild, unknown user, unknown member
                return false;
            }
            throw err;
        }
        return true;
    }
}