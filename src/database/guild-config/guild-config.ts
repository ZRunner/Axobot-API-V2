import GuildConfigOptionsMap from "./guild-config-options.json";
import { AllRepresentation } from "./guild-config-types";

export const GuildConfigOptionCategoryNames = ["core", "info", "moderation", "partners", "poll-channels", "streamers", "voice-channels", "welcome", "xp"] as const;
export type GuildConfigOptionCategory = typeof GuildConfigOptionCategoryNames[number];
export type GuildConfigOptionsMapType = Record<GuildConfigOptionCategory, Record<string, AllRepresentation>>;
export type GuildConfigOptionValueType = AllRepresentation["default"];
export type PartialGuildConfig = Partial<Record<GuildConfigOptionCategory, Record<string, unknown>>>;

export default class GuildConfigManager {
    private static instance: GuildConfigManager;

    private constructor() {}

    public static getInstance(): GuildConfigManager {
        if (!GuildConfigManager.instance) {
            GuildConfigManager.instance = new GuildConfigManager();
        }
        return GuildConfigManager.instance;
    }

    public static optionsList = GuildConfigOptionsMap as GuildConfigOptionsMapType;

    public async getOptionCategoryFromName(optionName: string): Promise<GuildConfigOptionCategory | undefined> {
        for (const [category, options] of Object.entries(GuildConfigManager.optionsList)) {
            if (options[optionName]) {
                return category as GuildConfigOptionCategory;
            }
        }
    }

    public async getOptionFromName(optionName: string): Promise<AllRepresentation | undefined> {
        const optionCategory = await this.getOptionCategoryFromName(optionName);
        if (!optionCategory) {
            return;
        }
        return GuildConfigManager.optionsList[optionCategory][optionName];
    }

    public async convertToType(optionName: string, value: string): Promise<AllRepresentation["default"]> {
        const option = await this.getOptionFromName(optionName);
        if (!option) {
            throw new Error(`Option ${optionName} does not exist`);
        }
        switch (option.type) {
        case "boolean":
            return value.toLowerCase() === "true";
        case "int":
        case "float":
            return Number(value);
        case "role":
        case "text_channel":
        case "voice_channel":
        case "category":
        case "color":
        case "levelup_channel":
            return Number(value);
        case "roles_list":
        case "text_channels_list":
        case "emojis_list":
            return JSON.parse(value);
        case "enum":
        case "text":
            return value;
        default:
            // @ts-expect-error option type is not handled
            console.warn(`Untreated option type ${option.type}`);
            return value;
        }
    }

}
