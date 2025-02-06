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
    ).mxUserId;

    const mxUserMember = await this._mxClient.client.listMembers(mxUserId);

    /**
     * For now we can just get the first member. As this is a proof of concept.
     */
    const mxUserMemberGuid = mxUserMember.data.members[0].guid;

    const statementsResponse =
      await this._mxClient.client.listStatementsByMember(
        mxUserMemberGuid,
        mxUserId,
        pageOptions.page,
        pageOptions.recordsPerPage
      );

    if (statementsResponse.status !== 200) {
      return Result.Fail([{ message: "Error getting statements from MX" }]);
    }

    logger(statementsResponse.data);

    return Result.Ok(statementsResponse.data);
  }
}
