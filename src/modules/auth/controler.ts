import { NextFunction, Request, Response } from "express";

import DiscordClient from "../../bot/client";
import { createToken } from "./tokens";

interface GetMeSuccessResponse {
    id: string;
    avatar: string | null;
    global_name: string;
    locale: string;
    public_flags: number;
    username: string;
}
interface GetmeErrorResponse {
    message: string;
    code: number;
}

function isGetMeErrorResponse(obj: unknown): obj is GetmeErrorResponse {
    return typeof obj === "object" && obj !== null && (obj as GetmeErrorResponse).message !== undefined;
}

const discordClient = DiscordClient.getInstance();

export async function getDiscordCallback(req: Request, res: Response, next: NextFunction) {
    const code = req.query.code;
    if (typeof code !== "string") {
        res.status(400).send("Invalid code");
        return;
    }

    const token = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            "client_id": process.env.DISCORD_CLIENT_ID,
            "client_secret": process.env.DISCORD_CLIENT_SECRET,
            code,
            "grant_type": "authorization_code",
            "redirect_uri": process.env.DISCORD_REDIRECT_URI,
            scope: "identify",
        }),
    }).then(fres => fres.json());
    if (token.error) {
        console.warn("Invalid answer while getting Discord token from code: ", token);
        if (token.error_description === "Invalid \"code\" in request.") {
            res.status(400).send("Invalid code");
        } else {
            res.status(500).send("Internal server error");
        }
        return;
    }

    const user: GetMeSuccessResponse | GetmeErrorResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
            "Authorization": `${token.token_type} ${token.access_token}`,
        },
    }).then(fres => fres.json());

    if (isGetMeErrorResponse(user)) {
        console.debug(user);
        res._err = "Invalid token";
        res.status(500).send(res._err);
        return;
    }

    let apiToken;
    try {
        apiToken = await createToken(user.id, token.access_token);
    } catch (err) {
        next(err);
        return;
    }

    const response: AuthenticatedUserObject & {token: string} = {
        token: apiToken,
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: discordClient.getAvatarUrlFromHash(user.avatar, user.id),
    };

    res.json(response);
}

export async function getMe(req: Request, res: Response) {
    if (res.locals.user === undefined) {
        res._err = "Invalid token";
        res.status(401).send(res._err);
        return;
    }
    const userId = res.locals.user.user_id;
    const user = await discordClient.resolveUser(userId.toString());
    if (user === null) {
        res._err = "User not found";
        res.status(500).send(res._err);
        return;
    }
    const response: AuthenticatedUserObject = {
        id: user.id,
        username: user.username,
        globalName: user.username, // TODO: use globalName once d.js is updated
        avatar: discordClient.getAvatarUrlFromHash(user.avatar, user.id),
    };
    res.json(response);
}
