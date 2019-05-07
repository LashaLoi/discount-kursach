import jwt from "jsonwebtoken";
import _ from "lodash";

export const createTokens = async (user, secret, secret2) => {
  const createToken = jwt.sign(
    {
      id: _.pick(user, ["ProfileId", "FirstName", "LastName"])
    },
    secret,
    {
      expiresIn: "7d"
    }
  );

  const createRefreshToken = jwt.sign(
    {
      user: _.pick(user, ["ProfileId", "FirstName", "LastName"])
    },
    secret2,
    {
      expiresIn: "31d"
    }
  );

  return [createToken, createRefreshToken];
};

export const refreshTokens = async (refreshToken, User, SECRET1, SECRET2) => {
  try {
    const {
      user: { ProfileId }
    } = jwt.decode(refreshToken);

    const user = await User.findOne({
      ProfileId
    });

    jwt.verify(refreshToken, SECRET2);

    const [newToken, newRefreshToken] = await createTokens(
      user,
      SECRET1,
      SECRET2
    );

    return {
      token: newToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    console.log(error);
  }
};
