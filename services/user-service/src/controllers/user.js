const User = require("../models/user");
const Dealer = require("../models/dealer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const redisClient = require("/packages/utils/redisClient");

const generateJWT = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjE3NzMxNzdlODhlZTFiZTMyNWZiMzkyZDZkMDU3MGVkIn0.e30.Om3KOQDXsSvrY8I7BBABYugTo25IadUd7wF1LIgjv8VlDyNYsaXI_t4rPYcZgiMd8JxfS2y2hlQRc86S3Y_vEA",
    { expiresIn: "30d" }
  );
};

exports.signupUser = async (req, res) => {
  try {
    const { firebaseToken, role } = req.body;

    if (!firebaseToken || !role) {
      return sendError(res, "firebaseToken and role are required", 400);
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const phone_Number = decodedToken.phone_number;
    // const email = decodedToken.email || ""; // optional, fallback to empty

    if (!phone_Number) {
      return sendError(res, "Phone number not found in Firebase token", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone_Number });
    if (existingUser) return sendError(res, "User already exists", 400);

    // Create user
    const user = await User.create({
      // email,
      phone_Number,
      role,
    });

    const token = generateJWT(user);
    logger.info(`✅ User created: ${phone_Number}`);
    sendSuccess(res, { user, token }, "User created successfully");
  } catch (err) {
    logger.error(`❌ Signup error: ${err.message}`);
    sendError(res, err);
  }
};
//only use firebaserToken
exports.loginUserForMobile = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return sendError(res, "Firebase token is required", 400);
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    console.log(decodedToken);
    const firebaseEmail = decodedToken.phone_number;

    const firebaseUser = await User.findOne({ phone_Number: firebaseEmail });
    if (!firebaseUser) return sendError(res, "User not found", 404);

    // ✅ Update last_login timestamp
    firebaseUser.last_login = new Date();
    await firebaseUser.save();

    const token = generateJWT(firebaseUser);
    logger.info(`✅ Firebase login: ${firebaseEmail}`);

    return sendSuccess(res, { user: firebaseUser, token }, "Login successful");
  } catch (err) {
    logger.error(`❌ Firebase login error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const cacheKey = "users:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("Serving users from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const users = await User.find();
    await redisClient.setEx(cacheKey, 60 * 5, JSON.stringify(users)); // cache for 5 minutes
    logger.info("Fetched all users from DB");
    sendSuccess(res, users);
  } catch (err) {
    logger.error(`Fetch users error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `users:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`Serving user ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const user = await User.findById(id);
    if (!user) return sendError(res, "User not found", 404);

    // await redisClient.setEx(cacheKey, 60 * 5, JSON.stringify(user));
    logger.info(`Fetched user: ${id}`);
    sendSuccess(res, user);
  } catch (err) {
    logger.error(`Get user error: ${err.message}`);
    sendError(res, err);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, "User not found", 404);
    logger.info(`Deleted user: ${req.params.id}`);
    sendSuccess(res, null, "User deleted");
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    sendError(res, err);
  }
};

exports.revokeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { role: "User" },
      { new: true }
    );
    logger.info(`Revoked role for user: ${id}`);
    sendSuccess(res, user, "Role revoked to User");
  } catch (err) {
    logger.error(`Revoke role error: ${err.message}`);
    sendError(res, err);
  }
};
exports.createDealer = async (req, res) => {
  try {
    const {
      email,
      password,
      phone_Number,
      legal_name,
      trade_name,
      GSTIN,
      Pan,
      Address,
      contact_person,
      categories_allowed,
      upload_access_enabled,
      default_margin,
      last_fulfillment_date,
      assigned_Toprise_employee,
      SLA_type,
      dealer_dispatch_time,
      onboarding_date,
      remarks,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, "User already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      phone_Number,
      role: "Dealer",
    });

    const dealer = await Dealer.create({
      user_id: user._id,
      legal_name,
      trade_name,
      GSTIN,
      Pan,
      Address,
      contact_person,
      dealerId: uuidv4(),
      categories_allowed,
      upload_access_enabled,
      default_margin,
      last_fulfillment_date,
      assigned_Toprise_employee,
      SLA_type,
      dealer_dispatch_time,
      onboarding_date,
      remarks,
    });

    await esClient.index({
      index: "dealers",
      id: dealer._id.toString(),
      body: {
        legal_name,
        trade_name,
        GSTIN,
        Pan,
        contact_person,
        remarks,
        Address,
        categories_allowed,
        user_id: user._id.toString(),
      },
    });

    logger.info(`✅ Dealer created for user: ${email}`);
    sendSuccess(res, { user, dealer }, "Dealer created successfully");
  } catch (err) {
    logger.error(`❌ Create dealer error: ${err.message}`);
    sendError(res, err);
  }
};
exports.updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDealer = await Dealer.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedDealer) return sendError(res, "Dealer not found", 404);
    logger.info(`Updated dealer: ${id}`);
    sendSuccess(res, updatedDealer, "Dealer updated successfully");
  } catch (err) {
    logger.error(`Update dealer error: ${err.message}`);
    sendError(res, err);
  }
};

