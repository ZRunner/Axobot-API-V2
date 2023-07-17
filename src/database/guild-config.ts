import { AllRepresentation } from "./guild-config-types";

type DefaultConfigurationMapType = {[key: string]: AllRepresentation}

export default class GuildConfigData {
    private static instance: GuildConfigData;

    private optionsList: DefaultConfigurationMapType | null = null;

    private constructor() {}

    public static getInstance(): GuildConfigData {
        if (!GuildConfigData.instance) {
            GuildConfigData.instance = new GuildConfigData();
        }
        return GuildConfigData.instance;
    }

    private async fetchOptionsList(): Promise<DefaultConfigurationMapType> {
        const url = "https://raw.githubusercontent.com/ZRunner/Axobot/develop/libs/serverconfig/options_list.json";

        try {
        const response = await fetch(url);
        const content = await response.text();
        return JSON.parse(content);
        } catch (error) {
        console.error("Error fetching options list:", error);
        throw error;
        }
    }

    public async getOptionsList(): Promise<DefaultConfigurationMapType> {
        if (!this.optionsList) {
            this.optionsList = await this.fetchOptionsList();
        }
        return this.optionsList;
    }

    public async convertToType(optionName: string, value: string): Promise<AllRepresentation["default"]> {
        const optionsList = await this.getOptionsList();
        const option = optionsList[optionName];
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
            default:
                console.warn(`Untreated option type ${option.type}`);
                return value;
        }
    }


}
