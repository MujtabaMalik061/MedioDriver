import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    views: { type: Number, default: 0 },
    gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true },
    uploadBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadSource: { type: String, enum: ["site", "apikey"], default: "site" },
    uploadedViaKey: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey", default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Media", mediaSchema);
