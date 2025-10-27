const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  main_category: {
    type: Boolean,
    default: false,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Type",
    required: true,
  },
  category_code: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  category_image: {
    type: String,
    default: "https://example.com/default-category-image.png", // Placeholder URL, replace with actual default image URL
  },
  category_Status: {
    type: String,
    enum: ["Active", "Inactive", "Pending", "Created", "Rejected"],
    default: "Active",
  },
  category_description: {
    type: String,
    default: "",
  },
  created_by: {
    type: String,
    required: true,
  },
  updated_by: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Category", CategorySchema);
