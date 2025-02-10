export const RESEND_OTP_EVENT = "RESEND_OTP_EVENT";

export interface IResendOtpEvent {
  fullName: string;
  email: string;
  otp: string;
}
