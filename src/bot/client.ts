import { Client, DiscordAPIError, Events, GatewayIntentBits, PermissionResolvable, PermissionsBitField } from "discord.js";

import Database from "../database/db";
import GuildConfigManager from "../database/guild-config/guild-config-manager";
import { DBRawUserData } from "../database/models/users";
import { OauthGuildData, OauthGuildRawData } from "../modules/discord/types/guilds";
import { isDiscordAPIError } from "../modules/discord/types/typeguards";


export default class DiscordClient {
    private static instance: DiscordClient;

    private client: Client | null = null;

    private db: Database = Database.getInstance();

    private fetchedGuildIds = new Set<bigint>();

    private constructor() {}

    public static getInstance(): DiscordClient {
        if (!DiscordClient.instance) {
            DiscordClient.instance = new DiscordClient();
        }
        return DiscordClient.instance;
    }

    public async getClient(): Promise<Client> {
        if (!this.client) {
            console.debug("Creating new client");
            this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
            this.client.once(Events.ClientReady, c => {
                console.log(`Ready! Logged in as ${c.user.tag}`);
            });
            await this.client.login(process.env.DISCORD_BOT_TOKEN);
        }
        return this.client;
    }

    public async logout() {
        this.client?.destroy();
    }

    public async resolveUser(userId: string) {
        const client = await this.getClient();
        try {
            return await client.users.fetch(userId);
        } catch (err) {
            if (isDiscordAPIError(err) && err.code === 10013) {
                return null;
            }
            throw err;
        }
    }

    public getAvatarUrlFromHash(hash: string | null, userId: bigint | string) {
        if (hash === null) {
            const index = (BigInt(userId) >> 22n) % 6n;
            return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
        }
        return `https://cdn.discordapp.com/avatars/${userId}/${hash}.webp`;
    }

    public async getRawUserData(userId: bigint | string): Promise<DBRawUserData | null> {
        let intUserId: bigint;
        try {
            intUserId = BigInt(userId);
        } catch (err) {
            return null;
        }
        const dbCache = await this.db.getUserDataFromCache([intUserId]);
        if (dbCache.length === 1) {
            return dbCache[0];
        }
        const user = await this.resolveUser(userId.toString());
        if (user === null) {
            return null;
        }
        return {
            "user_id": intUserId,
            "username": user.username,
            "global_name": user.globalName,
            "avatar_hash": user.avatar,
            "is_bot": user.bot,
        };
    }

    public async resolveGuild(guildId: string) {
        const client = await this.getClient();
        try {
            return await client.guilds.fetch(guildId);
        } catch (err) {
            if (isDiscordAPIError(err) && err.code === 10004) {
                return null;
            }
            throw err;
        }
    }

    public async getMemberFromGuild(guildId: string, userId: string) {
        const guild = await this.resolveGuild(guildId);
        if (guild === null) {
            return null;
        }
        let member;
        try {
            member = await guild.members.fetch(userId);
        } catch (err) {
            if (isDiscordAPIError(err) && (["10013", "10007"].includes(err.code.toString()))) {
                // unknown guild, unknown user, unknown member
                return null;
            }
            throw err;
        }
        return member;
    }

    public async checkUserPresenceInGuild(guildId: string, userId: string) {
        return (await this.getMemberFromGuild(guildId, userId)) !== null;
    }

    public async checkUserPermissionInGuild(guildId: string, userId: string, permission: PermissionResolvable) {
        const member = await this.getMemberFromGuild(guildId, userId);
        if (member === null) {
            return false;
        }
        return member.permissions.has(permission);
    }

    public async getGuildMembers(guildId: string) {
        const guild = await this.resolveGuild(guildId);
        if (guild === null) {
            return null;
        }
        if (this.fetchedGuildIds.has(BigInt(guildId))) {
            return guild.members.cache;
        }
        this.fetchedGuildIds.add(BigInt(guildId));
        return await guild.members.fetch();
    }

    public async getGuildMemberIds(guildId: string) {
        const members = await this.getGuildMembers(guildId);
        if (members === null) {
            return null;
        }
        return Array.from(members.keys());
    }

    public async getDefaultGuildConfig() {
        return GuildConfigManager.optionsList;
    }

    public async getUserFromOauth(discordToken: string): Promise<OauthUserData | null> {
        const user: OauthUserData | DiscordAPIError = await fetch("https://discord.com/api/users/@me", {
            headers: {
                // "Authorization": `${token.token_type} ${token.access_token}`,
                "Authorization": `Bearer ${discordToken}`,
            },
        }).then(fres => fres.json());

        if (isDiscordAPIError(user)) {
            console.debug(user);
            return null;
        }
        return user;
    }

    public async getGuildsFromOauth(discordToken: string): Promise<OauthGuildData[] | null> {
        const data: OauthGuildRawData[] = await fetch("https://discord.com/api/v10/users/@me/guilds", {
            headers: {
                "Authorization": `Bearer ${discordToken}`,
            },
        }).then(fres => fres.json());

        if (isDiscordAPIError(data)) {
            console.debug(data);
            return null;
        }

        return data.map(guild => {
            const permissions = new PermissionsBitField(BigInt(guild.permissions));
            return {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                owner: guild.owner,
                isAdmin: guild.owner || permissions.has("Administrator"),
                permissions: permissions,
                features: guild.features,
            };
        });
    }

}