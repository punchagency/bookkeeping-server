import { Response, Request, NextFunction } from "express";
import ApiResponse from "./../../application/response/response";
import { container } from "tsyringe";

const useNotFound = (req: Request, res: Response, next: NextFunction) => {
  const response = container.resolve(ApiResponse);

  response.NotFound(res);
};

export default useNotFound;
