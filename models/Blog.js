import mongoose from "mongoose";

const tableOfContentsSchema = new mongoose.Schema({
  level: { type: Number, required: true }, // Heading level (1 = H1, 2 = H2, etc.)
  text: { type: String, required: true }, // Heading text
  id: { type: String }, // Optional anchor link
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  content: { type: String, required: true },
  coverImage: String,
  mainImage: String,
  tags: [{ type: String }],
  seoTitle: String,
  seoDescription: String,
  publishDate: Date,
  series: { type: mongoose.Schema.Types.ObjectId, ref: "UserSeries" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  disableComments: { type: Boolean, default: false },
  sendAsNewsletter: { type: Boolean, default: true },
  tableOfContents: [tableOfContentsSchema],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
      replies: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          text: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookMarked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likesCnt: { type: Number, default: 0 },
  isDraft: { type: Boolean, default: true },
  draftSavedAt: { type: Date },
  deletedAt: { type: Date, default: null }, // ✅ for soft delete
  isHidden: { type: Boolean, default: false },
});

export default mongoose.models.Blog || mongoose.model("Blog", blogSchema);
