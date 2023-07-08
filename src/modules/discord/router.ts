import express from "express";

import { getDefaultGuildConfig, getGuildConfig } from "./controler";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfig);

router.get("/guild/:guildId(\\d+)/config", getGuildConfig);

export default router;