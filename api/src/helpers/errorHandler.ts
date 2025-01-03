import { Response } from 'express';

/**
 * Method for use in catch block. Will normalize
 * error messages and send them to the front-end.
 * @param {String} taskName all-lowercase
 * @param {Response} res response
 * @param {Error} err error stack
 */
export function handleUncaughtError(taskName: string, res: Response, err: unknown): void {
    if (err instanceof Error) {
        // ValidationError comes from Mongoose
        if (err.name === 'ValidationError') {
            res.status(500).json({
                error: `Error while ${taskName}`,
                details: err.message
            });
            return;
        } else if (err.name === 'AccessError') {
            res.status(404).json({
                error: err.message
            });
            return;
        } else if (err.name === 'PermissionError') {
            res.status(403).json({
                error: err.message
            });
            return;
        }
    }
    console.error(`UnhandledError while ${taskName}`, err);
    res.status(500).json({
        error: `Unexpected error while ${taskName}`
    });
    return;
}

export function throwError(msg: string, code = 'AccessError'): never {
    const error = new Error(msg);
    error.name = code;
    throw error;
}
