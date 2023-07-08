import express from "express";

import { getDefaultGuildConfig } from "./controler";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfig);

export default router;