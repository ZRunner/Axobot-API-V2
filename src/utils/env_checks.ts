const requiredEnvVariables = [
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
];

/**
 * Checks if all required environment variables are set.
 * @returns true if all required environment variables are set, false otherwise.
 */
export function checkEnvironmentVariables() {
    const missingVariables = requiredEnvVariables.filter(key => process.env[key] === undefined);
    if (missingVariables.length > 0) {
        console.error("FATAL ERROR: Missing environment variables:", missingVariables);
        return false;
    }
    return true;
}