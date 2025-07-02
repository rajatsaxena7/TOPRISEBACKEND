const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema({
  subcategory_name: {
    type: String,
    required: true,
  },
  subcategory_code: {
    type: String,
    required: true,
    unique: true,
  },
  subcategory_status: {
    type: String,
    enum: ["Active", "Inactive", "Pending", "Created", "Rejected"],
    default: "Created",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  subcategory_image: {
    type: String,
    default: "https://example.com/default-subcategory-image.png", // Placeholder URL, replace with actual default image URL
  },
  subcategory_description: {
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
  category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
});

module.exports = mongoose.model("SubCategory", SubcategorySchema);
