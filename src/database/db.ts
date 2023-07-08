import { createPool, Pool, PoolConfig, Types } from "mariadb";

const DB_CONFIG: PoolConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT && Number(process.env.DATABASE_PORT),
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
    static instance: Database;

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database(DB_CONFIG);
        }
        return Database.instance;
    }

    private axobotPool: Pool;

    private constructor(config: PoolConfig) {
        this.axobotPool = createPool(config);
    }

}