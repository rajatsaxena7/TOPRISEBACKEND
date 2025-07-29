// Unit tests for: createDealersBulk

const { createDealersBulk } = require("../user");
const User = require("../../models/user");
const Dealer = require("../../models/dealer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const csv = require("csv-parser");
const streamifier = require("streamifier");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
  sendEmailNotifiation,
} = require("../../../../../packages/utils/notificationService");
const {
  welcomeEmail,
} = require("../../../../../packages/utils/email_templates/email_templates");

// Mock dependencies
jest.mock("../../models/user");
jest.mock("../../models/dealer");
jest.mock("bcrypt");
jest.mock("streamifier");
jest.mock("csv-parser");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

describe("createDealersBulk() createDealersBulk method", () => {
  let req, res;

  beforeEach(() => {
    req = {
      file: {
        buffer: Buffer.from(
          "email,username,password,phone_Number\nexample@example.com,exampleUser,examplePass,1234567890"
        ),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks
    User.findOne.mockReset();
    User.create.mockReset();
    Dealer.create.mockReset();
    bcrypt.hash.mockReset();
    streamifier.createReadStream.mockReset();
    csv.mockReset();
  });

  describe("Happy paths", () => {
    it("should create dealers successfully from CSV data", async () => {
      // Mock implementations
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.create.mockResolvedValue({ _id: "userId" });
      Dealer.create.mockResolvedValue({ _id: "dealerId" });

      // Mock CSV parsing
      streamifier.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn((event, callback) => {
          if (event === "data") {
            callback({
              email: "example@example.com",
              username: "exampleUser",
              password: "examplePass",
              phone_Number: "1234567890",
            });
          }
          if (event === "end") {
            callback();
          }
          return this;
        }),
      });

      await createDealersBulk(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "example@example.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("examplePass", 10);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "example@example.com",
          username: "exampleUser",
          password: "hashedPassword",
          phone_Number: "1234567890",
          role: "Dealer",
        })
      );
      expect(Dealer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "userId",
          dealerId: expect.any(String),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "1 dealers created successfully",
          failed: 0,
          dealers: expect.any(Array),
        })
      );
    });
  });

  describe("Edge cases", () => {
    it("should skip creating a dealer if the user already exists", async () => {
      // Mock implementations
      User.findOne.mockResolvedValue({ _id: "existingUserId" });

      // Mock CSV parsing
      streamifier.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn((event, callback) => {
          if (event === "data") {
            callback({
              email: "example@example.com",
              username: "exampleUser",
              password: "examplePass",
              phone_Number: "1234567890",
            });
          }
          if (event === "end") {
            callback();
          }
          return this;
        }),
      });

      await createDealersBulk(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "example@example.com",
      });
      expect(User.create).not.toHaveBeenCalled();
      expect(Dealer.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "0 dealers created successfully",
          failed: 0,
          dealers: [],
        })
      );
    });

    it("should handle errors during dealer creation", async () => {
      // Mock implementations
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.create.mockResolvedValue({ _id: "userId" });
      Dealer.create.mockRejectedValue(new Error("Dealer creation error"));

      // Mock CSV parsing
      streamifier.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn((event, callback) => {
          if (event === "data") {
            callback({
              email: "example@example.com",
              username: "exampleUser",
              password: "examplePass",
              phone_Number: "1234567890",
            });
          }
          if (event === "end") {
            callback();
          }
          return this;
        }),
      });

      await createDealersBulk(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "example@example.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("examplePass", 10);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "example@example.com",
          username: "exampleUser",
          password: "hashedPassword",
          phone_Number: "1234567890",
          role: "Dealer",
        })
      );
      expect(Dealer.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "0 dealers created successfully",
          failed: 1,
          failedRows: expect.any(Array),
        })
      );
    });
  });
});

// End of unit tests for: createDealersBulk
