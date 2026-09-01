"use strict";

const { Router } = require("express");
const router = Router();

const { getAnalytics } = require("../controllers/analytics.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/rbac.middleware");
const { supabase } = require("../../database/supabase");

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get analytics data for admin dashboard
 * @access  Admin+
 */
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  getAnalytics
);

/**
 * @route   GET /api/v1/admin/analytics/debug-products
 * @desc    Returns raw buying_price + stock_quantity for every product so we
 *          can verify what values the database actually holds.
 * @access  Admin+
 */
router.get(
  "/debug-products",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, category_id, buying_price, stock_quantity");

      if (error) throw error;

      const { data: categories, error: catErr } = await supabase
        .from("categories")
        .select("id, name");

      if (catErr) throw catErr;

      const catMap = {};
      for (const c of categories || []) catMap[c.id] = c.name;

      const rows = (products || []).map((p) => ({
        id:             p.id,
        name:           p.name,
        category:       catMap[p.category_id] || p.category_id,
        buying_price:   p.buying_price,
        stock_quantity: p.stock_quantity,
        investment:     (Number(p.buying_price) || 0) * (Number(p.stock_quantity) || 0),
      }));

      return res.status(200).json({
        success: true,
        total_products: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("[DEBUG PRODUCTS]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;