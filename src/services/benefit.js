import joi from "joi";

export default joi.object().keys({
  id: joi.string(),
  name: joi
    .string()
    .required()
    .min(1),
  discount: joi.array().required(),
  description: joi.string().required(),
  working: joi.string(),
  category: joi.string(),
  locations: joi.array().required(),
  rating: joi
    .number()
    .min(0)
    .max(5),
  url: joi.string().required(),
  link: joi.string().required(),
  phone: joi.string().required(),
  count: joi.number().default(0)
});
