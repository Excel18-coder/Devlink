import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl } as jwt.SignOptions);
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.jwtRefreshSecret);
