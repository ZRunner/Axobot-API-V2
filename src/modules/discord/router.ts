import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { getDefaultGuildConfig, getGlobalLeaderboard, getGuildConfig } from "./controler";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfig);

router.get("/guild/:guildId(\\d+)/config", tokenCheckMiddleware, getGuildConfig);

router.get("/leaderboard/global", tokenCheckMiddleware, getGlobalLeaderboard);

export default router;