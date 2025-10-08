const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const router = express.Router();

// Get all categories with subcategories
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during categories fetch');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again.',
        categories: [] 
      });
    }

    const categories = await Category.find()
      .select('name slug description subcategories reviewCount trending')
      .sort({ name: 1 })
      .lean()
      .exec();
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Categories fetched in ${totalTime}ms (${categories.length} categories)`);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    console.error('Error stack:', error.stack);
    res.status(200).json([]); // Return empty array instead of error
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
      .select('name slug description reviewCount trending')
      .sort({ reviewCount: -1 })
      .limit(8)
      .lean(); // Use lean() for better performance
    res.json(categories);
  } catch (error) {
    console.error('Error fetching trending categories:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;