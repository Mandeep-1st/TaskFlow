import jwt from 'jsonwebtoken'

export interface AccessToken {
    userId: number;
    orgId: number;
    role: string
}

export interface RefreshToken {
    userId: number;
    orgId: number;
}


export const generateAccessToken = (payload: AccessToken) => {
    const secret = process.env.JWT_ACCESS_TOKEN_SECRET
    if (!secret) {
        throw new Error('JWT_ACCESS_TOKEN_SECRET is not set')
    }

    const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY ?? '15m') as NonNullable<jwt.SignOptions['expiresIn']>

    return jwt.sign(payload, secret, {
        expiresIn,
    })
}


export const generateRefreshToken = (payload: RefreshToken) => {
    const secret = process.env.JWT_REFRESH_TOKEN_SECRET
    if (!secret) {
        throw new Error('JWT_REFRESH_TOKEN_SECRET is not set')
    }

    const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRY ?? '7d') as NonNullable<jwt.SignOptions['expiresIn']>

    return jwt.sign(payload, secret, {
        expiresIn,
    })
}


export const verifyAccessToken = (token: string) =>
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!) as AccessToken;


export const verifyRefreshToken = (token: string) =>
    jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET!) as RefreshToken;
