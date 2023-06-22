/**
 * Generate an embed footer from a Crowdin user
 * @param user The Crowdin user
 * @returns The embed footer object
 */
export function footerFromUser(user: CrowdinUser) {
    return {
        name: `Translated by ${user.username}`,
        icon_url: user.avatarUrl
    }
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
    }
}

/**
 * Sends a message to a Discord webhook
 * @param webhook_path The webhook path
 * @param data The message to send
 * @returns The webhook response
 */
export function sendToDiscord(webhook_path: string, data: {content?: string, embed?: unknown}) {
    return fetch(`https://discord.com/api/webhooks/${webhook_path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}
