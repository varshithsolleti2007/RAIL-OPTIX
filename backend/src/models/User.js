import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["admin", "control", "engineering", "electrical", "snt"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      // Required for department-scoped roles, not for admin/control.
      required: function () {
        return ["engineering", "electrical", "snt"].includes(this.role);
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    isActive: this.isActive,
  };
};

export default mongoose.model("User", userSchema);
