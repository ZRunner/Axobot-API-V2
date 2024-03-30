import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { getBotChangelog, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildConfig, getGuildLeaderboard } from "./controler";
import { isDiscordServerMember } from "./middlewares";
import { getDefaultGuildConfigRateLimiter, getGuildConfigRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotChangelog);

router.get("/guild/:guildId(\\d+)/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId(\\d+)/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

export default router;