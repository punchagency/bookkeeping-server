import Joi from "joi";

export const getTransactionsSchema = Joi.object({
    perPage: Joi.number().optional(),
    currentPage: Joi.number().optional()
});

