const User = require("../models/user");
const Dealer = require("../models/dealer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { sendSuccess, sendError } = require("packages/utils/responseHandler");
const logger = require("packages/utils/logger");
const redisClient = require("packages/utils/redisClient");

const generateJWT = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjE3NzMxNzdlODhlZTFiZTMyNWZiMzkyZDZkMDU3MGVkIn0.e30.Om3KOQDXsSvrY8I7BBABYugTo25IadUd7wF1LIgjv8VlDyNYsaXI_t4rPYcZgiMd8JxfS2y2hlQRc86S3Y_vEA",
    { expiresIn: "7d" }
  );
};

exports.signupUser = async (req, res) => {
  try {
    const { email, password, phone_Number, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, "User already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      phone_Number,
      role,
    });

    const token = generateJWT(user);
    logger.info(`User created: ${email}`);
    sendSuccess(res, { user, token }, "User created successfully");
  } catch (err) {
    logger.error(`Signup error: ${err.message}`);
    sendError(res, err);
  }
};

exports.loginUserForMobile = async (req, res) => {
  try {
    const { email, password, firebaseToken } = req.body;

    if (firebaseToken) {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const firebaseUser = await User.findOne({ email: decodedToken.email });
      if (!firebaseUser) return sendError(res, "User not found", 404);
      const token = generateJWT(firebaseUser);
      logger.info(`Firebase login: ${email}`);
      return sendSuccess(
        res,
        { user: firebaseUser, token },
        "Login successful"
      );
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, "User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(res, "Invalid credentials", 400);

    const token = generateJWT(user);
    logger.info(`Login successful: ${email}`);
    sendSuccess(res, { user, token }, "Login successful");
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
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

    await redisClient.setEx(cacheKey, 60 * 5, JSON.stringify(user));
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

exports.updateUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body; // ✅ Correct field name (lowercase 'a')

    if (!Array.isArray(address)) {
      return sendError(res, "Address must be an array of address objects", 400);
    }

    const user = await User.findByIdAndUpdate(id, { address }, { new: true });

    if (!user) return sendError(res, "User not found", 404);

    logger.info(`✅ Updated address for user: ${id}`);
    sendSuccess(res, user, "Address updated successfully");
  } catch (err) {
    logger.error(`❌ Update address error: ${err.message}`);
    sendError(res, err);
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
