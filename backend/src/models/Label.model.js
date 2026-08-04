import mongoose from "mongoose";

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  color: { type: String, required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true }
}, { timestamps: true })

labelSchema.index({ board: 1 });

const Label = mongoose.model("Label", labelSchema);
export default Label;
