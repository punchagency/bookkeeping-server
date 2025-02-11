import Joi from "joi";

export const updateSettingsSchema = Joi.object({
  fullName: Joi.string().optional(),
  voice: Joi.string()
    .optional()
    .allow(
      "alloy",
      "ash",
      "coral",
      "echo",
      "fable",
      "onyx",
      "nova",
      "sage",
      "shimmer"
    ),
});

export interface IUpdateSettings {
  fullName: string;
  voice: string;
}
