import { createPool, Pool, PoolConfig, Types } from "mariadb";

const BETA = process.env.DISCORD_ENTITY_ID === "1";

const DB_CONFIG: Omit<PoolConfig, "database"> = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
    trace: BETA,
    timezone: "auto",

    "typeCast": function castField(field, useDefaultTypeCasting) {
        // We only want to cast bit fields that have a single-bit in them. If the field
        // has more than one bit, then we cannot assume it is supposed to be a Boolean.
        if ( ( field.type === Types.BIT ) && ( field.columnLength === 1 ) ) {
            const bytes = field.buffer();
            // A Buffer in Node represents a collection of 8-bit unsigned integers.
            // Therefore, our single "bit field" comes back as the bits '0000 0001',
            // which is equivalent to the number 1.
            return (bytes !== null && bytes[ 0 ] === 1);
        }

        return ( useDefaultTypeCasting() );
    },
};

export default class Database {
    private static instance: Database;

    private axobotPool: Pool;

    private apiPool: Pool;

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database(DB_CONFIG);
        }
        return Database.instance;
    }

    private constructor(config: Omit<PoolConfig, "database">) {
        this.axobotPool = createPool({ ...config, database: "axobot" });
        this.apiPool = createPool({ ...config, database: "axobot-api" });
    }

    public async dummyAxobotQuery(): Promise<void> {
        await this.axobotPool.query("SELECT 1");
    }

    public async dummyApiQuery(): Promise<void> {
        await this.apiPool.query("SELECT 1");
    }

    public async getGuildConfig(guildId: bigint): Promise<{ option_name: string, value: string }[]> {
        const result = await this.axobotPool.query<{ option_name: string, value: string }[]>("SELECT `option_name`, `value` FROM `serverconfig` WHERE `guild_id` = ? AND `beta` = ?", [guildId, BETA]);
        return result;
    }

    public async getGuildConfigValue(guildId: bigint, optionName: string): Promise<string | undefined> {
        const result = await this.axobotPool.query<{ value: string }[]>("SELECT  `value` FROM `serverconfig` WHERE `guild_id` = ? AND `option_name` = ? AND `beta` = ?", [guildId, optionName, BETA]);
        return result[0]?.value;
    }

}