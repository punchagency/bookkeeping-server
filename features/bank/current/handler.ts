import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { logger } from "./../../../utils";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import MxClient from "./../../../infrastructure/config/packages/mx";

@injectable()
export default class CurrentBankHandler {
  private readonly _mxClient: MxClient;

  constructor(@inject(MxClient) mxClient: MxClient) {
    this._mxClient = mxClient;
  }

  public async handle(req: Request, res: Response) {
    const result = await this.getCurrentBank(req);

    if (result.isFailure) {
      return Result.Fail(result.errors);
    }

    return Result.Ok(result.value);
  }

  public async getCurrentBank(req: Request) {
    const currentUser = req.user as User;

    const mxUserId = currentUser.mxUsers[0].mxUserId;

    const membersResponse = await this._mxClient.client.listMembers(mxUserId);

    if (membersResponse.status !== 200) {
      return Result.Fail([{ message: "Error fetching members from MX" }]);
    }

    logger(membersResponse.data.members);

    const connectBanks = membersResponse.data.members.map((member) => {
      return {
        guid: member.guid,
        institutionCode: member.institution_code,
        name: member.name,
        connectionStatus: member.connection_status,
        lastSuccessfulUpdate: member.successfully_aggregated_at,
      };
    });

    return Result.Ok(connectBanks);
  }
}
