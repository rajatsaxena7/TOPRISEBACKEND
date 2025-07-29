// Unit tests for: createDealersBulk

const { createDealersBulk } = require("../user");
const User = require("../../models/user");
const Dealer = require("../../models/dealer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
  sendEmailNotifiation,
} = require("../../../../../packages/utils/notificationService");
const {
  welcomeEmail,
} = require("../../../../../packages/utils/email_templates/email_templates");

jest.mock("../../models/user");
jest.mock("../../models/dealer");
jest.mock("bcrypt");
jest.mock("uuid", () => ({ v4: jest.fn() }));
jest.mock("csv-parser");
// jest.mock("streamifier");

describe("createDealersBulk() createDealersBulk method", () => {
  let req, res, mockBuffer, mockStream;

  beforeEach(() => {
    req = {
      file: {
        buffer: Buffer.from(
          "email,username,password,phone_Number,legal_name,trade_name,GSTIN,Pan,street,city,pincode,state,contact_name,contact_email,contact_phone\n"
        ),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockBuffer = req.file.buffer.toString("utf8");
    mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn((event, callback) => {
        if (event === "data") {
          callback({
            email: "test@example.com",
            username: "testuser",
            password: "password123",
            phone_Number: "1234567890",
            legal_name: "Test Legal Name",
            trade_name: "Test Trade Name",
            GSTIN: "123456789012345",
            Pan: "ABCDE1234F",
            street: "123 Test St",
            city: "Test City",
            pincode: "123456",
            state: "Test State",
            contact_name: "Test Contact",
            contact_email: "contact@example.com",
            contact_phone: "0987654321",
          });
        } else if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };
    streamifier.createReadStream.mockReturnValue(mockStream);
    bcrypt.hash.mockResolvedValue("hashedPassword");
    uuidv4.mockReturnValue("uuid");
  });

  describe("Happy paths", () => {
    it("should create dealers successfully from CSV data", async () => {
      // Mock User and Dealer save methods
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue(true);
      Dealer.prototype.save = jest.fn().mockResolvedValue(true);

      await createDealersBulk(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(Dealer.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "1 dealers created successfully",
        dealers: expect.any(Array),
      });
    });
  });

  describe("Edge cases", () => {
    it("should skip creating a dealer if the user already exists", async () => {
      // Mock User to simulate existing user
      User.findOne.mockResolvedValue({ email: "test@example.com" });

      await createDealersBulk(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(User.prototype.save).not.toHaveBeenCalled();
      expect(Dealer.prototype.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "0 dealers created successfully",
        dealers: [],
      });
    });

    it("should handle CSV parsing errors gracefully", async () => {
      // Simulate CSV parsing error
      mockStream.on = jest.fn((event, callback) => {
        if (event === "error") {
          callback(new Error("CSV parsing error"));
        }
        return mockStream;
      });

      await createDealersBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: "CSV parsing error",
      });
    });

    it("should handle bcrypt hashing errors gracefully", async () => {
      // Simulate bcrypt hashing error
      bcrypt.hash.mockRejectedValue(new Error("Hashing error"));

      await createDealersBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: "Hashing error",
      });
    });
  });
});

// End of unit tests for: createDealersBulk
