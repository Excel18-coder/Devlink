import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const signAccessToken = (payload) => {
    return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
};
export const signRefreshToken = (payload) => {
    return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
};
export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
