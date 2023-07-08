import express from "express";

import { getDiscordCallback } from "./controler";

const router = express.Router();

router.get("/discord-callback", getDiscordCallback);

export default router;