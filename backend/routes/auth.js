const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth, generateToken } = require("../middleware/auth");

const router = express.Router();

const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];
/**
 * POST /api/auth/register
 * Create new user account (required: name, email, password)
 */router.post("/register", validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const user = new User({ name, email, password });
    await user.save();
    const token = generateToken(user._id);

    return res
      .status(201)
      .json({ message: "Registration successful", user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user (required: email, password) - returns user and token
 */
router.post("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user._id);
    return res.json({ message: "Login successful", user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current logged-in user profile
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    return res.json(user);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/auth/friends
 * Get friends list for current user
 */
router.get("/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "friends",
      "name email",
    );
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/auth/friends/:userId
 * Add a user as friend (bi-directional)
 */
router.post("/friends/:userId", auth, async (req, res) => {
  try {
    const friendId = req.params.userId;
    //prevent adding myself
    if (friendId === req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot add yourself as a friend." });
    }
    //check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found." });
    }
    //add friend
    const user = await User.findById(req.userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends." });
    }

    // Add friend to user
    await User.updateOne(
      { _id: req.userId },
      { $addToSet: { friends: friendId } },
    );

    // Add user to friend (bi-directional)
    await User.updateOne(
      { _id: friendId },
      { $addToSet: { friends: req.userId } },
    );

    const updatedUser = await User.findById(req.userId).populate(
      "friends",
      "name email",
    );

    return res.status(200).json({
      success: true,
      message: "Friend added",
      friends: updatedUser.friends,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/auth/friends/:userId
 * Remove a friend (bi-directional)
 */
router.delete("/friends/:userId", auth, async (req, res) => {
  try {
    const friendId = req.params.userId;

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove friend from user
    await User.updateOne({ _id: req.userId }, { $pull: { friends: friendId } });

    // Remove user from friend
    await User.updateOne({ _id: friendId }, { $pull: { friends: req.userId } });

    // Return updated list
    const updatedUser = await User.findById(req.userId).populate(
      "friends",
      "name email",
    );

    return res.status(200).json({
      success: true,
      message: "Friend removed",
      friends: updatedUser.friends,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/search
 * Search for users by name or email (query: q, minimum 2 characters)
 */
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/auth/me
 * Update user profile (optional: name, email)
 */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { ...(name && { name }), ...(email && { email }) },
      { new: true, runValidators: true }
    );

    return res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * DELETE /api/auth/me
 * Delete user account permanently
 */
router.delete("/me", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    return res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
