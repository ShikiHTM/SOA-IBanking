import type {Response, Request, NextFunction} from 'express'

export const catchAsync = async (fn: (res: Response, req: Request, next: NextFunction) => Promise<void>) => {
    return (req: Response, res: Request, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}