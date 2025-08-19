const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get categories with subcategories (populated from data file)
router.get('/with-subcategories', async (req, res) => {
  try {
    const categories = require('../data/categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subcategories for a specific category
router.get('/:categorySlug/subcategories', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.categorySlug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ subcategories: category.subcategories || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trending categories
router.get('/trending', async (req, res) => {
  try {
    const categories = await Category.find({ trending: true })
      .sort({ reviewCount: -1 })
      .limit(8);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;