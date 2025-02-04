import Joi from "joi";

export const chatDto = Joi.object({
  message: Joi.string().required(),
});
