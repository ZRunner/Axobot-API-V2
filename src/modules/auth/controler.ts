import { Request, Response } from "express";

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
    const user = await fetch("https://discord.com/api/users/@me", {
        headers: {
            "Authorization": `${token.token_type} ${token.access_token}`,
        },
    }).then(fres => fres.json());

    res.send(`Hello ${user.username}!`);
}