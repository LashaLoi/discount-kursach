import joi from "joi";

export default joi.object().keys({
  name: joi
    .string()
    .required()
    .min(2),
  id: joi.string()
});
