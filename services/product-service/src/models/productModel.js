const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  sku_code: {
    type: String,
    // required: true,
    // unique: true,
    // required: true,
    unique: true,
    trim: true,
    uppercase: true,
  }, //exact format to be provided // edited By admin
  manufacturer_part_name: {
    type: String,
    required: true,
  },
  no_of_stock: {
    type: Number,
    default: 0,
  },
  product_name: {
    type: String,
    required: true,
  }, // edited by admin
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",

    required: true,
  },
  hsn_code: {
    type: String,
    // required: true,
  },
  out_of_stock: {
    type: Boolean,
    default: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  sub_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",

    required: true,
  },
  product_type: {
    type: String,
    required: true,
    enum: ["OE", "OEM", "AFTERMARKET"],
  },
  is_universal: {
    type: Boolean,
    default: false,
  },
  is_consumable: {
    type: Boolean,
    default: false,
  },
  make: [
    {
      type: String,
    },
  ],
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Model",
  },
  year_range: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Year",
    },
  ],
  variant: [
    {
      // type: "String",
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
    },
  ],
  fitment_notes: {
    type: String,
  },
  fulfillment_priority: {
    type: Number,
  },
  product_Version: {
    type: String,
    default: "1.0",
  },
  admin_notes: {
    type: String,
  },
  key_specifications: {
    type: String,
  },
  dimensions: {
    L: {
      type: Number,
    },
    W: {
      type: Number,
    },
    H: {
      type: Number,
      // required: true,
    },
  }, // edited by dealer
  weight: {
    type: Number,
    // required: true,
  }, // edited by dealer
  certifications: {
    type: String,
    // required: true,
  }, // edited by dealer
  warranty: {
    type: Number,
  }, // edited by dealer
  images: [
    {
      type: String,
      required: true,
    },
  ], // edited by dealer
  video_url: {
    type: String,
    // required: true,
  }, // edited by dealer
  brochure_available: {
    type: Boolean,
    default: false,
  }, //edited by dealer
  seo_title: {
    type: String,
    required: true,
  }, //edited by admin
  seo_description: {
    type: String,
    required: true,
  }, //edited by admin
  seo_metaData: {
    type: String,
  },
  search_tags: [
    {
      type: String,
      required: true,
    },
  ], //edited by admin
  mrp_with_gst: {
    type: Number,
    required: true,
  }, // editable by dealer
  selling_price: {
    type: Number,
    required: true,
  },
  gst_percentage: {
    type: Number,
    required: true,
  }, //editable by dealer
  is_returnable: {
    type: Boolean,
    default: false,
  }, // edited by admin
  return_policy: {
    type: String,
    required: true,
  }, // edited by admin
  available_dealers: [
    {
      dealers_Ref: {
        type: String,
        //   required: true,
      },
      inStock: {
        type: Boolean,
        default: true,
      },
      quantity_per_dealer: {
        type: Number,
        // required: true,
      },
      dealer_margin: {
        type: Number,
        // required: true,
      }, // edited by admin
      dealer_priority_override: {
        type: Number,
        // required: true
      },
    },
  ],
  last_stock_inquired: {
    type: Date,
    default: Date.now,
  },
  stock_expiry_rule: {
    type: Number,
  },
  live_status: {
    type: String,
    enum: ["Created", "Pending", "Rejected", "Live", "Approved"],
    default: "Pending",
  }, //edited by admin
  created_at: {
    type: Date,
    default: Date.now,
  },
  Qc_status: {
    type: String,
    enum: ["Pending", "Rejected", "Approved"],
    default: "Pending",
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: String,
    required: true,
  },
  iteration_number: {
    type: Number,
    default: 1,
  },

  rejection_state: [
    {
      rejected_by: {
        type: String,
        required: true,
      },
      rejected_at: {
        type: Date,
        default: Date.now,
      },
      reason: {
        type: String,
        required: true,
      },
    },
  ],

  change_logs: [
    {
      iteration_number: {
        type: Number,
        default: 1,
      },
      old_value: {
        type: String,
        // required: true,
      },
      new_value: {
        type: String,
        // required: true,
      },
      modified_At: {
        type: Date,
        default: Date.now,
      },
      modified_by: {
        type: String,
        required: true,
      },
      changes: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
