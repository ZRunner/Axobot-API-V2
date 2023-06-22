import { CrowdinProject, CrowdinUser } from "./types/commons";

/**
 * Generate an embed footer from a Crowdin user
 * @param user The Crowdin user
 * @returns The embed footer object
 */
export function footerFromUser(user: CrowdinUser) {
    return {
        name: `Translated by ${user.username}`,
        // eslint-disable-next-line camelcase
        icon_url: user.avatarUrl,
    };
}

/**
 * Generate an embed author from a Crowdin project
 * @param project The Crowding project
 * @returns The embed author object
 */
export function authorFromProject(project: CrowdinProject) {
    return {
        name: project.name,
        url: project.url,
    };
}

/**
 * Sends a message to a Discord webhook
 * @param webhookPath The webhook path
 * @param data The message to send
 * @returns The webhook response
 */
export function sendToDiscord(webhookPath: string, data: {content?: string, embeds?: unknown[]}) {
    return fetch(`https://discord.com/api/webhooks/${webhookPath}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}
