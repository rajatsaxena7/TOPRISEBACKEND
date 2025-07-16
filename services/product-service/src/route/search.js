// routes/search.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/search", async (req, res) => {
  const { keyword } = req.query;

  try {
    const { data } = await axios.post(
      "http://127.0.0.1:9200/products/_search",
      {
        query: {
          multi_match: {
            query: keyword,
            fields: [
              "sku_code^3",
              "product_name^5",
              "manufacturer_part_name^2",
              "search_tags^3",
              "brand^5",
              "model^4",
              "variant^2",
            ],
            fuzziness: "AUTO",
          },
        },
      }
    );

    const results = data.hits.hits.map((hit) => hit._source);
    res.json(results);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
