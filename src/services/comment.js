import joi from "joi";

export default joi.object().keys({
  firstName: joi
    .string()
    .required()
    .min(2),
  lastName: joi
    .string()
    .required()
    .min(2),
  message: joi
    .string()
    .required()
    .min(0),
  benefit: joi.string(),
  userId: joi.number().required(),
  rating: joi.number().required()
});
