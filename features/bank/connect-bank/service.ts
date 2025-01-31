import { injectable } from "tsyringe";
import { Result } from "./../../../application/result";

@injectable()
export default class ConnectBankService {
  constructor() {}

  public async connectBank() {
    return Result.Ok();
  }
}
