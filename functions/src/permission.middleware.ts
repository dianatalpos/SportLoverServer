import { Request, Response } from "express";

export function isAuthorized(hasRole: Array<"owner" | "user">) {
    return (req: Request, res: Response, next) => {
        console.log(res.locals);

        const { role, uid } = res.locals;
        const { id } = req.params;

        if (id && uid === id)
            return next();

        if (!role)
            return res.status(403).send();

        if (hasRole.includes(role))
            return next();

        return res.status(403).send();
    };
}
