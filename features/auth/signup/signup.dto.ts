import Joi from "joi";

const signupSchema = Joi.object({
  fullName: Joi.string().required().min(6).max(20),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(30).required(),
});

export default signupSchema;
