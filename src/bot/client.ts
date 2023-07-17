import { Client, Events, GatewayIntentBits, PermissionResolvable } from "discord.js";

import Database from "../database/db";
import GuildConfigData from "../database/guild-config";
import { AllRepresentation } from "../database/guild-config-types";
import { DBRawUserData } from "../database/models/users";
import { isDiscordAPIError } from "../modules/discord/types/typeguards";

type ConfigValueType = AllRepresentation["default"];

export default class DiscordClient {
    private static instance: DiscordClient;

    private client: Client | null = null;

    private db: Database = Database.getInstance();

    private defaultGuildConfig: GuildConfigData = GuildConfigData.getInstance();

    private constructor() {}

    public static getInstance(): DiscordClient {
        if (!DiscordClient.instance) {
            DiscordClient.instance = new DiscordClient();
        }
        return DiscordClient.instance;
    }

    public getClient(): Client {
        if (!this.client) {
            this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
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

    public getAvatarUrlFromHash(hash: string | null, userId: bigint | string) {
        if (hash === null) {
            const index = (BigInt(userId) >> 22n) % 6n;
            return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
        }
        return `https://cdn.discordapp.com/avatars/${userId}/${hash}.png`;
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
            "global_name": user.username,
            "avatar_hash": user.avatar,
            "is_bot": user.bot,
        };
    }

    public async resolveGuild(guildId: string) {
        try {
            return await this.getClient().guilds.fetch(guildId);
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

    public async getGuildMemberIds(guildId: string) {
        const guild = await this.resolveGuild(guildId);
        if (guild === null) {
            return null;
        }
        console.debug(guild.shard === undefined);
        const guildMembers = await guild.members.fetch();
        console.debug(guildMembers);
        return guild.members.fetch().then(members => members.map(member => BigInt(member.id)));
    }

    public async getDefaultGuildConfig() {
        return await this.defaultGuildConfig.getOptionsList();
    }

    public async getGuildConfig(guildId: bigint) {
        const setupOptions = await this.db.getGuildConfig(guildId);
        console.debug(setupOptions);
        const defaultConfig = await this.defaultGuildConfig.getOptionsList();
        const config: {[key: string]: ConfigValueType} = {};
        for (const [optionName, value] of Object.entries(defaultConfig)) {
            const option = setupOptions.find((item) => item.option_name === optionName);
            if (option === undefined) {
                config[optionName] = value.default;
            } else {
                config[optionName] = await this.defaultGuildConfig.convertToType(option.option_name, option.value);
            }
        }
        return config;
    }

    public async getGuildConfigValue(guildId: bigint, optionName: string) {
        const dbValue = await this.db.getGuildConfigValue(guildId, optionName);
        if (dbValue !== null) {
            return await this.defaultGuildConfig.convertToType(optionName, dbValue);
        }
        const defaultConfig = await this.defaultGuildConfig.getOptionsList();
        return defaultConfig[optionName].default;
    }

}