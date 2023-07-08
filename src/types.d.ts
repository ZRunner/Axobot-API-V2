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
            PORT?: number;
            BETA: boolean;
            DISCORD_CLIENT_ID: string;
            DISCORD_CLIENT_SECRET: string;
            DISCORD_REDIRECT_URI: string;
            DISCORD_ENTITY_ID: 0 | 1 | 2;
            DATABASE_HOST: string;
            DATABASE_PORT?: number;
            DATABASE_USER: string;
            DATABASE_PASSWORD: string;
        }
    }
}

export {};
