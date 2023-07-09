import { Client, Events, GatewayIntentBits } from "discord.js";

export default class DiscordClient {
    private static instance: DiscordClient;

    private client: Client | null = null;

    private constructor() {}

    public static getInstance(): DiscordClient {
        if (!DiscordClient.instance) {
            DiscordClient.instance = new DiscordClient();
        }
        return DiscordClient.instance;
    }

    public getClient(): Client {
        if (!this.client) {
            this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
            this.client.once(Events.ClientReady, c => {
                console.log(`Ready! Logged in as ${c.user.tag}`);
            });
            this.client.login(process.env.DISCORD_BOT_TOKEN);
        }
        return this.client;
    }

    public async logout() {
        this.getClient().destroy();
    }

    public async resolveUser(userId: string) {
        return this.getClient().users.fetch(userId);
    }
}