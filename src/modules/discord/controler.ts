import { NextFunction, Request, Response } from "express";
import { is } from "typia";

import DiscordClient from "../../bot/client";
import Database from "../../database/db";
import { GuildConfigOptionCategory, GuildConfigOptionCategoryNames } from "../../database/guild-config/guild-config-manager";
import { tokenCheckMiddleware } from "../auth/tokens";
import { isDiscordServerMember } from "./middlewares";
import { getGuildInfo, transformLeaderboard } from "./utils/leaderboard";


const db = Database.getInstance();
const discordClient = DiscordClient.getInstance();

export async function getDefaultGuildConfigOptions(req: Request, res: Response) {
    const optionsList = await discordClient.getDefaultGuildConfig();
    res.send(optionsList);
}

export async function getGuildConfig(req: Request, res: Response) {
    if (!is<GuildConfigOptionCategory[] | GuildConfigOptionCategory | "all">(req.query.category)) {
        res.status(400).send("Invalid category");
        return;
    }
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res.status(400).send("Invalid guild ID");
        return;
    }
    const categories = (
        req.query.category === "all"
            ? GuildConfigOptionCategoryNames
            : Array.isArray(req.query.category)
                ? req.query.category
                : [req.query.category]
    );
    const config = await discordClient.getGuildCategoriesConfigOptions(guildId, categories);
    res.send(config);
}

export async function getGlobalLeaderboard(req: Request, res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    if (page < 0 || limit < 0 || limit > 100) {
        res.status(400).send("Invalid page or limit");
        return;
    }
    let players, playersCount;
    try {
        const leaderboard = await db.getGlobalLeaderboard(page, limit);
        players = await transformLeaderboard(leaderboard, page * limit, false);
        playersCount = await db.getGlobalLeaderboardCount();
    } catch (e) {
        next(e);
        return;
    }
    res.send({
        "guild": null,
        "players": players,
        "players_count": playersCount,
        "xp_type": "global",
        "xp_rate": 1.0,
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
    const isXpEnabled = await discordClient.getGuildConfigOptionValue(guildId, "enable_xp");
    if (!isXpEnabled) {
        res.status(400).send("XP is not enabled for this guild");
        return;
    }
    const isPrivateLeaderboard = await discordClient.getGuildConfigOptionValue(guildId, "private_leaderboard");
    if (isPrivateLeaderboard) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const err = await tokenCheckMiddleware(req, res, () => {}) || await isDiscordServerMember(req, res, () => {});
        if (err) {
            return err;
        }
    }
    const xpType = await discordClient.getGuildConfigOptionValue(guildId, "xp_type") as string;
    let players, playersCount;
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
            playersCount = await db.getFilteredGlobalLeaderboardCount(memberIds);
        } else {
            const leaderboard = await db.getGuildLeaderboard(guildId, page, limit);
            players = await transformLeaderboard(leaderboard, page * limit, xpType === "mee6-like");
            playersCount = await db.getGuildLeaderboardCount(guildId);
        }
    } catch (e) {
        next(e);
        return;
    }
    const guildData = await getGuildInfo(guild);
    const xpRate = xpType === "global" ? 1.0 : await discordClient.getGuildConfigOptionValue(guildId, "xp_rate") as number;
    res.send({
        "guild": guildData,
        "players": players,
        "players_count": playersCount,
        "xp_type": xpType,
        "xp_rate": xpRate,
    });
}

export async function getBotChangelog(req: Request, res: Response) {
    if (!is<"en" | "fr">(req.query.language)) {
        res.status(400).send("Invalid language");
        return;
    }
    const changelog = await db.getBotChangelog();
    res.send(
        changelog.map((entry) => ({
            "version": entry.version,
            "release_date": entry.release_date,
            "content": entry[req.query.language as "en" | "fr"],
        }))
    );
}