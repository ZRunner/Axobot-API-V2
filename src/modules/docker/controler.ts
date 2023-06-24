import { Request, Response } from "express";

import { DiscordMessage } from "../../utils/discord_message";
import { DockerPushEvent } from "./types";

const EMBED_COLOR = 0x7289DA;

function sendToDiscord(webhookPath: string, data: DiscordMessage) {
    return fetch(`https://discord.com/api/webhooks/${webhookPath}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

function callbackDockerhub(callbackUrl: string) {
    if (!callbackUrl.startsWith("https://registry.hub.docker.com/")) {
        return Promise.reject(new Error("Invalid callback domain"));
    }
    return fetch(callbackUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            state: "success",
            description: "The webhook has been forwarded to Discord",
            context: "Discord webhook forwarder",
        }),
    });
}

export async function postWebhookNotification(req: Request<{webhook_id: string, webhook_token: string}, unknown, DockerPushEvent>, res: Response) {
    const webhookPath = req.params.webhook_id + "/" + req.params.webhook_token;
    if (!/^\d+\/\w+$/.test(webhookPath)) {
        res.status(400).send("Invalid webhook path");
        return;
    }
    const repo = req.body.repository;
    const pushData = req.body.push_data;
    const embed = {
        title: `New push on ${repo.repo_name}:${pushData.tag}`,
        description: `Pushed by ${pushData.pusher}\n\nLink: ${repo.repo_url}`,
        color: EMBED_COLOR,
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
    await callbackDockerhub(req.body.callback_url);
    res.send("ok");
}