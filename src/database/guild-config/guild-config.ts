import GuildConfigOptionsList from "./guild-config.json";
import { AllRepresentation } from "./guild-config-types";

type DefaultConfigurationMapType = Record<string, Record<string, AllRepresentation>>;

export default class GuildConfigData {
    private static instance: GuildConfigData;

    private constructor() {}

    public static getInstance(): GuildConfigData {
        if (!GuildConfigData.instance) {
            GuildConfigData.instance = new GuildConfigData();
        }
        return GuildConfigData.instance;
    }

    public async getOptionsList() {
        return GuildConfigOptionsList as DefaultConfigurationMapType;
    }

    public async getOptionFromName(optionName: string): Promise<AllRepresentation | undefined> {
        const optionsList = await this.getOptionsList();
        for (const option of Object.values(optionsList)) {
            if (option[optionName]) {
                return option[optionName];
            }
        }
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
