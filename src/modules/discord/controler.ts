import { NextFunction, Request, Response } from "express";

import DiscordClient from "../../bot/client";
import Database from "../../database/db";
import GuildConfigData from "../../database/guild-config";
import { AllRepresentation } from "../../database/guild-config-types";

const guildConfig = GuildConfigData.getInstance();
const db = Database.getInstance();
const discordClient = DiscordClient.getInstance();

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

export async function getGlobalLeaderboard(req: Request, res: Response, next: NextFunction) {
    let players;
    try {
        const leaderboard = await db.getGlobalLeaderboard();
        players = await Promise.all(leaderboard.map(async entry => {
            const user = await discordClient.resolveUser(entry.userID.toString());
            return {
                "user_id": entry.userID.toString(),
                "xp": entry.xp.toString(),
                "username": user?.tag ?? null,
                "avatar": user?.displayAvatarURL() ?? null,
            };
        }));
    } catch (e) {
        next(e);
        return;
    }
    res.send({
        "guild": null,
        players: players,
    });
}