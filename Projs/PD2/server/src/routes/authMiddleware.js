// authMiddleware.js
const jwt = require("jsonwebtoken")

const authenticateToken = (req, res, next) => {
  let token = req.headers["authorization"]

  if (!token) {
    return res.status(401).json({
      title: "Unauthorized",
      error: "No token provided",
    })
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length)
  }

  jwt.verify(token, "secretkey", (error, decoded) => {
    if (error) {
      return res.status(401).json({
        title: "Unauthorized",
        error: error.message,
      })
    }

    req.user = decoded // opcional: armazenar informações decodificadas no request para uso posterior
    next()
  })
}

module.exports = authenticateToken
