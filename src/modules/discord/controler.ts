import { NextFunction, Request, Response } from "express";

import DiscordClient from "../../bot/client";
import Database from "../../database/db";
import { getLevelFromGeneralXp, getLevelFromMEE6Xp, getXpFromGeneralLevel, getXpFromMEE6Level } from "./xp";

const db = Database.getInstance();
const discordClient = DiscordClient.getInstance();

export async function getDefaultGuildConfig(req: Request, res: Response) {
    const optionsList = await discordClient.getDefaultGuildConfig();
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
    const config = await discordClient.getGuildConfig(guildId);
    res.send(config);
}

async function transformLeaderboard(leaderboard: {userID: bigint;xp: bigint;}[], firstRank: number, useMEE6: boolean) {
    const getLevelFromXp = useMEE6 ? getLevelFromMEE6Xp : getLevelFromGeneralXp;
    const getXpFromLevel = useMEE6 ? getXpFromMEE6Level : getXpFromGeneralLevel;
    return await Promise.all(leaderboard.map(async (entry, index) => {
        const user = await discordClient.getRawUserData(entry.userID.toString());
        const level = getLevelFromXp(Number(entry.xp));
        const xpToCurrentLevel = getXpFromLevel(level);
        const xpToNextLevel = getXpFromLevel(level + 1);
        return {
            "ranking": firstRank + index,
            "user_id": entry.userID,
            "xp": Number(entry.xp),
            "level": level,
            "xp_to_current_level": xpToCurrentLevel,
            "xp_to_next_level": xpToNextLevel,
            "username": user?.global_name ?? user?.username ?? null,
            "avatar": discordClient.getAvatarUrlFromHash(user?.avatar_hash ?? null, entry.userID),
        };
    }));
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
        players = await transformLeaderboard(leaderboard, page * limit, false);
    } catch (e) {
        next(e);
        return;
    }
    res.send({
        guild: null,
        players: players,
    });
}

export async function getGuildLeaderboard(req: Request, res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res.status(400).send("Invalid guild ID");
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    const isXpEnabled = await discordClient.getGuildConfigValue(guildId, "enable_xp");
    if (!isXpEnabled) {
        res.status(400).send("XP is not enabled for this guild");
        return;
    }
    const xpType = await discordClient.getGuildConfigValue(guildId, "xp_type");
    let players;
    try {
        if (xpType === "global") {
            const stringMemberIds = await discordClient.getGuildMemberIds(guildId.toString());
            if (stringMemberIds === null) {
                res.status(500).send("Failed to get guild members");
                return;
            }
            const memberIds = stringMemberIds.map((id) => BigInt(id));
            const leaderboard = await db.getFilteredGlobalLeaderboard(memberIds, page, limit);
            players = await transformLeaderboard(leaderboard, page * limit, false);
        } else {
            const leaderboard = await db.getGuildLeaderboard(guildId, page, limit);
            players = await transformLeaderboard(leaderboard, page * limit, xpType === "mee6-like");
        }
    } catch (e) {
        next(e);
        return;
    }
    res.send({
        guild: null,
        players: players,
    });
}