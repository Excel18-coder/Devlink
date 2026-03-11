import jwt from "jsonwebtoken";
export declare const signAccessToken: (payload: object) => string;
export declare const signRefreshToken: (payload: object) => string;
export declare const verifyAccessToken: (token: string) => string | jwt.JwtPayload;
export declare const verifyRefreshToken: (token: string) => string | jwt.JwtPayload;
