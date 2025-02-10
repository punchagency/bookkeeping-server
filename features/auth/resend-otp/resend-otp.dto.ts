import Joi from "joi";

export const resendOtpSchema = Joi.object({
    otp: Joi.string().required()
});

