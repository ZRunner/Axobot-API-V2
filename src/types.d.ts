declare module "http" {
    interface IncomingMessage {
        _startTime: Date
    }
    interface ServerResponse {
        _err?: string
      }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string;
            DISCORD_CLIENT_ID: string;
            DISCORD_CLIENT_SECRET: string;
            DISCORD_REDIRECT_URI: string;
            DATABASE_HOST: string;
            DATABASE_PORT?: number;
            DATABASE_USER: string;
            DATABASE_PASSWORD: string;
        }
    }
}

export {};
