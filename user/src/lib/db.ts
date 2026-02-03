import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getDB() {
    console.log("🔥 ENV CHECK", {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        JWT_SECRET: process.env.JWT_SECRET?.slice(0, 6) + "..." // 보안 위해 일부만
    });
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST!,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    return pool;
}
