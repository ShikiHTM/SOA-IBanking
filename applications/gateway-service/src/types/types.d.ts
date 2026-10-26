type UserJwtPayload = {
    user_id: string;
    exp: number;
};

export type Variables = {
    jwtPayload: UserJwtPayload;
};

