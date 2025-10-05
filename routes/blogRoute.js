import express from "express";
import {
  getBlogById,
  searchBlogs,
  filterBlogs,
  getTrendingBlogs,
  getUserFeed,
  getRecommendedBlogs,
  publishBlog,
  unpublishBlog,
  restoreBlog,
  handleBlogLike,
  handleBlogBookMark,
  commentBlog,
  getBlogComments,
  replyComment,
  deleteComment,
  hideBlog,
  deleteBlogByAdmin,
  banUserBlogs,
  getUserDraftBlogs,
  getAllBlogs,
  deleteBlog,
} from "../controllers/blogController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📌 Blog Fetching / Listing
router.get("/getAllBlogs", getAllBlogs);
router.get("/getBlogById/:id", getBlogById);
router.get("/searchBlogs", searchBlogs); // ?q=keyword
router.get("/filterBlogs", filterBlogs); // ?tag=tech&author=123
router.get("/getTrendingBlogs", getTrendingBlogs);
router.get("/getUserDraftBlogs", verifyToken, getUserDraftBlogs);

// 📌 User Feed
router.get("/getUserFeed/:userId", verifyToken, getUserFeed); // personalized feed + authors user flows
router.get("/getRecommendedBlogs/:blogId", getRecommendedBlogs); // AI/ML or tag-based suggestions

// 📌 Blog State & Management
router.post("/publishBlog/:id", verifyToken, publishBlog);
router.post("/unpublishBlog/:id", verifyToken, unpublishBlog);
router.post("/deleteBlog/:id", verifyToken, deleteBlog);
router.post("/restoreBlog/:id", verifyToken, restoreBlog);

// 📌 Engagement
router.post("/likeBlog/:id", verifyToken, handleBlogLike);
router.post("/bookmarkBlog/:id", verifyToken, handleBlogBookMark);
router.post("/commentBlog/:id", verifyToken, commentBlog);
router.get("/getBlogComments/:id", getBlogComments);
router.post("/replyComment/:commentId", verifyToken, replyComment);
router.delete("/deleteComment/:commentId", verifyToken, deleteComment);

//  Admin / Moderation
router.post("/rejectBlog/:id", hideBlog);
router.delete("/deleteBlogByAdmin/:id", deleteBlogByAdmin);
router.post("/banUserBlogs/:userId", banUserBlogs);

export default router;
