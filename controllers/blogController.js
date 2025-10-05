import Blog from "../models/Blog.js";
import User from "../models/User.js";

// token check , remove draft blogs from all apis

export const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * 10;
    // $regex → searches inside strings (title in this case).
    // $options: "i" → case-insensitive match.
    const blogs = await Blog.find({
      isDraft: false,
      deletedAt: null,
      isHidden: false,
    })
      .populate({
        path: "author",
        match: { isBanned: false }, // ✅ exclude banned authors
        select: "name email avatar",
      })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    // remove blogs where author is null (filtered by match)
    const filteredBlogs = blogs.filter((blog) => blog.author !== null);

    const total = await Blog.countDocuments({
      isDraft: false,
      deletedAt: null,
      isHidden: false,
    });

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: filteredBlogs.length,
      blogs: filteredBlogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (blog) {
      res.json({ message: "success", data: blog });
    } else {
      res.json({ message: "No blog found", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const searchBlogs = async (req, res) => {
  try {
    const searchText = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({
      isDraft: false,
      deletedAt: null,
      isHidden: false,
      $or: [
        { title: { $regex: searchText, $options: "i" } },
        { tags: searchText },
      ],
    })
      .populate({
        path: "author",
        match: { isBanned: false },
        select: "name email avatar",
      })
      .skip(skip)
      .limit(limit);

    const filteredBlogs = blogs.filter((blog) => blog.author !== null);
    const total = filteredBlogs.length;

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      blogs: filteredBlogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const filterBlogs = async (req, res) => {
  try {
    const { filters = [], page = 1 } = req.body;
    const limit = 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({
      isDraft: false,
      deletedAt: null,
      isHidden: false,
      tags: { $in: filters },
    })
      .populate({
        path: "author",
        match: { isBanned: false },
        select: "name email avatar",
      })
      .skip(skip)
      .limit(limit);

    const filteredBlogs = blogs.filter((blog) => blog.author !== null);
    const total = filteredBlogs.length;

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      blogs: filteredBlogs,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const getTrendingBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const trendingBlogs = await Blog.aggregate([
      {
        $match: {
          isDraft: false,
          deletedAt: null,
          isHidden: false,
        },
      },
      {
        $addFields: {
          commentCount: { $size: { $ifNull: ["$comments", []] } },
        },
      },
      {
        $addFields: {
          trendingScore: { $add: ["$likesCnt", "$commentCount"] },
        },
      },
      { $sort: { trendingScore: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Populate author manually to exclude banned ones
    const blogsWithAuthors = await Blog.populate(trendingBlogs, {
      path: "author",
      match: { isBanned: false },
      select: "name email avatar",
    });

    const filteredBlogs = blogsWithAuthors.filter(
      (blog) => blog.author !== null
    );
    const total = filteredBlogs.length;

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      blogs: filteredBlogs,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserDraftBlogs = async (req, res) => {
  try {
    const { userId, page } = req.body;
    const limit = 10;
    const skip = (page - 1) * limit;
    const isUserPresent = await User.findOne({ email: userId });
    if (!userId || !isUserPresent) {
      return res.status(400).json({ message: "User not fount" });
    }

    const draftBlogs = await Blog.find({
      author: isUserPresent._id,
      isDraft: true,
    })
      .skip(skip)
      .limit(limit);

    res.json(draftBlogs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserFeed = async (req, res) => {
  try {
    const { email, page = 1 } = req.body;
    const limit = 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const customBlogs = await Blog.find({
      isDraft: false,
      deletedAt: null,
      isHidden: false,
      tags: { $in: user.customFeed },
    })
      .populate({
        path: "author",
        match: { isBanned: false },
        select: "name email avatar",
      })
      .skip(skip)
      .limit(limit);

    const filteredBlogs = customBlogs.filter((blog) => blog.author !== null);

    res.json(filteredBlogs);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRecommendedBlogs = async (req, res) => {
  try {
    const { blogid, email } = req.body;
    const blog = await Blog.findById(blogid);
    const user = await User.findOne({ email });

    if (!blog || !user) {
      return res.status(404).json({ message: "Blog or user not found" });
    }

    const recommendedBlogs = await Blog.find({
      _id: { $ne: blogid },
      isDraft: false,
      deletedAt: null,
      isHidden: false,
      $or: [{ author: blog.author }, { tags: { $in: user.customFeed } }],
    })
      .populate({
        path: "author",
        match: { isBanned: false },
        select: "name email avatar",
      })
      .limit(10);

    const filteredBlogs = recommendedBlogs.filter((b) => b.author !== null);

    res.json(filteredBlogs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const publishBlog = async (req, res) => {
  try {
    const {
      publishDate,
      seoTitle,
      seoDescription,
      title,
      subtitle,
      content,
      coverImage,
      mainImage,
      isDraft = false,
      tags,
      series,
      author,
      disableComments,
      sendAsNewsletter,
      tableOfContents,
    } = req.body;

    const user = await User.findOne({ email });

    if (!title || !content || !author || !user) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const newBlog = await Blog.create({
      publishDate: publishDate || new Date(),
      seoTitle,
      seoDescription,
      title,
      subtitle,
      content,
      coverImage,
      mainImage,
      isDraft,
      tags,
      series,
      author,
      disableComments,
      sendAsNewsletter,
      tableOfContents,
    });

    user.blogs.push(newBlog._id);
    await user.save();

    return res.status(200).json({
      message: "Posted successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error publishing blog:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const unpublishBlog = async (req, res) => {
  try {
    const { blogid, email } = req.body;

    // 1. Validate inputs
    if (!blogid || !email) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Find blog and ensure it belongs to the user
    const blog = await Blog.findOne({ _id: blogid, author: user._id });
    if (!blog) {
      return res
        .status(404)
        .json({ message: "Blog not found or not authorized" });
    }

    // 4. Update blog to draft
    blog.isDraft = true;
    await blog.save();

    return res.status(200).json({
      message: "Blog unpublished successfully",
      blog,
    });
  } catch (error) {
    console.error("Error unpublishing blog:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { blogid } = req.body;

    if (!blogid) {
      return res.status(400).json({ message: "Blog ID is required" });
    }

    const blog = await Blog.findByIdAndUpdate(
      blogid,
      { deletedAt: new Date() }, // ✅ soft delete
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json({
      message: "Blog deleted successfully",
      blog,
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const restoreBlog = async (req, res) => {
  try {
    const { blogid } = req.body;

    if (!blogid) {
      return res.status(400).json({ message: "Blog ID is required" });
    }

    const blog = await Blog.findByIdAndUpdate(
      blogid,
      { deletedAt: null }, // ✅ restore
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json({
      message: "Blog restored successfully",
      blog,
    });
  } catch (error) {
    console.error("Error restoring blog:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const handleBlogLike = async (req, res) => {
  try {
    const { blogId, email } = req.body;
    const blog = await Blog.findById(blogId);
    const user = await User.findOne({ email: email });

    if (!blogId || !email || !blog || !user) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const alreadyLiked = blog.likes.includes(user._id);

    if (alreadyLiked) {
      blog.likes = blog.likes.filter((id) => id !== user._id);
      user.likedBlogs = user.likedBlogs.filter((id) => id !== user._id);
      blog.likesCnt = blog.likesCnt - 1;
    } else {
      blog.likes = blog.likes.push(user._id);
      user.likedBlogs = user.likedBlogs.push(blog._id);
      blog.likesCnt = blog.likesCnt + 1;
    }

    await blog.save();
    await user.save();

    return res.status(200).json({
      message: alreadyLiked
        ? "Blog unliked successfully"
        : "Blog liked successfully",
      liked: !alreadyLiked,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handleBlogBookMark = async (req, res) => {
  try {
    const { blogId, email } = req.body;
    const blog = await Blog.findById(blogId);
    const user = await User.findOne({ email: email });

    if (!blogId || !email || !blog || !user) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const alreadyBookmarked = blog.bookMarked.includes(user._id);

    if (alreadyBookmarked) {
      blog.bookMarked = blog.bookMarked.filter((id) => id !== user._id);
      user.bookmarkedBlogs = user.bookmarkedBlogs.filter(
        (id) => id !== user._id
      );
    } else {
      blog.bookMarked = blog.bookMarked.push(user._id);
      user.bookmarkedBlogs = user.bookmarkedBlogs.push(blog._id);
    }

    await blog.save();
    await user.save();

    return res.status(200).json({
      message: alreadyBookmarked
        ? "Blog unbookmarked successfully"
        : "Blog bookmarked successfully",
      bookmarked: !alreadyBookmarked,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const commentBlog = async (req, res) => {
  try {
    const { blogId, email, text } = req.body;

    const blog = await Blog.findById(blogId);
    const user = await User.findOne({ email });

    if (!blogId || !blog || !email || !user || !text) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const newComment = {
      user: user._id,
      text,
      createdAt: new Date(),
      replies: [],
    };

    blog.comments.push(newComment);

    await blog.save();
    return res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error in commentBlog:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId).populate({
      path: "comments.user",
      select: "name email avatar",
    });

    if (!blogId || !blog) {
      return res.status(400).json({ message: "Invalid data" });
    }
    return res.status(200).json({
      message: "Fetched comments successfully",
      comments: blog.comments,
    });
  } catch (error) {
    console.error("Error in getBlogComments:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const replyComment = async (req, res) => {
  try {
    const { blogId, commentId, email, text } = req.body;

    if (!blogId || !commentId || !email || !text) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const blog = await Blog.findById(blogId);
    const user = await User.findOne({ email });

    if (!blog || !user) {
      return res.status(404).json({ message: "Blog or user not found" });
    }

    const comment = blog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const newReply = {
      user: user._id,
      text,
      createdAt: new Date(),
    };

    comment.replies.push(newReply);
    await blog.save();

    return res.status(201).json({
      message: "Reply added successfully",
      reply: newReply,
    });
  } catch (error) {
    console.error("Error in replyComment:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { blogId, commentId, replyId, email } = req.body;

    const blog = await Blog.findById(blogId);
    const user = await User.findOne({ email });
    if (!blogId || !email || !blog || !user) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const comment = blog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    // Check if the logged-in user is the blog owner
    const isBlogOwner = blog.author.toString() === user._id.toString();

    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      //  Allow deletion if user is reply owner, blog owner, or admin
      if (
        reply.user.toString() !== user._id.toString() &&
        !isBlogOwner &&
        user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this reply" });
      }

      reply.deleteOne(); // remove the reply
    }
    // CASE 2: Delete a comment
    else {
      //  Allow deletion if user is comment owner, blog owner, or admin
      if (
        comment.user.toString() !== user._id.toString() &&
        !isBlogOwner &&
        user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this comment" });
      }

      comment.deleteOne(); // remove the comment
    }

    await blog.save();

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error in replyComment:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const hideBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await Blog.findByIdAndUpdate(id, { isHidden: true }); // Add `isHidden` to Blog model
    res.json({ message: "Blog hidden successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const banUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    await Blog.updateMany({ author: userId }, { isBanned: true }); // Add `isBanned` in Blog schema
    res.json({ message: "All blogs by user banned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteBlogByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog deleted by admin" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
