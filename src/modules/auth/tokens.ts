import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";

import Database from "../../database/db";

const db = Database.getInstance();

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;
const JWT_TOKEN_EXPIRATION_DAYS = Number(process.env.JWT_TOKEN_EXPIRATION_DAYS ?? "7");

export async function checkToken(token: string) {
    // Token validity
    try {
        verify(token, JWT_SECRET_TOKEN);
    } catch (err) {
        return null;
    }
    // Check if token exists in database
    return await db.getTokenInformation(token);
}

export async function tokenCheckMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.get("authorization");
    // Existence du token
    if (!token) {
        res._err = "No authentication token found in request headers";
        return res.status(401).json({ success: false, msg: res._err });
    }

    try {
        const info = await checkToken(token);
        if (info === null) {
            res._err = "Authentication token is invalid";
            return res.status(401).json({ success: false, msg: res._err });
        }
        // req.session.user = info;
        next();
    } catch (err) {
        res._err = "Database error";
        return res.status(500).json({ success: false, msg: res._err });
    }
}

export async function createToken(userId: bigint | string, discordToken: string | null) {
    const numericUserId = BigInt(userId);
    const apiToken = sign({ result: userId.toString() }, JWT_SECRET_TOKEN, { expiresIn: JWT_TOKEN_EXPIRATION_DAYS + "d" });
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + JWT_TOKEN_EXPIRATION_DAYS);
    try {
        await db.registerToken(numericUserId, apiToken, discordToken, expirationDate);
    } catch (err) {
        return null;
    }
    return apiToken;
}