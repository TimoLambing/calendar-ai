import { NextFunction, Response, Request } from "express";

export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Application error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
};
