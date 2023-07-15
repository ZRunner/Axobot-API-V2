import { NextFunction, Request, Response } from "express";

import DiscordClient from "../../bot/client";
import Database from "../../database/db";
import GuildConfigData from "../../database/guild-config";
import { AllRepresentation } from "../../database/guild-config-types";
import { getLevelFromGeneralXp, getXpFromGeneralLevel } from "./xp";

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
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    if (page < 0 || limit < 0 || limit > 100) {
        res.status(400).send("Invalid page or limit");
        return;
    }
    let players;
    try {
        const leaderboard = await db.getGlobalLeaderboard(page, limit);
        players = await Promise.all(leaderboard.map(async (entry, index) => {
            const user = await discordClient.getRawUserData(entry.userID.toString());
            const level = getLevelFromGeneralXp(Number(entry.xp));
            const xpToCurrentLevel = getXpFromGeneralLevel(level);
            const xpToNextLevel = getXpFromGeneralLevel(level + 1);
            return {
                "ranking": page * limit + index,
                "user_id": entry.userID,
                "xp": Number(entry.xp),
                "level": level,
                "xp_to_current_level": xpToCurrentLevel,
                "xp_to_next_level": xpToNextLevel,
                "username": user?.global_name ?? null,
                "avatar": discordClient.getAvatarUrlFromHash(user?.avatar_hash ?? null, entry.userID),
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