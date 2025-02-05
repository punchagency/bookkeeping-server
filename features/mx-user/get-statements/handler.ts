import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import { logger } from "./../../../utils";
import { User } from "./../../../domain/entities/user";
import { Result } from "./../../../application/result";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { IPageOptions, getStatementsSchema } from "./get-statements.dto";

@injectable()
export default class GetStatementsHandler {
  private readonly _mxClient: MxClient;

  constructor(@inject(MxClient.name) mxClient: MxClient) {
    this._mxClient = mxClient;
  }

  public async handle(req: Request, res: Response) {
    const values = await getStatementsSchema.validateAsync(req.query);
    const currentUser = req.user as User;

    const statementsResult = await this.getStatements(currentUser, values);

    if (statementsResult.isFailure) {
      return Result.Fail(statementsResult.errors);
    }

    return Result.Ok(statementsResult.value);
  }

  private async getStatements(user: User, pageOptions: IPageOptions) {
    const mxUserId = user.mxUsers.find(
      (mxUser) => mxUser.id === user._id?.toString()
    )?.mxUserId;
    if (!mxUserId) {
      return Result.Fail([{ message: "MX User ID not found" }]);
    }
    const mxUserMember = await this._mxClient.client.listMembers(mxUserId);

    console.log("====================================");
    console.log("MX User Member:", mxUserMember.data);
    console.log("====================================");

    const mxUserMemberGuid = mxUserMember.data.members[0]?.guid;
    if (!mxUserMemberGuid) {
      return Result.Fail([{ message: "MX User Member GUID not found" }]);
    }
    console.log("====================================");
    console.log("MX User Member GUID:", mxUserMemberGuid);
    console.log("====================================");
    try {
      const statementsResponse = await this._mxClient.client.fetchStatements(
        "MBR-b8809a41-3699-4a0e-adea-4ed6815f0677",
        "USR-747e3e72-5eee-4fe5-b06f-11af9f4c11ac"
      );
      console.log("====================================");
      console.log("Statements Response:", statementsResponse);
      console.log("====================================");
      if (statementsResponse.status !== 200) {
        return Result.Fail([{ message: "Error getting statements from MX" }]);
      }
      logger(statementsResponse.data);
      return Result.Ok(statementsResponse.data);
    } catch (error) {
      console.error("Error fetching statements:");
      return Result.Fail([{ message: "Error fetching statements" }]);
    }
  }
}
