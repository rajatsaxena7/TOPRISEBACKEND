const User = require("../models/user");
const Dealer = require("../models/dealer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const redisClient = require("/packages/utils/redisClient");
const mongoose = require("mongoose");
const Employee = require("../models/employee");
const ObjectId = mongoose.Types.ObjectId;
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const csv = require("csv-parser");
const streamifier = require("streamifier");

const {
  createUnicastOrMulticastNotificationUtilityFunction,
  sendEmailNotifiation,
} = require("../../../../packages/utils/notificationService");
const {
  welcomeEmail,
} = require("../../../../packages/utils/email_templates/email_templates");
const axios = require("axios");
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

exports.createUser = async (req, res) => {
  try {
    const { email, password, username, phone_Number, role } = req.body;

    // Verify Firebase token
    // const email = decodedToken.email || ""; // optional, fallback to empty

    if (!phone_Number) {
      return sendError(res, "Phone number not found in Firebase token", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, "User already exists", 400);

    // Create user
    const user = await User.create({
      email,
      password,
      username,
      phone_Number,
      role,
    });
    const htmlTemplate = await welcomeEmail(
      username,
      email,
      password,
      "www.toprise.in",
      "company Phone ",
      "company Email",
      "www.Toprise.in"
    );
    const sendData = await sendEmailNotifiation(
      email,
      "Welcome to Toprise",
      htmlTemplate
    );
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
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [firebaseUser._id],
        ["INAPP", "PUSH"],
        "LOGIN ALERT",
        "You have logged in successfully",
        "",
        "",
        "Bearer " + token
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    return sendSuccess(res, { user: firebaseUser, token }, "Login successful");
  } catch (err) {
    logger.error(`❌ Firebase login error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const cacheKey = "users:all";
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("Serving users from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const users = await User.find();
    // await redisClient.setEx(cacheKey, 60 * 5, JSON.stringify(users)); // cache for 5 minutes
    logger.info("Fetched all users from DB");
    sendSuccess(res, users);
  } catch (err) {
    logger.error(`Fetch users error: ${err.message}`);
    sendError(res, err);
  }
};

async function fetchUser(userId) {
  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/${userId}`);
    return data.data || null;
  } catch (e) {
    return null;
  }
}

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // const cacheKey = `users:${id}`;
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`Serving user ${id} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

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
// exports.getUserById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findById(id).lean();
//     if (!user) return sendError(res, "User not found", 404);

//     const vehicles = user.vehicle_details || [];

//     // Enrich each vehicle with metadata by calling product-service individually
//     const enrichedVehicles = await Promise.all(
//       vehicles.map(async (v) => {
//         const brandId = v.brand;
//         const modelId = v.model;
//         const variantId = v.variant;

//         if (!brandId && !modelId && !variantId) return v;

//         try {
//           const { data } = await axios.get(
//             "http://product-service:5001/products/v1/getVehicleDetails",
//             {
//               params: {
//                 brandId,
//                 modelId,
//                 variantId,
//               },
//             }
//           );

//           return {
//             ...v,
//             brand_details: data.brand || {},
//             model_details: data.model || {},
//             variant_details: data.variant || {},
//           };
//         } catch (err) {
//           logger.warn(
//             `Failed to fetch vehicle details for brand=${brandId}, model=${modelId}, variant=${variantId}: ${err.message}`
//           );
//           return v;
//         }
//       })
//     );

//     user.vehicle_details = enrichedVehicles;

//     logger.info(`Fetched user: ${id}`);
//     sendSuccess(res, user);
//   } catch (err) {
//     logger.error(`Get user error: ${err.message}`);
//     sendError(res, err.message || "Internal server error");
//   }
// };

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

exports.getAllDealers = async (req, res) => {
  try {
    // const cacheKey = "dealers:all";

    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("Serving dealers from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const dealers = await Dealer.find().populate(
      "user_id",
      "email phone_Number role"
    );
    // await redisClient.setEx(cacheKey, 300, JSON.stringify(dealers));
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
    // const cacheKey = `dealers:${id}`;
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`Serving dealer ${id} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const dealer = await Dealer.findById(id).populate(
      "user_id",
      "email phone_Number role"
    );
    if (!dealer) return sendError(res, "Dealer not found", 404);

    // await redisClient.setEx(cacheKey, 300, JSON.stringify(dealer));
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
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [user._id],
        ["INAPP", "PUSH"],
        "ADDRESS UPDATE ALERT",
        "Address has added successfully",
        "",
        "",
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
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

    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [user._id],
        ["INAPP", "EMAIL", "PUSH"],
        "LOGIN ALERT",
        "You have logged in successfully",
        "",
        "",
        "Bearer " + token
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
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

    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [user._id],
        ["INAPP", "PUSH"],
        "ADDRESS UPDATE ALERT",
        "Your address has been updated",
        "",
        "",
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [user._id],
        ["INAPP", "PUSH"],
        "ADDRESS UPDATE ALERT",
        "Your address has been Deleted",
        "",
        "",
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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

exports.updateUserCartId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cartId } = req.body;
    console.log("api Called", cartId);

    const user = await User.findById(userId);
    if (!user) return sendError(res, "User not found", 404);

    user.cartId = cartId;
    await user.save();

    logger.info(`✅ Updated cartId for user: ${userId}`);
    sendSuccess(res, user, "CartId updated successfully");
  } catch (err) {
    logger.error(`❌ Update cartId error: ${err.message}`);
    sendError(res, err);
  }
};
exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    /* ---------- 1.  Pull fields from request ---------- */
    const {
      email,
      username,
      password,
      phone_Number,
      role = "User", // defaults to “User” if omitted
      address = [],

      // employee-specific
      employee_id,
      First_name,
      profile_image,
      mobile_number,
      assigned_dealers = [],
      assigned_regions = [],
      employeeRole, // e.g. "Fulfillment-Staff"
    } = req.body;

    /* ---------- 2.  Basic sanity checks ---------- */
    if (!email || !username || !password || !employee_id || !First_name) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const duplicate = await User.findOne({ $or: [{ email }, { username }] });
    if (duplicate) {
      return res
        .status(409)
        .json({ message: "Email or username already exists." });
    }

    /* ---------- 3.  Hash password ---------- */
    const hashedPassword = await bcrypt.hash(password, 12);

    /* ---------- 4.  Create the User ---------- */
    const user = await User.create(
      [
        {
          email,
          username,
          password: hashedPassword,
          phone_Number,
          role,
          address,
        },
      ],
      { session }
    ).then((docs) => docs[0]); // create([]) returns array in a transaction

    /* ---------- 5.  Create the Employee ---------- */
    const employee = await Employee.create(
      [
        {
          user_id: user._id,
          employee_id,
          First_name,
          profile_image,
          mobile_number,
          email, // keep HR systems happy—store again if needed
          role: employeeRole || role,
          assigned_dealers,
          assigned_regions,
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    /* ---------- 6.  Commit the transaction ---------- */
    await session.commitTransaction();
    session.endSession();

    /* ---------- 7.  Sign JWT & respond ---------- */
    const token = generateJWT(user); // 30-day expiry per helper
    const htmlTemplate = await welcomeEmail(
      username,
      email,
      password,
      "www.toprise.in",
      "company Phone ",
      "company Email",
      "www.Toprise.in"
    );
    const sendData = await sendEmailNotifiation(
      email,
      "Welcome to Toprise",
      htmlTemplate
    );
    return res.status(201).json({
      message: "Employee created successfully.",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      employee,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({
      message: "Something went wrong while creating the employee.",
      error: err.message,
    });
  }
};
exports.getEmployeeDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId).populate(
      "user_id",
      "email phone_Number role"
    );
    if (!employee) return sendError(res, "Employee not found", 404);

    logger.info(`Fetched employee details: ${employeeId}`);
    sendSuccess(res, employee);
  } catch (err) {
    logger.error(`Get employee details error: ${err.message}`);
    sendError(res, err);
  }
};
exports.getAllEmployees = async (req, res) => {
  try {
    // Optionally filter/sort (example: sort by creation date)
    const employees = await Employee.find()
      .populate("user_id", "email firstName lastName") // Populate user details
      .populate("assigned_dealers", "name location") // Populate dealer details
      .sort({ created_at: -1 }); // Newest first

    // If no employees found (empty array is a valid response)
    if (!employees.length) {
      return res.status(200).json({
        success: true,
        message: "No employees found",
        data: [],
      });
    }

    // Successful response
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching employees",
      error: err.message,
    });
  }
};
exports.addVehicleDetails = async (req, res) => {
  const { userId } = req.params;
  const vehicle = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { vehicle_details: vehicle } },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, "User not found", 404);
    logger.info(`Vehicle added for user ${userId}`);
    return sendSuccess(res, user.vehicle_details);
  } catch (err) {
    logger.error(`Add vehicle error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { employee_id } = req.query;

    if (!employee_id) {
      return res.status(400).json({ message: "employee_id is required" });
    }

    const employee = await Employee.findOne({ employee_id: employee_id.trim() })
      .populate("user_id", "email username phone_Number role") // populate user details if needed
      .populate("assigned_dealers", "dealerId legal_name trade_name") // optional
      .exec();

    if (!employee) {
      return res
        .status(404)
        .json({ message: `Employee with ID '${employee_id}' not found` });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee by ID:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.editVehicleDetails = async (req, res) => {
  const { userId, vehicleId } = req.params;
  const updates = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, "vehicle_details._id": vehicleId },
      {
        $set: Object.fromEntries(
          Object.entries(updates).map(([key, val]) => [
            `vehicle_details.$.${key}`,
            val,
          ])
        ),
      },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, "User or vehicle not found", 404);

    const updated = user.vehicle_details.find((v) => v._id.equals(vehicleId));
    logger.info(`Vehicle ${vehicleId} updated for user ${userId}`);
    return sendSuccess(res, updated);
  } catch (err) {
    logger.error(`Edit vehicle error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.deleteVehicleDetails = async (req, res) => {
  const { userId, vehicleId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { vehicle_details: { _id: vehicleId } } },
      { new: true }
    );

    if (!user) return sendError(res, "User or vehicle not found", 404);

    logger.info(`Vehicle ${vehicleId} deleted for user ${userId}`);
    return sendSuccess(res, user.vehicle_details);
  } catch (err) {
    logger.error(`Delete vehicle error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.updateFCMToken = async (req, res) => {
  const { userId } = req.params;
  const { fcmToken } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, "User not found", 404);
    logger.info(`FCM token updated for user ${userId}`);
    return sendSuccess(res, user);
  } catch (err) {
    logger.error(`Update FCM token error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.disableDealer = async (req, res) => {
  try {
    const rawId = req.params.dealerId;
    const id = rawId.trim();

    if (!id) {
      return res.status(400).json({ message: "Dealer ID is required" });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid dealer ID format" });
    }

    console.log("Looking for dealer with _id:", id);

    const dealer = await Dealer.findOneAndUpdate(
      { _id: new ObjectId(id) }, // Query by ObjectId
      { is_active: false, updated_at: Date.now() },
      { new: true }
    );

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const productServiceURL =
      "http://product-service:5001/products/v1/disable-by-dealer";

    // You might want to pass the dealerId (not ObjectId) to the product service
    await axios.post(productServiceURL, { dealerId: dealer._id });

    res.status(200).json({
      message: "Dealer disabled and associated products updated",
      dealer,
    });
  } catch (error) {
    console.error("Error disabling dealer:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

async function getSLAIdByNameRemote(name) {
  try {
    const response = await axios.get(
      `http://order-service:5001/api/orders/get-by-name`,
      { params: { name: name.trim() } }
    );
    if (response.data && response.data._id) {
      return response.data._id;
    } else {
      throw new Error(`SLA not found for name: ${name}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to fetch SLA from Order service for name '${name}': ${err.message}`
    );
  }
}

async function getUserIdByEmployeeId(empId) {
  const employee = await Employee.findOne({ employee_id: empId.trim() });

  if (!employee) {
    throw new Error(`Employee with employee_id '${empId}' not found`);
  }

  if (!employee.user_id) {
    throw new Error(`Employee '${empId}' does not have an associated user_id`);
  }

  return employee.user_id;
}
exports.createDealersBulk = async (req, res) => {
  try {
    const results = [];
    const stream = req.file.buffer.toString("utf8");

    await new Promise((resolve, reject) => {
      streamifier
        .createReadStream(Buffer.from(stream))
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Parsed ${results.length} rows from CSV`);

    const createdDealers = [];
    const failedRows = [];

    for (const [index, row] of results.entries()) {
      console.log(`\n📝 Processing row ${index + 1}:`, row);

      try {
        const existingUser = await User.findOne({ email: row.email });

        if (existingUser) {
          console.log(
            `⚠️  Skipping row: User with email ${row.email} already exists`
          );
          continue;
        }

        const hashedPassword = await bcrypt.hash(
          row.password || "default123",
          10
        );

        const newUser = new User({
          email: row.email,
          username: row.username,
          password: hashedPassword,
          phone_Number: row.phone_Number,
          role: "Dealer",
        });

        await newUser.save();
        console.log(`✅ Created user: ${newUser.email} (${newUser._id})`);

        // Assigned employees mapping
        const assignedEmployees = [];
        if (row.assigned_user_ids) {
          const empIds = row.assigned_user_ids.split(",").map((e) => e.trim());

          for (const empId of empIds) {
            try {
              const userId = await getUserIdByEmployeeId(empId);
              assignedEmployees.push({
                assigned_user: userId,
                status: "Active",
              });
              console.log(
                `   ➕ Mapped employee_id ${empId} to user_id ${userId}`
              );
            } catch (mapErr) {
              console.warn(
                `   ⚠️ Employee mapping failed for '${empId}':`,
                mapErr.message
              );
              throw mapErr; // or optionally skip this employee
            }
          }
        }

        // SLA type lookup
        const slaTypeId = row.SLA_type
          ? await getSLAIdByNameRemote(row.SLA_type)
          : null;
        if (slaTypeId)
          console.log(
            `   ✅ SLA '${row.SLA_type}' resolved to ID ${slaTypeId}`
          );

        const newDealer = new Dealer({
          user_id: newUser._id,
          dealerId: `DLR-${uuidv4().slice(0, 8)}`,
          legal_name: row.legal_name,
          trade_name: row.trade_name,
          GSTIN: row.GSTIN,
          Pan: row.Pan,
          Address: {
            street: row.street,
            city: row.city,
            pincode: row.pincode,
            state: row.state,
          },
          contact_person: {
            name: row.contact_name,
            email: row.contact_email,
            phone_number: row.contact_phone,
          },
          categories_allowed: (row.categories_allowed || "")
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          is_active: row.is_active?.toLowerCase() !== "false",
          upload_access_enabled:
            row.upload_access_enabled?.toLowerCase() === "true",
          default_margin: parseFloat(row.default_margin) || 0,
          last_fulfillment_date: row.last_fulfillment_date
            ? new Date(row.last_fulfillment_date)
            : undefined,
          assigned_Toprise_employee: assignedEmployees,
          SLA_type: slaTypeId,
          dispatch_hours: {
            start: parseInt(row.dispatch_start, 10) || 0,
            end: parseInt(row.dispatch_end, 10) || 0,
          },
          SLA_max_dispatch_time: parseInt(row.SLA_max_dispatch_time, 10) || 0,
          onboarding_date: row.onboarding_date
            ? new Date(row.onboarding_date)
            : undefined,
          remarks: row.remarks || "",
        });

        await newDealer.save();
        console.log(
          `✅ Dealer created: ${newDealer.legal_name} (${newDealer._id})`
        );
        createdDealers.push(newDealer);
      } catch (err) {
        console.error(
          `❌ Error in row ${index + 1} (${row.email}):`,
          err.message
        );
        failedRows.push({ row: row.email || row.username, error: err.message });
      }
    }

    console.log(`\n📦 Upload Summary:`);
    console.log(`✅ Created dealers: ${createdDealers.length}`);
    console.log(`❌ Failed rows: ${failedRows.length}`);

    res.status(201).json({
      message: `${createdDealers.length} dealers created successfully`,
      failed: failedRows.length,
      failedRows,
      dealers: createdDealers,
    });
  } catch (err) {
    console.error("🚨 Bulk dealer creation error:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.assignTicketToSupport = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const supportId = req.params.supportId;
    const user = await User.findById(supportId);
    if (!user) {
      logger.error(`User with ID ${supportId} not found`);
      return res.status(404).json({ message: "Support user not found" });
    }

    user.ticketsAssigned = [...user.ticketsAssigned, ticketId];
    await user.save();

    return res.status(200).json({ message: "Ticket assigned to support" });
  } catch (error) {
    console.error("Error assigning ticket to support:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.removeTicketFromSupport = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const supportId = req.params.supportId;
    const user = await User.findById(supportId);
    if (!user) {
      logger.error(`User with ID ${supportId} not found`);
      return res.status(404).json({ message: "Support user not found" });
    }

    user.ticketsAssigned = user.ticketsAssigned.filter(
      (id) => id.toString() !== ticketId.toString()
    );
    await user.save();

    return res.status(200).json({ message: "Ticket removed from support" });
  } catch (error) {
    console.error("Error removing ticket from support:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const roles = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const newThisWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek },
    });

    const usersWithVehicles = await User.countDocuments({
      vehicle_details: { $exists: true, $ne: [] },
    });

    const avgVehicles = await User.aggregate([
      { $project: { vehicleCount: { $size: "$vehicle_details" } } },
      { $group: { _id: null, avg: { $avg: "$vehicleCount" } } },
    ]);

    res.json({
      totalUsers,
      newThisMonth,
      newThisWeek,
      usersWithVehicles,
      avgVehicles: avgVehicles[0]?.avg || 0,
      roles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user stats");
  }
};

exports.getUserInsights = async (req, res) => {
  try {
    const topCities = await User.aggregate([
      { $unwind: "$address" },
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const vehicleTypes = await User.aggregate([
      { $unwind: "$vehicle_details" },
      { $group: { _id: "$vehicle_details.vehicle_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const mostSelectedVehicle = await User.aggregate([
      { $unwind: "$vehicle_details" },
      { $match: { "vehicle_details.selected_vehicle": true } },
      {
        $group: {
          _id: {
            brand: "$vehicle_details.brand",
            model: "$vehicle_details.model",
            variant: "$vehicle_details.variant",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const recentLogins = await User.find()
      .sort({ last_login: -1 })
      .limit(10)
      .select("email username last_login role");

    const withPhone = await User.countDocuments({
      phone_Number: { $exists: true, $ne: null },
    });
    const withoutPhone = await User.countDocuments({
      $or: [{ phone_Number: null }, { phone_Number: "" }],
    });

    res.json({
      topCities,
      vehicleTypes,
      mostSelectedVehicle,
      recentLogins,
      phoneBreakdown: {
        withPhone,
        withoutPhone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user insights");
  }
};

exports.updateWhislistId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { wishlistId } = req.body;

    if (!wishlistId) {
      return sendError(res, "Wishlist ID is required", 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { wishlistId },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, "User not found", 404);
    logger.info(`Wishlist ID updated for user ${userId}`);
    return sendSuccess(res, user, "Wishlist ID updated successfully");
  } catch (err) {
    logger.error(`Update wishlist ID error: ${err.message}`);
    return sendError(res, err);
  }
}
exports.enableDealer = async (req, res) => {
  try {
    const rawId = req.params.dealerId;
    const id = rawId.trim();

    if (!id) {
      return res.status(400).json({ message: "Dealer ID is required" });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid dealer ID format" });
    }

    console.log("Looking for dealer with _id:", id);

    const dealer = await Dealer.findOneAndUpdate(
      { _id: new ObjectId(id) }, // Query by ObjectId
      { is_active: true, updated_at: Date.now() },
      { new: true }
    );

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const productServiceURL =
      "http://product-service:5001/products/v1/enable-by-dealer";

    // You might want to pass the dealerId (not ObjectId) to the product service
    await axios.post(productServiceURL, { dealerId: dealer._id });

    res.status(200).json({
      message: "Dealer enabled and associated products updated",
      dealer,
    });
  } catch (error) {
    console.error("Error disabling dealer:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};