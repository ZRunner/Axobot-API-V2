import express from "express";

import { getDiscordCallback, getMe } from "./controler";
import { tokenCheckMiddleware } from "./tokens";

const router = express.Router();

router.get("/me", tokenCheckMiddleware, getMe);

router.get("/discord-callback", getDiscordCallback);

export default router;