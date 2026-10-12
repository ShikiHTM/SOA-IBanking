type userJwtPayload = {
    user_id: string;
    exp: number;
};

export type Variables = {
    jwtPayload: userJwtPayload;
};
