import Joi from 'joi';

const onboardingSchema = Joi.object({
  role: Joi.string().valid('creator', 'brand').required(),
  name: Joi.string().min(2).required(),
  instagram: Joi.string().uri().when('role', {
    is: 'creator',
    then: Joi.required()
  }),
  followers: Joi.number().min(0).when('role', {
    is: 'creator',
    then: Joi.required()
  }),
  niche: Joi.string().when('role', {
    is: 'creator',
    then: Joi.required()
  }),
  brandName: Joi.string().when('role', {
    is: 'brand',
    then: Joi.required()
  }),
  website: Joi.string().uri().when('role', {
    is: 'brand',
    then: Joi.required()
  }),
  category: Joi.string().when('role', {
    is: 'brand',
    then: Joi.required()
  })
});

export const validateRequest = (req, res, next) => {
  const { error } = onboardingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: error.details[0].message
      }
    });
  }
  next();
};