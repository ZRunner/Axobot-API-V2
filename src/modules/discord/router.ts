import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { getDefaultGuildConfig, getGlobalLeaderboard, getGuildConfig } from "./controler";
import { isDiscordServerMember } from "./middlewares";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfig);

router.get("/guild/:guildId(\\d+)/config", tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/leaderboard/global", tokenCheckMiddleware, getGlobalLeaderboard);

export default router;