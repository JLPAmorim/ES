const mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    unique: true,
    type: String,
  },
  password: String,
  publicKey: String,
  mensagens: [
    {
      sender: String,
      receivers: [String],
      time: String,
      subject: String,
      content: String,
      read: String,
    },
  ],
  sentMessages: [
    {
      sender: String,
      receivers: [String],
      time: String,
      subject: String,
      content: String,
      read: String,
    },
  ],
  deletedMessages: [
    {
      sender: String,
      receivers: [String],
      time: String,
      subject: String,
      content: String,
      read: String,
    },
  ],
})

module.exports = mongoose.model("user", userSchema)
