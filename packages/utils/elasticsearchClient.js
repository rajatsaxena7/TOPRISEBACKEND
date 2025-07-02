const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://elasticsearch:9200",
  // ✅ Enforce compatibility with v8.x server
});

module.exports = esClient;
