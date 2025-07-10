/* ------------------------------------------------------------------ */
/*  Product-level audit / job logs                                    */
/* ------------------------------------------------------------------ */
const ProductLog = require("../models/productLogs"); // <-- your schema
const diff = require("just-diff");

/* utility – build `changed_value` array from before/after ----------- */
const buildChanges = (before = {}, after = {}) =>
  diff(before, after).map((d) => ({
    field: d.path.join("."),
    old_value: JSON.stringify(d.lhs),
    new_value: JSON.stringify(d.rhs),
  }));

/* ------------------------------------------------------------------ */
/*  PROGRAMMATIC WRITER                                               */
/*    await writeProductLog({...}) anywhere in code                   */
/* ------------------------------------------------------------------ */
exports.writeProductLog = async (payload) => {
  try {
    await ProductLog.create(payload);
  } catch (e) {
    // never kill the main request if logging fails
    console.error('[ProductLog] write failed:', e.message);
  }
};

/* ------------------------------------------------------------------ */
/*  GET  /api/product-logs                                            */
/*    query params: ?type=Bulk-Upload,Update&user=abc&page=1&limit=50 */
/* ------------------------------------------------------------------ */
exports.getProductLogs = async (req, res) => {
  try {
    const { type, user, product, from, to, page = 1, limit = 50 } = req.query;

    const q = {};
    if (type) q.job_type = { $in: type.split(",") };
    if (user) q.user = user;
    if (product) q.product_ref = product;
    if (from || to)
      q.created_at = Object.assign(
        {},
        from ? { $gte: new Date(from) } : {},
        to ? { $lte: new Date(to) } : {}
      );

    const pg = Math.max(1, parseInt(page, 10));
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const [rows, total] = await Promise.all([
      ProductLog.find(q)
        .sort({ created_at: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean(),
      ProductLog.countDocuments(q),
    ]);

    res.json({ total, page: pg, pageSize: lim, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
