/* controller/type.js
   ----------------------------------------------------------------------- */
const Type = require("../models/type");
const {
  cacheGet,
  cacheSet,
  cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");

const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const { createUnicastOrMulticastNotificationUtilityFunction } = require("../../../../packages/utils/notificationService");

/* ────────────────────────────────────────────────────────────────────── */
/*  CREATE                                                               */
/* ────────────────────────────────────────────────────────────────────── */
exports.createType = async (req, res) => {
  try {
    const { type_name, type_code, created_by, updated_by } = req.body;

    /* ⬇ upload image (optional) */
    let image;
    if (req.file) {
      const up = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "types"
      );
      image = up.location;
    }

    const doc = await Type.create({
      type_name,
      type_code,
      image,
      created_by,
      updated_by,
    });

    await cacheDel(["types:all"]); // invalidate list cache

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })

    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "Type Create ALERT",
      `New Type has been created by ${created_by} - ${type_name}`,
      "",
      "",
      "Type",
      {
        type_id: doc._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Type created ${type_code}`);
    return sendSuccess(res, doc, "Type created successfully");
  } catch (err) {
    logger.error(`❌ createType: ${err.message}`);
    return sendError(res, err);
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET ALL (cached)                                                     */
/* ────────────────────────────────────────────────────────────────────── */
exports.getAllTypes = async (_req, res) => {
  try {
    const key = "types:all";

    const cached = await cacheGet(key);
    if (cached) {
      logger.info("🔁 types:all served from cache");
      return sendSuccess(res, cached);
    }

    const types = await Type.find().lean();
    await cacheSet(key, types, 300); // 5 min TTL

    logger.info("✅ types:all fetched from Mongo");
    return sendSuccess(res, types);
  } catch (err) {
    logger.error(`❌ getAllTypes: ${err.message}`);
    return sendError(res, err);
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET BY ID (cached)                                                   */
/* ────────────────────────────────────────────────────────────────────── */
exports.getTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `type:${id}`;

    const cached = await cacheGet(key);
    if (cached) {
      logger.info(`🔁 ${key} served from cache`);
      return sendSuccess(res, cached);
    }

    const type = await Type.findById(id);
    if (!type) return sendError(res, "Type not found", 404);

    await cacheSet(key, type, 300);
    logger.info(`✅ ${key} fetched from Mongo`);
    return sendSuccess(res, type);
  } catch (err) {
    logger.error(`❌ getTypeById: ${err.message}`);
    return sendError(res, err);
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  UPDATE                                                               */
/* ────────────────────────────────────────────────────────────────────── */
exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, type_code, updated_by } = req.body;

    const patch = { type_name, type_code, updated_by, updated_at: new Date() };

    if (req.file) {
      const up = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "types"
      );
      patch.image = up.location;
    }

    const doc = await Type.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) return sendError(res, "Type not found", 404);

    await cacheDel(["types:all", `type:${id}`]); // drop stale entries


    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })

    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "Type Update ALERT",
      `New Type has been updated by ${updated_by} - ${type_name}`,
      "",
      "",
      "Type",
      {
        type_id: doc._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Type ${id} updated`);
    return sendSuccess(res, doc, "Type updated successfully");
  } catch (err) {
    logger.error(`❌ updateType: ${err.message}`);
    return sendError(res, err);
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DELETE                                                               */
/* ────────────────────────────────────────────────────────────────────── */
exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;

    const del = await Type.findByIdAndDelete(id);
    if (!del) return sendError(res, "Type not found", 404);

    await cacheDel(["types:all", `type:${id}`]);
    logger.info(`🗑️  Type ${id} deleted`);
    
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })

    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "Type Delete ALERT",
      ` Type has been Deleted`,
      "",
      "",
      "Type",
      {
        type_id: del._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
    return sendSuccess(res, null, "Type deleted successfully");
  } catch (err) {
    logger.error(`❌ deleteType: ${err.message}`);
    return sendError(res, err);
  }
};
