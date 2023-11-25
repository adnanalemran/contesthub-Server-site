const jwt = require("jsonwebtoken");
const createToken = require("../../../lib/authentication/createToken");

const createAuthCookie = (req, res, next) => {
  const user = req.body;
  console.log(user);

  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.send({ success: true });
};

module.exports = createAuthCookie;
