import { Request, Response } from "express";

import Database from "../../database/db";
import GuildConfigData from "../../database/guild-config";
import { AllRepresentation } from "../../database/guild-config-types";

const guildConfig = GuildConfigData.getInstance();
const db = Database.getInstance();

type ConfigValueType = AllRepresentation["default"];

export async function getDefaultGuildConfig(req: Request, res: Response) {
    const optionsList = await guildConfig.getOptionsList();
    res.send(optionsList);
}

export async function getGuildConfig(req: Request, res: Response) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res.status(400).send("Invalid guild ID");
        return;
    }
    const setupOptions = await db.getGuildConfig(guildId);
    const defaultConfig = await guildConfig.getOptionsList();
    const config: {[key: string]: ConfigValueType} = {};
    for (const [optionName, value] of Object.entries(defaultConfig)) {
        const option = setupOptions.find((item) => item.option_name === optionName);
        if (option === undefined) {
            config[optionName] = value.default;
        } else {
            config[optionName] = await guildConfig.convertToType(option.option_name, option.value);
        }
    }
    res.send(config);
}