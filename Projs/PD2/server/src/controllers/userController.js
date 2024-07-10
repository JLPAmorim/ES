// Controlador para o model user
var User = require("../models/user")

// Devolve a lista de Users
module.exports.listar = () => {
  return User.find().exec()
}

// Consulta de User
module.exports.consultar = (_id) => {
  return User.findOne({ _id: _id }).exec()
}

// Insere um User
module.exports.inserir = (u) => {
  const novo = new User(u)
  return novo.save()
}

// Remove User
module.exports.remover = function (email) {
  return User.deleteOne({ email: email })
}

// Find User by Email
module.exports.findByEmail = function (email) {
  return User.find({ user: email }).sort({ $natural: -1 })
}

module.exports.addMessage = (u) => {
  const novo = new User(u)
  return novo.save()
}
