import { Request, Response } from "express";

import { createToken } from "./tokens";

interface GetMeSuccessResponse {
    id: string;
    avatar: string;
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

export async function getDiscordCallback(req: Request, res: Response) {
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
    console.debug(token);

    const user: GetMeSuccessResponse | GetmeErrorResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
            "Authorization": `${token.token_type} ${token.access_token}`,
        },
    }).then(fres => fres.json());

    if (isGetMeErrorResponse(user)) {
        res.status(401).send("Invalid token");
        return;
    }

    const apiToken = await createToken(user.id);

    res.json({ token: apiToken });
}