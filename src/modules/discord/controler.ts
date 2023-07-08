import { Request, Response } from "express";

import GuildConfigData from "../../database/guild-config";

const guildConfig = GuildConfigData.getInstance();

export async function getDefaultGuildConfig(req: Request, res: Response) {
    const optionsList = await guildConfig.getOptionsList();
    res.send(optionsList);
}