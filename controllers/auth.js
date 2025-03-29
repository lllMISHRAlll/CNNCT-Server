import createError from "../utils/error.js";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const signUp = async (req, res, next) => {
  try {
    console.log("Received signup data:", req.body);

    const { name, email, password, username, preference } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: bcrypt.hashSync(password, 10),
      username,
      preference,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if ((!email && !username) || !password) {
      return next(createError(400, "Missing required fields"));
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    }).select("+password");
    if (!user) return next(createError(401, "Invalid credentials"));

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return next(createError(401, "Invalid credentials"));

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "User Logged In",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        eventsCreated: user.eventsCreated,
        eventsJoined: user.eventsJoined,
      },
    });
  } catch (error) {
    next(createError(500, error.message || "Login failed"));
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("+password");

    if (!user) return next(createError(404, "User not found"));

    res.status(200).json({
      message: "User found",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        availability: user.availability,
      },
    });
  } catch (error) {
    next(createError(500, error.message || "Error fetching user info"));
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, email, password } = req.body;

    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updateFields.password = bcrypt.hashSync(password, salt);
    }

    if (Object.keys(updateFields).length === 0) {
      return next(createError(400, "No valid fields provided for update"));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) return next(createError(404, "User not found"));

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        availability: updatedUser.availability,
      },
    });
  } catch (error) {
    next(createError(500, `Updating user failed: ${error.message}`));
  }
};
