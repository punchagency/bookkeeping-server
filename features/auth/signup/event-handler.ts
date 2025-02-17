import { container } from "tsyringe";

import { logger } from "../../../utils";
import signupEventEmitter from "./event";
import { ISignupEvent, SIGNUP_EVENT } from "./event.dto";
import SendgridService from "../../../infrastructure/config/packages/sendgrid";

const sendgridService = container.resolve(SendgridService);

signupEventEmitter.on(SIGNUP_EVENT, async (data: ISignupEvent) => {
  try {
    logger("Handling signup event", data);
    const { fullName, otp, email } = data;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Verify Your Account</h1>
        <p>Hi ${fullName},</p>
        <p>Thank you for creating an account with us. Please use the following OTP to verify your account:</p>
        <div style="text-align: center; padding: 20px;">
          <h2 style="letter-spacing: 5px; font-size: 32px; color: #4F46E5;">${otp}</h2>
        </div>
        <p>This OTP will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Bookkeeping Team</p>
      </div>
    `;

    await sendgridService.sendEmail(
      email,
      "Verify Your Account - Bookkeeping",
      emailBody
    );

    logger(`Verification email sent to ${email}`);
  } catch (error) {
    logger("Error sending verification email:", error);
  }
});

logger("Signup event handler registered");
