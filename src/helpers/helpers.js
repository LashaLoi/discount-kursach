export const findBenefitByCity = async (category, db) => {
  const { city } = await db.category.findById(category);

  return await db.city.findById(city);
};

export const findVoteByBenefit = async (comment, db) => {
  const { benefit } = await db.comment.findById(comment);

  return await db.benefit.findById(benefit);
};

export const isFileImage = url => {
  const { NODE_ENV, DOMAIN_PROD, DOMAIN_DEV } = process.env;

  let image = null;

  if (url.includes("https://wiki.itechart-group.com")) {
    image = url;
  } else {
    image =
      NODE_ENV === "development"
        ? `${DOMAIN_DEV}/images/${url}`
        : `${DOMAIN_PROD}/images/${url}`;
  }

  return image;
};
