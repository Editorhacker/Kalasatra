"use strict";

const { supabase } = require("../../database/supabase");

const handleError = (res, err, context = "") => {
  console.error(`[ANALYTICS CONTROLLER] ${context}:`, err);
  return res.status(500).json({
    success: false,
    message: err.message || "An internal error occurred.",
  });
};

/**
 * GET /api/v1/admin/analytics
 *
 * Two independent data sources are combined:
 *
 * SOURCE A â€” Confirmed orders  (order_confirmed table)
 *   categoryTotals[cat].selling  = Sigma (item.price x item.quantity) per category
 *   categoryTotals[cat].count    = total units sold per category
 *   totalRevenue                 = Sigma order.payment_amount
 *   monthlyIncome / yearlyIncome / lastMonthIncome
 *
 * SOURCE B â€” Current inventory  (products table joined to categories)
 *   categoryTotals[cat].buying   = Sigma (buying_price x stock_quantity) per category
 *   totalInvested                = Sigma (buying_price x stock_quantity) across ALL products
 *
 * Investment always reflects real stock on hand: adding a product or editing
 * its stock/buying price is immediately reflected here.
 *
 * NOTE: We query the products table directly (not the view) to bypass any
 * RLS rules that could silently filter rows, and we join categories separately
 * using a category lookup. This guarantees ALL products are counted regardless
 * of their is_active status.
 */
const getAnalytics = async (req, res) => {
  try {
    // â”€â”€ SOURCE A: Confirmed orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: orders, error: ordersError } = await supabase
      .from("order_confirmed")
      .select("id, payment_amount, items, created_at");

    if (ordersError) throw ordersError;

    // â”€â”€ SOURCE B: All products with their category names â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Query products table directly â€” include inactive products so investment
    // reflects the FULL stock value, not just the public-facing items.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, buying_price, stock_quantity, category_id");

    if (productsError) throw productsError;

    // Fetch all categories so we can map category_id -> category_name
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name");

    if (categoriesError) throw categoriesError;

    // Build category lookup: id -> name
    const categoryNameMap = {};
    for (const c of categories || []) {
      categoryNameMap[c.id] = c.name;
    }

    // â”€â”€ Step 1: Build per-category INVESTMENT from inventory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Formula: buying_price x stock_quantity  (total capital tied up in stock)
    const categoryInvestment = {};
    let totalInvested = 0;

    // Also build product -> category_name lookup for order item resolution
    const productCategoryMap = {};

    for (const p of products || []) {
      const cat    = categoryNameMap[p.category_id] || "Uncategorized";
      const buying = Number(p.buying_price)  || 0;
      const stock  = Number(p.stock_quantity) || 0;
      const investment = buying * stock;

      // Per-product log — visible in backend terminal
      console.log(`[ANALYTICS] Product: buying=${buying}, stock=${stock}, investment=${investment}, cat=${cat}, raw_stock=${p.stock_quantity}, raw_buying=${p.buying_price}`);

      // Investment accumulation
      if (!categoryInvestment[cat]) categoryInvestment[cat] = 0;
      categoryInvestment[cat] += investment;
      totalInvested += investment;

      // For resolving order item categories later
      productCategoryMap[p.id] = cat;
    }

    // â”€â”€ Step 2: Aggregate per-category REVENUE from confirmed orders â”€â”€â”€â”€â”€â”€â”€
    const categoryRevenue = {};
    let totalRevenue = 0;

    const now = new Date();
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth();   // 0-indexed

    let monthlyRevenue   = 0;
    let yearlyRevenue    = 0;
    let lastMonthRevenue = 0;

    const lastMonthYear  = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;

    for (const order of orders || []) {
      const paymentAmount = Number(order.payment_amount) || 0;
      const orderDate  = new Date(order.created_at);
      const orderYear  = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      totalRevenue += paymentAmount;

      if (orderYear === currentYear) {
        yearlyRevenue += paymentAmount;
        if (orderMonth === currentMonth) monthlyRevenue += paymentAmount;
      }
      if (orderYear === lastMonthYear && orderMonth === lastMonthIndex) {
        lastMonthRevenue += paymentAmount;
      }

      // Parse items JSONB
      let items = order.items;
      if (typeof items === "string") {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) items = [];

      for (const item of items) {
        const qty              = Number(item.quantity) || 1;
        const sellingLineTotal = (Number(item.price) || 0) * qty;
        const cat              = productCategoryMap[item.product_id] ?? "Uncategorized";

        if (!categoryRevenue[cat]) categoryRevenue[cat] = { count: 0, selling: 0 };
        categoryRevenue[cat].count   += qty;
        categoryRevenue[cat].selling += sellingLineTotal;
      }
    }

    // â”€â”€ Step 3: Merge into categoryTotals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Include every category that has inventory (investment) OR order revenue.
    const allCategories = new Set([
      ...Object.keys(categoryInvestment),
      ...Object.keys(categoryRevenue),
    ]);

    const categoryTotals = {};
    for (const cat of allCategories) {
      const rev = categoryRevenue[cat]    || { count: 0, selling: 0 };
      const inv = categoryInvestment[cat] || 0;

      categoryTotals[cat] = {
        count:   rev.count,
        selling: parseFloat(rev.selling.toFixed(2)),
        buying:  parseFloat(inv.toFixed(2)),   // buying_price x stock_quantity
      };
    }

    // â”€â”€ Step 4: Top-level aggregates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const ratio =
      totalInvested > 0
        ? parseFloat((totalRevenue / totalInvested).toFixed(2))
        : 0;

    const currentMonthLabel = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const lastMonthDate  = new Date(lastMonthYear, lastMonthIndex, 1);
    const lastMonthLabel = lastMonthDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // Debug log so you can verify the numbers server-side
    console.log("[ANALYTICS] products fetched:", products?.length ?? 0);
    console.log("[ANALYTICS] categoryInvestment:", JSON.stringify(categoryInvestment));
    console.log("[ANALYTICS] totalInvested:", totalInvested);

    return res.status(200).json({
      success: true,
      data: {
        categoryTotals,
        totalRevenue:    parseFloat(totalRevenue.toFixed(2)),
        totalInvested:   parseFloat(totalInvested.toFixed(2)),
        profitMargin:    parseFloat((totalRevenue - totalInvested).toFixed(2)),
        ratio,
        productCount: products?.length || 0,
        monthlyIncome:   { label: currentMonthLabel,   value: parseFloat(monthlyRevenue.toFixed(2)) },
        yearlyIncome:    { label: String(currentYear), value: parseFloat(yearlyRevenue.toFixed(2)) },
        lastMonthIncome: { label: lastMonthLabel,       value: parseFloat(lastMonthRevenue.toFixed(2)) },
        onlineVsCod: { online: 0, cod: 0 },
      },
    });
  } catch (err) {
    return handleError(res, err, "getAnalytics");
  }
};

module.exports = { getAnalytics };