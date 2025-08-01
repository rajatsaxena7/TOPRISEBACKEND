const ReturnRequest = require("../models/returnRequest");

const { sendSuccess, sendError } = require("packages/utils/responseHandler");
const Redis = require("packages/utils/redis");
const axios = require("axios");
const Order = require("../models/order");
const { cacheGet, cacheSet, cacheDel } = require("packages/utils/redis");

exports.createReturnRequest = async (req, res) => {};

exports.validateReturnRequest = async (req, res) => {};

exports.processReturnRequest = async (req, res) => {};

exports.getReturnRequest = async (req, res) => {};

exports.getReturnRequests = async (req, res) => {};

exports.getReturnRequestStats = async (req, res) => {};
