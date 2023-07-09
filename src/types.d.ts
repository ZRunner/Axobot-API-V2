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
            BETA: boolean;
            DISCORD_CLIENT_ID: string;
            DISCORD_CLIENT_SECRET: string;
            DISCORD_REDIRECT_URI: string;
            DISCORD_BOT_TOKEN: string;
            DISCORD_ENTITY_ID: "0" | "1" | "2";
            DATABASE_HOST: string;
            DATABASE_PORT?: string;
            DATABASE_USER: string;
            DATABASE_PASSWORD: string;
            JWT_SECRET_TOKEN: string;
            JWT_TOKEN_EXPIRATION_DAYS?: string;
        }
    }
}

declare module "express" {
    interface Response {
        _err?: string
    }
}

export {};
