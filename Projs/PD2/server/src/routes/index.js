const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../controllers/userController")
const authenticateToken = require("./authMiddleware")
const UserModel = require("../models/user")
const { format } = require("date-fns")
const fs = require("fs")

// GET dos dados do user com Autenticação/Token no LocalStorage (Feito)
router.get("/user", authenticateToken, async (req, res) => {
  // Verifica se o userId está presente
  const userId = req.user?.userId
  if (!userId) {
    return res.status(400).json({
      title: "Bad Request",
      error: "User ID is missing from the token",
    })
  }

  try {
    const user = await UserModel.findOne({ _id: userId }).exec()
    if (!user) {
      return res.status(404).json({
        title: "User not found",
        error: "No user found with this ID",
      })
    }
    res.status(200).json({
      title: "User Grabbed",
      user: user,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      title: "Failed to retrieve user",
      error: error.message,
    })
  }
})

// Registo de um novo User (Feito)
router.post("/user", async (req, res) => {
  const { firstName, lastName, email, password, publicKey } = req.body
  console.log("public key: " + publicKey)
  console.log("Tudo: " + req.body)
  const hashedPassword = await bcrypt.hash(password, 10)
  const messages = []
  const sentMessages = []
  const deletedMessages = []

  const newUser = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    publicKey,
    messages,
    sentMessages,
    deletedMessages,
  }

  User.inserir(newUser)
    .then((dados) => res.status(201).jsonp({ dados: dados }))
    .catch((e) => {
      if (e.code === 11000) {
        res.status(500).jsonp({ error: "Email in use" })
      } else {
        res.status(500).jsonp({ error: e.message })
      }
    })
})

// Efetuar Login de um User
router.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email })

    if (!user) {
      return res.status(401).json({
        title: "User not found",
        error: "Invalid Credentials",
      })
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({
        title: "Login failed",
        error: "Invalid Credentials",
      })
    }

    const token = jwt.sign({ userId: user._id }, "secretkey", { expiresIn: "1h" })
    return res.status(201).json({
      title: "Login successful",
      token: token,
      user: user,
    })
  } catch (err) {
    return res.status(500).json({
      title: "Server error",
      error: err,
    })
  }
})

// Adicionar uma mensagem referente a um User específico
router.post("/sendmessage", authenticateToken, async (req, res) => {
  const { sender, receivers, subject, content, oldContent } = req.body

  const now = new Date()
  const formattedDate = format(now, "dd/MM/yyyy - HH:mm")

  const newMessage = {
    sender: sender,
    receivers: receivers,
    time: formattedDate,
    subject: subject,
    content: content,
    read: false,
  }

  const sentMessage = {
    sender: sender,
    receivers: receivers,
    time: formattedDate,
    subject: subject,
    content: oldContent,
    read: false,
  }

  try {
    const senderUser = await UserModel.findOne({ email: sender })
    if (!senderUser) {
      return res.status(404).json({ message: "Sender not found" })
    }

    senderUser.sentMessages = senderUser.sentMessages || []
    senderUser.sentMessages.push(sentMessage)
    await senderUser.save()

    const users = await UserModel.find({ email: { $in: receivers } })

    if (users.length === 0) {
      return res.status(404).json({ message: "No receivers found" })
    }

    users.forEach(async (user) => {
      user.mensagens.push(newMessage)
      await user.save()
    })

    res.status(201).json({ message: "Messages sent successfully to all receivers" })
  } catch (error) {
    console.error("Error sending messages:", error)
    res.status(500).json({ message: "Failed to send messages", error: error.message })
  }
})

// Endpoint para dar delete numa mensagem específica de um user
router.delete("/messages/:messageId", authenticateToken, async (req, res) => {
  const { messageId } = req.params
  const { userEmail } = req.body

  try {
    const user = await UserModel.findOne({ email: userEmail, "mensagens._id": messageId }, { "mensagens.$": 1 })
    if (!user) {
      return res.status(404).send("User not found or message doesn't exist.")
    }

    const messageToMove = user.mensagens[0]
    if (!messageToMove) {
      return res.status(404).send("Message not found.")
    }

    const pullResult = await UserModel.updateOne({ email: userEmail }, { $pull: { mensagens: { _id: messageId } } })
    if (pullResult.modifiedCount === 0) {
      return res.status(404).send("Error deleting message.")
    }

    const pushResult = await UserModel.updateOne({ email: userEmail }, { $push: { deletedMessages: messageToMove } })
    if (pushResult.modifiedCount === 0) {
      return res.status(500).send("Error adding message to deleted messages array.")
    }

    res.send("Message deleted successfully and moved to deleted messages array.")
  } catch (error) {
    console.error("Error deleting message:", error)
    res.status(500).send("Error processing request.")
  }
})

router.put("/messages/:id", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { userEmail, read } = req.body

  try {
    const result = await UserModel.updateOne({ email: userEmail, "mensagens._id": id }, { $set: { "mensagens.$.read": read } })

    if (result.modifiedCount === 0) {
      return res.status(404).send("Message not found or email is incorrect.")
    }

    res.send("Message read state updated successfully.")
  } catch (error) {
    console.error("Error updating message:", error)
    res.status(500).send("Error updating message.")
  }
})

router.post("/deletemessages", authenticateToken, async (req, res) => {
  const { ids, userEmail } = req.body
  console.log("IDs: " + ids)
  console.log("User email: " + userEmail)

  try {
    const user = await UserModel.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).send({ message: "User not found." })
    }

    const messagesToMove = user.mensagens.filter((msg) => ids.includes(msg._id.toString()))

    if (messagesToMove.length === 0) {
      return res.status(404).send({ message: "No message found for the given ids." })
    }

    const pullResult = await UserModel.updateOne({ email: userEmail }, { $pull: { mensagens: { _id: { $in: ids } } } })
    if (pullResult.modifiedCount === 0) {
      return res.status(404).send({ message: "Error tryin to remove messages." })
    }

    const pushResult = await UserModel.updateOne({ email: userEmail }, { $push: { deletedMessages: { $each: messagesToMove } } })
    if (pushResult.modifiedCount === 0) {
      return res.status(500).send({ message: "Error trying to add messages to deletedMessages araray." })
    }

    res.send({ message: "Messages deleted successfully." })
  } catch (error) {
    console.error("Error deleting message:", error)
    res.status(500).send({ message: "Error processing messages." })
  }
})

router.put("/markmessages", authenticateToken, async (req, res) => {
  const { ids, userEmail, read } = req.body

  try {
    console.log(userEmail)
    const user = await UserModel.findOne({ email: userEmail })

    if (!user) {
      return res.status(404).send({ message: "User not found." })
    }

    const messageIds = ids.map((id) => id.toString())
    user.mensagens.forEach((message) => {
      if (messageIds.includes(message._id.toString())) {
        message.read = read
      }
    })

    await user.save()
    res.send({ message: "Messages marked as read successfully." })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    res.status(500).send({ message: "Failed to mark messages as read." })
  }
})

router.get("/getPublicKey/:email", authenticateToken, async (req, res) => {
  try {
    const email = req.params.email
    const user = await UserModel.findOne({ email: email })

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." })
    }

    if (!user.publicKey) {
      return res.status(404).json({ message: "Chave pública não disponível para este usuário." })
    }
    console.log("Entrei aqui com sucesso")

    res.json({ publicKey: user.publicKey })
  } catch (error) {
    console.error("Erro ao buscar chave pública:", error)
    res.status(500).json({ message: "Erro ao processar a solicitação." })
  }
})

module.exports = router