exports.createUser = async (req, res) => {
  return exports.signupUser(req, res);
};

exports.getAllDealers = async (req, res) => {
  try {
    const cacheKey = "dealers:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("Serving dealers from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const dealers = await Dealer.find().populate(
      "user_id",
      "email phone_Number role"
    );
    await redisClient.setEx(cacheKey, 300, JSON.stringify(dealers));
    logger.info("Fetched all dealers");
    sendSuccess(res, dealers);
  } catch (err) {
    logger.error(`Fetch dealers error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getDealerById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `dealers:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`Serving dealer ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const dealer = await Dealer.findById(id).populate(
      "user_id",
      "email phone_Number role"
    );
    if (!dealer) return sendError(res, "Dealer not found", 404);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(dealer));
    logger.info(`Fetched dealer by ID: ${id}`);
    sendSuccess(res, dealer);
  } catch (err) {
    logger.error(`Get dealer by ID error: ${err.message}`);
    sendError(res, err);
  }
};

exports.editAddress = async (req, res) => {
  try {
  } catch {}
};

exports.updateUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;

    if (!Array.isArray(address)) {
      return sendError(res, "Address must be an array of address objects", 400);
    }

    // Get current user to check existing addresses
    const currentUser = await User.findById(id);
    if (!currentUser) return sendError(res, "User not found", 404);

    // Prepare new addresses with auto-incremented indexes
    const newAddresses = address.map((addr, i) => ({
      ...addr,
      // Start indexing from current length or continue sequence
      index: currentUser.address.length + i,
    }));

    // Update user with new addresses
    const user = await User.findByIdAndUpdate(
      id,
      { $push: { address: { $each: newAddresses } } },
      { new: true }
    );

    logger.info(`✅ Updated address for user: ${id}`);
    sendSuccess(res, user, "Address updated successfully");
  } catch (err) {
    logger.error(`❌ Update address error: ${err.message}`);
    sendError(res, "Failed to update address", 500);
  }
};

exports.loginUserForDashboard = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, "User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(res, "Invalid credentials", 401);

    // ✅ Refresh the token
    const token = generateJWT(user);

    logger.info(`✅ User logged in: ${email}`);
    sendSuccess(res, { user, token }, "Login successful");
  } catch (err) {
    logger.error(`❌ Login error: ${err.message}`);
    sendError(res, err);
  }
};

exports.mapCategoriesToUser = async (req, res) => {
  try {
    const { dealer_id, category_ids } = req.body;

    const user = await User.findById(dealer_id);
    if (!user) return sendError(res, "User not found", 404);

    user.assigned_categories = category_ids;
    await user.save();

    logger.info(`✅ Updated user ${dealer_id} with assigned categories`);
    sendSuccess(res, user, "Assigned categories to user successfully");
  } catch (err) {
    logger.error(`❌ Failed to assign categories to user: ${err.message}`);
    sendError(res, err);
  }
};

exports.checkUserAccountCreated = async (req, res) => {
  try {
    const { phone_Number } = req.body;

    if (!phone_Number) {
      return sendError(res, "Phone number is required", 400);
    }

    const user = await User.findOne({ phone_Number });

    if (user) {
      logger.info(`✅ User exists with phone number: ${phone_Number}`);
      return sendSuccess(res, { exists: true }, "User account exists");
    } else {
      logger.info(`❌ No user found with phone number: ${phone_Number}`);
      return sendSuccess(res, { exists: false }, "User account does not exist");
    }
  } catch (err) {
    logger.error(`❌ Error checking user existence: ${err.message}`);
    sendError(res, err);
  }
};

exports.editUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { index, updatedAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) return sendError(res, "User not found", 404);

    if (!user.address[index])
      return sendError(res, "Address index does not exist", 400);

    user.address[index] = { ...user.address[index], ...updatedAddress };
    await user.save();

    logger.info(`✅ Address updated for user: ${userId}`);
    sendSuccess(res, user, "Address updated successfully");
  } catch (err) {
    logger.error(`❌ Edit address error: ${err.message}`);
    sendError(res, err);
  }
};

// ✅ Delete address by index
exports.deleteUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { index } = req.body;

    const user = await User.findById(userId);
    if (!user) return sendError(res, "User not found", 404);

    if (!user.address[index])
      return sendError(res, "Address index does not exist", 400);

    user.address.splice(index, 1);
    await user.save();

    logger.info(`🗑️ Address deleted for user: ${userId}`);
    sendSuccess(res, user, "Address deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete address error: ${err.message}`);
    sendError(res, err);
  }
};

// ✅ Edit or Add email and username
exports.updateEmailOrName = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, username } = req.body;

    const updateData = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) return sendError(res, "User not found", 404);

    logger.info(`✅ Updated email/username for user: ${userId}`);
    sendSuccess(res, updatedUser, "User profile updated successfully");
  } catch (err) {
    logger.error(`❌ Update profile error: ${err.message}`);
    sendError(res, err);
  }
};
