const PurchaseOrder = require("../models/purchaseOrder");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const mongoose = require("mongoose");

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { description, user_id } = req.body;

    if (!description || !user_id || !req.files?.length) {
      logger.error("Description, user_id and files are required");
      return sendError(res, "Description, user_id and files are required", 400);
    }

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "purchase-orders"
        );
        return result.Location;
      })
    );

    const purchaseOrder = new PurchaseOrder({
      req_files: uploadedFiles,
      description,
      user_id,
      status: "Pending",
    });

    await purchaseOrder.save();
    logger.info("Purchase order created successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order created successfully"
    );
  } catch (error) {
    logger.error("Error creating purchase order:", error);
    return sendError(res, "Error creating purchase order", 500);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    const updateData = {
      description: description || purchaseOrder.description,
    };

    if (req.files?.length) {
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            "purchase-orders"
          );
          return result.Location;
        })
      );

      updateData.req_files = [...purchaseOrder.req_files, ...uploadedFiles];
    }

    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    logger.info("Purchase order updated successfully");
    return sendSuccess(
      res,
      updatedOrder,
      "Purchase order updated successfully"
    );
  } catch (error) {
    logger.error("Error updating purchase order:", error);
    return sendError(res, "Error updating purchase order", 500);
  }
};

exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(id);
    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }


    logger.info("Purchase order deleted successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order deleted successfully"
    );
  } catch (error) {
    logger.error("Error deleting purchase order:", error);
    return sendError(res, "Error deleting purchase order", 500);
  }
};

exports.getAllPurchaseOrders = async (req, res, next) => {
  try {
    const purchaseOrders = await PurchaseOrder.find().sort({ createdAt: -1 });
    logger.info("All purchase orders fetched successfully");
    return sendSuccess(
      res,
      purchaseOrders,
      "All purchase orders fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching all purchase orders:", error);
    return sendError(res, "Error fetching all purchase orders", 500);
  }
};

exports.getFilteredPurchaseOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, user_id } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const purchaseOrders = await PurchaseOrder.find(filter).sort({
      createdAt: -1,
    });

    logger.info("Filtered purchase orders fetched successfully");
    return sendSuccess(
      res,
      purchaseOrders,
      "Filtered purchase orders fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching filtered purchase orders:", error);
    return sendError(res, "Error fetching filtered purchase orders", 500);
  }
};

exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findById(id);

    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    logger.info("Purchase order fetched successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching purchase order:", error);
    return sendError(res, "Error fetching purchase order", 500);
  }
};

exports.getPurchaseOrdersByUserId = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { status } = req.query;
    let filter = {
      user_id: user_id,
    };

    if (status) {
      filter.status = status;
    }

    const purchaseOrders = await PurchaseOrder.find(filter).sort({
      createdAt: -1,
    });

    logger.info("Purchase orders fetched successfully");
    return sendSuccess(
      res,
      purchaseOrders,
      "Purchase orders fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching purchase orders by user ID:", error);
    return sendError(res, "Error fetching purchase orders by user ID", 500);
  }
};

exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      logger.error("Invalid status");
      return sendError(res, "Invalid status", 400);
    }

    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    logger.info("Purchase order status updated successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order status updated successfully"
    );
  } catch (error) {
    logger.error("Error updating purchase order status:", error);
    return sendError(res, "Error updating purchase order status", 500);
  }
};
