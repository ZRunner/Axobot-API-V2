import { NextFunction, Request, Response } from "express";

import DiscordClient from "../../bot/client";

const discordClient = DiscordClient.getInstance();

export async function isDiscordServerMember(req: Request, res: Response, next: NextFunction) {
    if (res.locals.user === undefined) {
        return res.status(401).send("Invalid token");
    }
    const userId = res.locals.user.user_id.toString();
    const guildId = req.params.guildId;
    const result = await discordClient.checkUserPresenceInGuild(userId, guildId);
    console.log(JSON.stringify(result), result);
    if (!result) {
        return res.status(401).send("User is not a member of this guild");
    }
    next();
}