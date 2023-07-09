import express from "express";

import { getDefaultGuildConfig, getGlobalLeaderboard, getGuildConfig } from "./controler";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfig);

router.get("/guild/:guildId(\\d+)/config", getGuildConfig);

router.get("/leaderboard/global", getGlobalLeaderboard);

export default router;