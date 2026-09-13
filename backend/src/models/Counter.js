import mongoose from "mongoose";

// Backs atomic, human-readable sequence numbers (e.g. BR-0001).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

export async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return counter.seq;
}

export default Counter;
