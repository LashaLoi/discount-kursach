import joi from "joi";

export default joi.object().keys({
  name: joi
    .string()
    .required()
    .min(2),
  city: joi.string().required(),
  id: joi.string()
});
