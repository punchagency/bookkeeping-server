export const SIGNUP_EVENT = "SIGNUP_EVENT";

export interface ISignupEvent {
  fullName: string;
  email: string;
  otp: string;
}


export interface ISignupErrorContext {
  statusCode: number;
}
