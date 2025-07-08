import { Request, Response } from 'express';

export const authenticateMunicipal = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.session.user.role !== 'municipal_manager') {
    return res.status(403).json({ message: "Forbidden - Municipal Manager access required" });
  }
  
  next();
};