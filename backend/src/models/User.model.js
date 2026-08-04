import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  avatar: { type: String, default: "" },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isVerfied: {
    type: Boolean,
    default: false
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpire: {
    type: Date
  },
  verificationToken: {
    type: String
  }
}, {
  timestamps: true
});

// for incrypting the password for the safty resons
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10) //here 10 represent the 10round of hashing algorithm is running
  }
})

const User = mongoose.model("User", userSchema);

export default User;
