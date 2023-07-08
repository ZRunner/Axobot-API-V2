import { AllRepresentation } from "./guild-config-types";

export default class GuildConfigData {
    private static instance: GuildConfigData;

    private optionsList: AllRepresentation | null = null;

    private constructor() {}

    public static getInstance(): GuildConfigData {
        if (!GuildConfigData.instance) {
            GuildConfigData.instance = new GuildConfigData();
        }
        return GuildConfigData.instance;
    }

    public async getOptionsList(): Promise<AllRepresentation> {
        if (!this.optionsList) {
            this.optionsList = await this.fetchOptionsList();
        }
        return this.optionsList;
    }

    private async fetchOptionsList(): Promise<AllRepresentation> {
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
}
