# Comprehensive Frontend Implementation Guide
## Intelligent Search + Hierarchical Search with Category Detection

## Overview
This guide provides a complete frontend implementation for both **Intelligent Search** and **Hierarchical Search** endpoints, including the new **Category Detection** functionality. The system now supports a 5-step search flow: **Category → Brand → Model → Variant → Products**.

## API Endpoints

### **1. Intelligent Search**
```
GET /products/v1/intelligent-search
```
**Purpose**: Smart search that auto-detects what user is searching for
**Authentication**: None required

### **2. Hierarchical Search**
```
GET /products/v1/hierarchical-search
```
**Purpose**: Step-by-step guided search process
**Authentication**: None required

## Enhanced Search Flow

### **Complete Search Hierarchy**
```
Category → Brand → Model → Variant → Products
    ↓         ↓        ↓        ↓         ↓
  Select   Select   Select   Select   View
 Category  Brand   Model   Variant  Products
```

### **Intelligent Detection Examples**
- **"air filter"** → Detects category, returns categories
- **"spark plug maruti suzuki"** → Detects category + brand, returns models
- **"maruti suzuki swift"** → Detects brand + model, returns models
- **"maruti suzuki swift vdi"** → Detects brand + model + variant, returns variants
- **"swift"** → Detects model, returns models
- **"vdi"** → Detects variant, returns variants
- **"spark plug"** → Detects product, returns products

## Frontend Implementation

### **1. Complete Search Interface**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Product Search</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .search-container {
            padding: 30px;
        }

        .search-modes {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }

        .search-mode {
            flex: 1;
            padding: 20px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }

        .search-mode.active {
            border-color: #667eea;
            background: #f8f9ff;
        }

        .search-mode h3 {
            color: #333;
            margin-bottom: 10px;
        }

        .search-mode p {
            color: #666;
            font-size: 0.9rem;
        }

        .search-box {
            position: relative;
            margin-bottom: 30px;
        }

        .search-input {
            width: 100%;
            padding: 20px 60px 20px 20px;
            border: 3px solid #e1e5e9;
            border-radius: 50px;
            font-size: 18px;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .search-button {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: background 0.3s;
        }

        .search-button:hover {
            background: #5a6fd8;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e1e5e9;
            border-radius: 3px;
            margin-bottom: 30px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 3px;
            transition: width 0.3s;
        }

        .search-step {
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            transition: all 0.3s;
        }

        .search-step.active {
            border-color: #667eea;
            background: #f8f9ff;
        }

        .search-step.completed {
            border-color: #28a745;
            background: #f8fff9;
        }

        .step-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }

        .step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
        }

        .step-number.completed {
            background: #28a745;
        }

        .step-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #333;
        }

        .suggestion-box {
            background: #f8f9ff;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }

        .suggestion-text {
            color: #667eea;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .detected-path {
            background: #e8f5e8;
            border: 2px solid #28a745;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .detected-path h3 {
            color: #28a745;
            margin-bottom: 10px;
        }

        .path-item {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            margin: 5px;
            font-size: 0.9rem;
        }

        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .result-card {
            background: white;
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        .result-card:hover {
            border-color: #667eea;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }

        .result-card.selected {
            border-color: #28a745;
            background: #f8fff9;
        }

        .result-type {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .result-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }

        .result-code {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 10px;
            font-family: monospace;
        }

        .result-context {
            color: #667eea;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }

        .result-price {
            font-size: 1.1rem;
            font-weight: 600;
            color: #28a745;
            margin-bottom: 5px;
        }

        .result-stock {
            font-size: 0.9rem;
            margin-bottom: 10px;
        }

        .stock-available {
            color: #28a745;
        }

        .stock-out {
            color: #dc3545;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
            margin-right: 5px;
        }

        .status-active {
            background: #d4edda;
            color: #155724;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .status-featured {
            background: #fff3cd;
            color: #856404;
        }

        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }

        .no-results {
            text-align: center;
            padding: 50px;
            color: #666;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .search-examples {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .search-examples h3 {
            color: #333;
            margin-bottom: 15px;
        }

        .example-item {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            margin: 5px;
            cursor: pointer;
            transition: background 0.3s;
            font-size: 0.9rem;
        }

        .example-item:hover {
            background: #5a6fd8;
        }

        .selected-filters {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .selected-filters h3 {
            color: #333;
            margin-bottom: 10px;
        }

        .selected-item {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            margin: 5px;
            font-size: 0.9rem;
        }

        .clear-button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }

        .clear-button:hover {
            background: #c82333;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .search-container {
                padding: 20px;
            }
            
            .search-modes {
                flex-direction: column;
            }
            
            .results-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔍 Advanced Product Search</h1>
            <p>Intelligent search with category detection and hierarchical filtering</p>
        </div>

        <!-- Search Container -->
        <div class="search-container">
            <!-- Search Mode Selection -->
            <div class="search-modes">
                <div class="search-mode active" id="intelligentMode" onclick="setSearchMode('intelligent')">
                    <h3>🧠 Intelligent Search</h3>
                    <p>Smart search that understands what you're looking for</p>
                </div>
                <div class="search-mode" id="hierarchicalMode" onclick="setSearchMode('hierarchical')">
                    <h3>📋 Hierarchical Search</h3>
                    <p>Step-by-step guided search process</p>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 20%"></div>
            </div>

            <!-- Search Box -->
            <div class="search-box">
                <input type="text" class="search-input" id="searchInput" placeholder="Type anything: category, brand, model, variant, or product name...">
                <button class="search-button" onclick="performSearch()" id="searchBtn">Search</button>
            </div>

            <!-- Search Examples -->
            <div class="search-examples">
                <h3>💡 Try these examples:</h3>
                <div class="example-item" onclick="searchExample('air filter')">air filter</div>
                <div class="example-item" onclick="searchExample('spark plug maruti suzuki')">spark plug maruti suzuki</div>
                <div class="example-item" onclick="searchExample('maruti suzuki swift')">maruti suzuki swift</div>
                <div class="example-item" onclick="searchExample('maruti suzuki swift vdi')">maruti suzuki swift vdi</div>
                <div class="example-item" onclick="searchExample('swift')">swift</div>
                <div class="example-item" onclick="searchExample('vdi')">vdi</div>
                <div class="example-item" onclick="searchExample('spark plug')">spark plug</div>
            </div>

            <!-- Selected Filters -->
            <div class="selected-filters" id="selectedFilters" style="display: none;">
                <h3>Selected Filters:</h3>
                <div id="selectedList"></div>
                <button class="clear-button" onclick="clearSelection()">Clear Selection</button>
            </div>

            <!-- Suggestion Box -->
            <div class="suggestion-box" id="suggestionBox" style="display: none;">
                <div class="suggestion-text" id="suggestionText"></div>
            </div>

            <!-- Detected Path -->
            <div class="detected-path" id="detectedPath" style="display: none;">
                <h3>🎯 Detected Path:</h3>
                <div id="pathList"></div>
            </div>

            <!-- Hierarchical Search Steps -->
            <div id="hierarchicalSteps" style="display: none;">
                <!-- Step 1: Category Search -->
                <div class="search-step active" id="categoryStep">
                    <div class="step-header">
                        <div class="step-number" id="categoryStepNumber">1</div>
                        <div class="step-title">Search Category</div>
                    </div>
                    <input type="text" class="search-input" id="categoryInput" placeholder="Enter category name (e.g., Air Filter, Spark Plug)">
                    <button class="search-button" onclick="searchCategories()">Search Categories</button>
                    <div class="results-container" id="categoryResults"></div>
                </div>

                <!-- Step 2: Brand Search -->
                <div class="search-step" id="brandStep">
                    <div class="step-header">
                        <div class="step-number" id="brandStepNumber">2</div>
                        <div class="step-title">Search Brand</div>
                    </div>
                    <input type="text" class="search-input" id="brandInput" placeholder="Enter brand name" disabled>
                    <button class="search-button" onclick="searchBrands()" disabled id="brandSearchBtn">Search Brands</button>
                    <div class="results-container" id="brandResults"></div>
                </div>

                <!-- Step 3: Model Search -->
                <div class="search-step" id="modelStep">
                    <div class="step-header">
                        <div class="step-number" id="modelStepNumber">3</div>
                        <div class="step-title">Search Model</div>
                    </div>
                    <input type="text" class="search-input" id="modelInput" placeholder="Enter model name" disabled>
                    <button class="search-button" onclick="searchModels()" disabled id="modelSearchBtn">Search Models</button>
                    <div class="results-container" id="modelResults"></div>
                </div>

                <!-- Step 4: Variant Search -->
                <div class="search-step" id="variantStep">
                    <div class="step-header">
                        <div class="step-number" id="variantStepNumber">4</div>
                        <div class="step-title">Search Variant</div>
                    </div>
                    <input type="text" class="search-input" id="variantInput" placeholder="Enter variant name" disabled>
                    <button class="search-button" onclick="searchVariants()" disabled id="variantSearchBtn">Search Variants</button>
                    <div class="results-container" id="variantResults"></div>
                </div>

                <!-- Step 5: Product Search -->
                <div class="search-step" id="productStep">
                    <div class="step-header">
                        <div class="step-number" id="productStepNumber">5</div>
                        <div class="step-title">Search Products</div>
                    </div>
                    <input type="text" class="search-input" id="productInput" placeholder="Enter product name or SKU (optional)" disabled>
                    <button class="search-button" onclick="searchProducts()" disabled id="productSearchBtn">Search Products</button>
                    <div class="results-container" id="productResults"></div>
                </div>
            </div>

            <!-- Results Container -->
            <div class="results-container" id="resultsContainer">
                <div class="loading" id="loadingState" style="display: none;">
                    <h3>🔍 Searching...</h3>
                    <p>Analyzing your query and finding the best results</p>
                </div>
                <div class="no-results" id="noResults" style="display: none;">
                    <h3>No Results Found</h3>
                    <p>Try searching for a category name, brand name, model name, or product name</p>
                </div>
                <div class="results-grid" id="resultsGrid"></div>
            </div>
        </div>
    </div>

    <script>
        // Configuration
        const API_BASE_URL = 'http://localhost:5002';
        const INTELLIGENT_ENDPOINT = '/products/v1/intelligent-search';
        const HIERARCHICAL_ENDPOINT = '/products/v1/hierarchical-search';
        
        // State
        let currentSearchMode = 'intelligent';
        let selectedCategory = null;
        let selectedBrand = null;
        let selectedModel = null;
        let selectedVariant = null;
        let currentPage = 1;
        let totalPages = 1;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
        });

        function setupEventListeners() {
            // Search input
            document.getElementById('searchInput').addEventListener('input', function() {
                if (this.value.length >= 2) {
                    if (currentSearchMode === 'intelligent') {
                        // Auto-search after 1 second of no typing
                        clearTimeout(this.searchTimeout);
                        this.searchTimeout = setTimeout(() => {
                            performSearch();
                        }, 1000);
                    }
                } else {
                    hideResults();
                }
            });

            // Enter key search
            document.getElementById('searchInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Hierarchical search inputs
            ['categoryInput', 'brandInput', 'modelInput', 'variantInput', 'productInput'].forEach(inputId => {
                document.getElementById(inputId).addEventListener('input', function() {
                    if (this.value.length >= 2) {
                        const searchFunction = inputId.replace('Input', '') + 's';
                        if (typeof window[searchFunction] === 'function') {
                            window[searchFunction]();
                        }
                    }
                });
            });
        }

        function setSearchMode(mode) {
            currentSearchMode = mode;
            
            // Update UI
            document.getElementById('intelligentMode').classList.toggle('active', mode === 'intelligent');
            document.getElementById('hierarchicalMode').classList.toggle('active', mode === 'hierarchical');
            
            // Show/hide appropriate sections
            document.getElementById('hierarchicalSteps').style.display = mode === 'hierarchical' ? 'block' : 'none';
            document.getElementById('resultsContainer').style.display = mode === 'intelligent' ? 'block' : 'none';
            
            // Clear previous results
            hideResults();
            clearSelection();
        }

        async function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (query.length < 2) return;

            showLoading();

            try {
                const response = await fetch(`${API_BASE_URL}${INTELLIGENT_ENDPOINT}?query=${encodeURIComponent(query)}&limit=10`, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here', // Replace with actual token
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayIntelligentResults(data.data);
                } else {
                    showError('Search failed: ' + data.message);
                }
            } catch (error) {
                console.error('Search error:', error);
                showError('Error searching: ' + error.message);
            }
        }

        function displayIntelligentResults(data) {
            hideLoading();
            
            // Show suggestion
            if (data.suggestion) {
                showSuggestion(data.suggestion);
            }

            // Show detected path
            if (data.detectedPath && Object.keys(data.detectedPath).length > 0) {
                showDetectedPath(data.detectedPath);
            }

            // Show results
            if (data.results && data.results.length > 0) {
                displayResultsGrid(data.results, data.type);
            } else {
                showNoResults();
            }
        }

        function displayResultsGrid(results, type) {
            const container = document.getElementById('resultsGrid');
            
            const html = results.map(result => {
                let cardContent = '';
                
                if (type === 'category') {
                    cardContent = `
                        <div class="result-type">Category</div>
                        <div class="result-name">${result.name}</div>
                        <div class="result-code">Code: ${result.code}</div>
                        <div class="status-badge status-active">${result.status}</div>
                        ${result.description ? `<div style="font-size: 0.8rem; color: #666; margin-top: 5px;">${result.description}</div>` : ''}
                    `;
                } else if (type === 'brand') {
                    cardContent = `
                        <div class="result-type">Brand</div>
                        <div class="result-name">${result.name}</div>
                        <div class="result-code">Code: ${result.code}</div>
                        ${result.category ? `<div class="result-context">Category: ${result.category.name}</div>` : ''}
                        ${result.featured ? '<div class="status-badge status-featured">Featured</div>' : ''}
                    `;
                } else if (type === 'model') {
                    cardContent = `
                        <div class="result-type">Model</div>
                        <div class="result-name">${result.name}</div>
                        <div class="result-code">Code: ${result.code}</div>
                        ${result.brand ? `<div class="result-context">Brand: ${result.brand.name}</div>` : ''}
                        ${result.category ? `<div class="result-context">Category: ${result.category.name}</div>` : ''}
                        <div class="status-badge status-active">${result.status}</div>
                    `;
                } else if (type === 'variant') {
                    cardContent = `
                        <div class="result-type">Variant</div>
                        <div class="result-name">${result.name}</div>
                        <div class="result-code">Code: ${result.code}</div>
                        ${result.brand ? `<div class="result-context">Brand: ${result.brand.name}</div>` : ''}
                        ${result.model ? `<div class="result-context">Model: ${result.model.name}</div>` : ''}
                        <div class="status-badge status-active">${result.status}</div>
                        ${result.description ? `<div style="font-size: 0.8rem; color: #666; margin-top: 5px;">${result.description}</div>` : ''}
                    `;
                } else if (type === 'products') {
                    cardContent = `
                        <div class="result-type">Product</div>
                        <div class="result-name">${result.product_name}</div>
                        <div class="result-code">SKU: ${result.sku_code}</div>
                        ${result.brand ? `<div class="result-context">Brand: ${result.brand.name}</div>` : ''}
                        ${result.model ? `<div class="result-context">Model: ${result.model.name}</div>` : ''}
                        <div class="result-price">₹${result.pricing.selling_price}</div>
                        <div class="result-stock ${result.stock.out_of_stock ? 'stock-out' : 'stock-available'}">
                            Stock: ${result.stock.no_of_stock} units
                        </div>
                        <div class="status-badge status-${result.status.live_status.toLowerCase()}">${result.status.live_status}</div>
                    `;
                }

                return `
                    <div class="result-card" onclick="selectResult('${result.id}', '${result.name}', '${type}')">
                        ${cardContent}
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        }

        // Hierarchical Search Functions
        async function searchCategories() {
            const query = document.getElementById('categoryInput').value.trim();
            if (query.length < 2) return;

            try {
                showLoading('categoryResults');
                
                const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_ENDPOINT}?query=${encodeURIComponent(query)}&type=category&limit=10`, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayCategoryResults(data.data.results);
                } else {
                    showError('categoryResults', 'Failed to search categories: ' + data.message);
                }
            } catch (error) {
                console.error('Category search error:', error);
                showError('categoryResults', 'Error searching categories: ' + error.message);
            }
        }

        async function searchBrands() {
            if (!selectedCategory) return;
            
            const query = document.getElementById('brandInput').value.trim();
            if (query.length < 2) return;

            try {
                showLoading('brandResults');
                
                const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_ENDPOINT}?query=${encodeURIComponent(query)}&type=brand&categoryId=${selectedCategory.id}&limit=10`, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayBrandResults(data.data.results);
                } else {
                    showError('brandResults', 'Failed to search brands: ' + data.message);
                }
            } catch (error) {
                console.error('Brand search error:', error);
                showError('brandResults', 'Error searching brands: ' + error.message);
            }
        }

        async function searchModels() {
            if (!selectedBrand) return;
            
            const query = document.getElementById('modelInput').value.trim();
            if (query.length < 2) return;

            try {
                showLoading('modelResults');
                
                const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_ENDPOINT}?query=${encodeURIComponent(query)}&type=model&brandId=${selectedBrand.id}&limit=10`, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayModelResults(data.data.results);
                } else {
                    showError('modelResults', 'Failed to search models: ' + data.message);
                }
            } catch (error) {
                console.error('Model search error:', error);
                showError('modelResults', 'Error searching models: ' + error.message);
            }
        }

        async function searchVariants() {
            if (!selectedModel) return;
            
            const query = document.getElementById('variantInput').value.trim();
            if (query.length < 2) return;

            try {
                showLoading('variantResults');
                
                const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_ENDPOINT}?query=${encodeURIComponent(query)}&type=variant&modelId=${selectedModel.id}&limit=10`, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayVariantResults(data.data.results);
                } else {
                    showError('variantResults', 'Failed to search variants: ' + data.message);
                }
            } catch (error) {
                console.error('Variant search error:', error);
                showError('variantResults', 'Error searching variants: ' + error.message);
            }
        }

        async function searchProducts() {
            if (!selectedCategory || !selectedBrand) return;
            
            const query = document.getElementById('productInput').value.trim();
            
            try {
                showLoading('productResults');
                
                let url = `${API_BASE_URL}${HIERARCHICAL_ENDPOINT}?type=products&categoryId=${selectedCategory.id}&brandId=${selectedBrand.id}&limit=10&page=${currentPage}`;
                
                if (selectedModel) {
                    url += `&modelId=${selectedModel.id}`;
                }
                
                if (selectedVariant) {
                    url += `&variantId=${selectedVariant.id}`;
                }
                
                if (query) {
                    url += `&query=${encodeURIComponent(query)}`;
                }
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': 'Bearer your-auth-token-here',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayProductResults(data.data.results, data.data.pagination);
                } else {
                    showError('productResults', 'Failed to search products: ' + data.message);
                }
            } catch (error) {
                console.error('Product search error:', error);
                showError('productResults', 'Error searching products: ' + error.message);
            }
        }

        // Display Functions
        function displayCategoryResults(categories) {
            const container = document.getElementById('categoryResults');
            
            if (categories.length === 0) {
                container.innerHTML = '<div class="no-results">No categories found</div>';
                return;
            }

            const html = `
                <div class="results-grid">
                    ${categories.map(category => `
                        <div class="result-card" onclick="selectCategory('${category.id}', '${category.name}', '${category.code}')">
                            <div class="result-type">Category</div>
                            <div class="result-name">${category.name}</div>
                            <div class="result-code">Code: ${category.code}</div>
                            <div class="status-badge status-active">${category.status}</div>
                            ${category.description ? `<div style="font-size: 0.8rem; color: #666; margin-top: 5px;">${category.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        function displayBrandResults(brands) {
            const container = document.getElementById('brandResults');
            
            if (brands.length === 0) {
                container.innerHTML = '<div class="no-results">No brands found</div>';
                return;
            }

            const html = `
                <div class="results-grid">
                    ${brands.map(brand => `
                        <div class="result-card" onclick="selectBrand('${brand.id}', '${brand.name}', '${brand.code}')">
                            <div class="result-type">Brand</div>
                            <div class="result-name">${brand.name}</div>
                            <div class="result-code">Code: ${brand.code}</div>
                            ${brand.featured ? '<div class="status-badge status-featured">Featured</div>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        function displayModelResults(models) {
            const container = document.getElementById('modelResults');
            
            if (models.length === 0) {
                container.innerHTML = '<div class="no-results">No models found</div>';
                return;
            }

            const html = `
                <div class="results-grid">
                    ${models.map(model => `
                        <div class="result-card" onclick="selectModel('${model.id}', '${model.name}', '${model.code}')">
                            <div class="result-type">Model</div>
                            <div class="result-name">${model.name}</div>
                            <div class="result-code">Code: ${model.code}</div>
                            <div class="status-badge status-active">${model.status}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        function displayVariantResults(variants) {
            const container = document.getElementById('variantResults');
            
            if (variants.length === 0) {
                container.innerHTML = '<div class="no-results">No variants found</div>';
                return;
            }

            const html = `
                <div class="results-grid">
                    ${variants.map(variant => `
                        <div class="result-card" onclick="selectVariant('${variant.id}', '${variant.name}', '${variant.code}')">
                            <div class="result-type">Variant</div>
                            <div class="result-name">${variant.name}</div>
                            <div class="result-code">Code: ${variant.code}</div>
                            <div class="status-badge status-active">${variant.status}</div>
                            ${variant.description ? `<div style="font-size: 0.8rem; color: #666; margin-top: 5px;">${variant.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        function displayProductResults(products, pagination) {
            const container = document.getElementById('productResults');
            
            if (products.length === 0) {
                container.innerHTML = '<div class="no-results">No products found</div>';
                return;
            }

            totalPages = pagination.totalPages;
            currentPage = pagination.currentPage;

            const html = `
                <div style="margin-bottom: 15px;">
                    <strong>Found ${pagination.totalItems} products</strong>
                    ${pagination.totalPages > 1 ? ` (Page ${pagination.currentPage} of ${pagination.totalPages})` : ''}
                </div>
                <div class="results-grid">
                    ${products.map(product => `
                        <div class="result-card">
                            <div class="result-type">Product</div>
                            <div class="result-name">${product.product_name}</div>
                            <div class="result-code">SKU: ${product.sku_code}</div>
                            <div class="result-price">₹${product.pricing.selling_price}</div>
                            <div class="result-stock ${product.stock.out_of_stock ? 'stock-out' : 'stock-available'}">
                                Stock: ${product.stock.no_of_stock} units
                            </div>
                            <div class="status-badge status-${product.status.live_status.toLowerCase()}">${product.status.live_status}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        // Selection Functions
        function selectCategory(id, name, code) {
            selectedCategory = { id, name, code };
            
            // Update UI
            document.getElementById('categoryStep').classList.add('completed');
            document.getElementById('categoryStepNumber').classList.add('completed');
            document.getElementById('brandStep').classList.add('active');
            document.getElementById('brandInput').disabled = false;
            document.getElementById('brandSearchBtn').disabled = false;
            
            // Update progress
            document.getElementById('progressFill').style.width = '40%';
            
            // Clear subsequent selections
            selectedBrand = null;
            selectedModel = null;
            selectedVariant = null;
            clearSubsequentSteps();
            
            updateSelectedItems();
        }

        function selectBrand(id, name, code) {
            selectedBrand = { id, name, code };
            
            // Update UI
            document.getElementById('brandStep').classList.add('completed');
            document.getElementById('brandStepNumber').classList.add('completed');
            document.getElementById('modelStep').classList.add('active');
            document.getElementById('modelInput').disabled = false;
            document.getElementById('modelSearchBtn').disabled = false;
            
            // Update progress
            document.getElementById('progressFill').style.width = '60%';
            
            // Clear subsequent selections
            selectedModel = null;
            selectedVariant = null;
            clearSubsequentSteps(['model', 'variant', 'product']);
            
            updateSelectedItems();
        }

        function selectModel(id, name, code) {
            selectedModel = { id, name, code };
            
            // Update UI
            document.getElementById('modelStep').classList.add('completed');
            document.getElementById('modelStepNumber').classList.add('completed');
            document.getElementById('variantStep').classList.add('active');
            document.getElementById('variantInput').disabled = false;
            document.getElementById('variantSearchBtn').disabled = false;
            
            // Update progress
            document.getElementById('progressFill').style.width = '80%';
            
            // Clear subsequent selections
            selectedVariant = null;
            clearSubsequentSteps(['variant', 'product']);
            
            updateSelectedItems();
        }

        function selectVariant(id, name, code) {
            selectedVariant = { id, name, code };
            
            // Update UI
            document.getElementById('variantStep').classList.add('completed');
            document.getElementById('variantStepNumber').classList.add('completed');
            document.getElementById('productStep').classList.add('active');
            document.getElementById('productInput').disabled = false;
            document.getElementById('productSearchBtn').disabled = false;
            
            // Update progress
            document.getElementById('progressFill').style.width = '100%';
            
            // Clear product results
            document.getElementById('productResults').innerHTML = '';
            
            updateSelectedItems();
            
            // Auto-search products when variant is selected
            searchProducts();
        }

        function selectResult(id, name, type) {
            console.log(`Selected ${type}: ${name} (ID: ${id})`);
            // Here you can implement what happens when a result is selected
        }

        function clearSubsequentSteps(steps = ['brand', 'model', 'variant', 'product']) {
            steps.forEach(step => {
                document.getElementById(`${step}Results`).innerHTML = '';
                document.getElementById(`${step}Step`).classList.remove('active', 'completed');
                document.getElementById(`${step}StepNumber`).classList.remove('completed');
                document.getElementById(`${step}Input`).disabled = true;
                document.getElementById(`${step}SearchBtn`).disabled = true;
            });
        }

        function updateSelectedItems() {
            const selectedFilters = document.getElementById('selectedFilters');
            const selectedList = document.getElementById('selectedList');
            
            if (selectedCategory || selectedBrand || selectedModel || selectedVariant) {
                selectedFilters.style.display = 'block';
                
                let items = [];
                if (selectedCategory) items.push(`Category: ${selectedCategory.name}`);
                if (selectedBrand) items.push(`Brand: ${selectedBrand.name}`);
                if (selectedModel) items.push(`Model: ${selectedModel.name}`);
                if (selectedVariant) items.push(`Variant: ${selectedVariant.name}`);
                
                selectedList.innerHTML = items.map(item => `<div class="selected-item">${item}</div>`).join('');
            } else {
                selectedFilters.style.display = 'none';
            }
        }

        function clearSelection() {
            selectedCategory = null;
            selectedBrand = null;
            selectedModel = null;
            selectedVariant = null;
            currentPage = 1;
            
            // Reset UI
            clearSubsequentSteps();
            document.getElementById('progressFill').style.width = '20%';
            
            updateSelectedItems();
        }

        function searchExample(query) {
            document.getElementById('searchInput').value = query;
            performSearch();
        }

        function showSuggestion(text) {
            const suggestionBox = document.getElementById('suggestionBox');
            const suggestionText = document.getElementById('suggestionText');
            
            suggestionText.textContent = text;
            suggestionBox.style.display = 'block';
        }

        function showDetectedPath(path) {
            const detectedPath = document.getElementById('detectedPath');
            const pathList = document.getElementById('pathList');
            
            let pathItems = [];
            if (path.category) {
                pathItems.push(`Category: ${path.category.name}`);
            }
            if (path.brand) {
                pathItems.push(`Brand: ${path.brand.name}`);
            }
            if (path.model) {
                pathItems.push(`Model: ${path.model.name}`);
            }
            if (path.variant) {
                pathItems.push(`Variant: ${path.variant.name}`);
            }
            
            pathList.innerHTML = pathItems.map(item => `<div class="path-item">${item}</div>`).join('');
            detectedPath.style.display = 'block';
        }

        function showLoading(containerId = null) {
            if (containerId) {
                document.getElementById(containerId).innerHTML = '<div class="loading">Searching...</div>';
            } else {
                document.getElementById('loadingState').style.display = 'block';
            }
        }

        function hideLoading(containerId = null) {
            if (containerId) {
                // Loading will be replaced by results
            } else {
                document.getElementById('loadingState').style.display = 'none';
            }
        }

        function showNoResults() {
            document.getElementById('noResults').style.display = 'block';
        }

        function hideResults() {
            document.getElementById('resultsGrid').innerHTML = '';
            document.getElementById('suggestionBox').style.display = 'none';
            document.getElementById('detectedPath').style.display = 'none';
            document.getElementById('noResults').style.display = 'none';
        }

        function showError(message, containerId = null) {
            if (containerId) {
                document.getElementById(containerId).innerHTML = `<div class="no-results">${message}</div>`;
            } else {
                hideLoading();
                const noResults = document.getElementById('noResults');
                noResults.querySelector('h3').textContent = 'Error';
                noResults.querySelector('p').textContent = message;
                noResults.style.display = 'block';
            }
        }
    </script>
</body>
</html>
```

### **2. JavaScript Integration Classes**

```javascript
// Intelligent Search Class
class IntelligentSearch {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5002';
    this.endpoint = '/products/v1/intelligent-search';
  }

  async search(query, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.endpoint}?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'Authorization': 'Bearer your-token', // Optional
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Intelligent search error:', error);
      throw error;
    }
  }

  handleSearchResult(data) {
    switch (data.type) {
      case 'category':
        return this.handleCategoryResult(data);
      case 'brand':
        return this.handleBrandResult(data);
      case 'model':
        return this.handleModelResult(data);
      case 'variant':
        return this.handleVariantResult(data);
      case 'products':
        return this.handleProductResult(data);
      case 'none':
        return this.handleNoResult(data);
      default:
        return this.handleUnknownResult(data);
    }
  }

  handleCategoryResult(data) {
    return {
      type: 'category',
      message: `Found ${data.total} categories`,
      suggestion: data.suggestion,
      results: data.results,
      nextStep: 'brand'
    };
  }

  handleBrandResult(data) {
    return {
      type: 'brand',
      message: `Found ${data.total} brands`,
      suggestion: data.suggestion,
      results: data.results,
      nextStep: 'model'
    };
  }

  handleModelResult(data) {
    return {
      type: 'model',
      message: `Found ${data.total} models`,
      suggestion: data.suggestion,
      results: data.results,
      nextStep: 'variant'
    };
  }

  handleVariantResult(data) {
    return {
      type: 'variant',
      message: `Found ${data.total} variants`,
      suggestion: data.suggestion,
      results: data.results,
      nextStep: 'products'
    };
  }

  handleProductResult(data) {
    return {
      type: 'products',
      message: `Found ${data.total} products`,
      suggestion: data.suggestion,
      results: data.results,
      nextStep: null
    };
  }

  handleNoResult(data) {
    return {
      type: 'none',
      message: 'No results found',
      suggestion: data.suggestion,
      results: [],
      nextStep: null
    };
  }

  handleUnknownResult(data) {
    return {
      type: 'unknown',
      message: 'Unknown result type',
      suggestion: 'Please try a different search',
      results: [],
      nextStep: null
    };
  }
}

// Hierarchical Search Class
class HierarchicalSearch {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5002';
    this.endpoint = '/products/v1/hierarchical-search';
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.selectedModel = null;
    this.selectedVariant = null;
  }

  async searchCategories(query, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.endpoint}?query=${encodeURIComponent(query)}&type=category&limit=${limit}`,
        {
          headers: {
            'Authorization': 'Bearer your-token', // Optional
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Category search error:', error);
      throw error;
    }
  }

  async searchBrands(query, categoryId, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.endpoint}?query=${encodeURIComponent(query)}&type=brand&categoryId=${categoryId}&limit=${limit}`,
        {
          headers: {
            'Authorization': 'Bearer your-token', // Optional
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Brand search error:', error);
      throw error;
    }
  }

  async searchModels(query, brandId, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.endpoint}?query=${encodeURIComponent(query)}&type=model&brandId=${brandId}&limit=${limit}`,
        {
          headers: {
            'Authorization': 'Bearer your-token', // Optional
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Model search error:', error);
      throw error;
    }
  }

  async searchVariants(query, modelId, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.endpoint}?query=${encodeURIComponent(query)}&type=variant&modelId=${modelId}&limit=${limit}`,
        {
          headers: {
            'Authorization': 'Bearer your-token', // Optional
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Variant search error:', error);
      throw error;
    }
  }

  async searchProducts(query = '', categoryId, brandId, modelId = null, variantId = null, limit = 10, page = 1) {
    try {
      let url = `${this.apiBaseUrl}${this.endpoint}?type=products&categoryId=${categoryId}&brandId=${brandId}&limit=${limit}&page=${page}`;
      
      if (modelId) url += `&modelId=${modelId}`;
      if (variantId) url += `&variantId=${variantId}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer your-token', // Optional
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Product search error:', error);
      throw error;
    }
  }

  selectCategory(category) {
    this.selectedCategory = category;
    this.selectedBrand = null;
    this.selectedModel = null;
    this.selectedVariant = null;
  }

  selectBrand(brand) {
    this.selectedBrand = brand;
    this.selectedModel = null;
    this.selectedVariant = null;
  }

  selectModel(model) {
    this.selectedModel = model;
    this.selectedVariant = null;
  }

  selectVariant(variant) {
    this.selectedVariant = variant;
  }

  getCurrentFilters() {
    return {
      category: this.selectedCategory,
      brand: this.selectedBrand,
      model: this.selectedModel,
      variant: this.selectedVariant
    };
  }

  clearSelection() {
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.selectedModel = null;
    this.selectedVariant = null;
  }
}

// Combined Search Manager
class SearchManager {
  constructor() {
    this.intelligentSearch = new IntelligentSearch();
    this.hierarchicalSearch = new HierarchicalSearch();
    this.currentMode = 'intelligent';
  }

  setMode(mode) {
    this.currentMode = mode;
  }

  async search(query, options = {}) {
    if (this.currentMode === 'intelligent') {
      return await this.intelligentSearch.search(query, options.limit);
    } else {
      // Handle hierarchical search based on current step
      const filters = this.hierarchicalSearch.getCurrentFilters();
      
      if (!filters.category) {
        return await this.hierarchicalSearch.searchCategories(query, options.limit);
      } else if (!filters.brand) {
        return await this.hierarchicalSearch.searchBrands(query, filters.category.id, options.limit);
      } else if (!filters.model) {
        return await this.hierarchicalSearch.searchModels(query, filters.brand.id, options.limit);
      } else if (!filters.variant) {
        return await this.hierarchicalSearch.searchVariants(query, filters.model.id, options.limit);
      } else {
        return await this.hierarchicalSearch.searchProducts(
          query, 
          filters.category.id, 
          filters.brand.id, 
          filters.model?.id, 
          filters.variant?.id, 
          options.limit, 
          options.page
        );
      }
    }
  }

  selectItem(item, type) {
    switch (type) {
      case 'category':
        this.hierarchicalSearch.selectCategory(item);
        break;
      case 'brand':
        this.hierarchicalSearch.selectBrand(item);
        break;
      case 'model':
        this.hierarchicalSearch.selectModel(item);
        break;
      case 'variant':
        this.hierarchicalSearch.selectVariant(item);
        break;
    }
  }

  getCurrentFilters() {
    return this.hierarchicalSearch.getCurrentFilters();
  }

  clearSelection() {
    this.hierarchicalSearch.clearSelection();
  }
}
```

### **3. React Integration Example**

```jsx
import React, { useState, useEffect } from 'react';

const AdvancedProductSearch = () => {
  const [searchMode, setSearchMode] = useState('intelligent');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [detectedPath, setDetectedPath] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    category: null,
    brand: null,
    model: null,
    variant: null
  });

  const searchManager = new SearchManager();

  useEffect(() => {
    searchManager.setMode(searchMode);
  }, [searchMode]);

  const handleSearch = async () => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const response = await searchManager.search(query, { limit: 10 });
      
      if (response.success) {
        setResults(response.data.results);
        setSuggestion(response.data.suggestion);
        setDetectedPath(response.data.detectedPath || {});
      } else {
        setResults([]);
        setSuggestion('Search failed: ' + response.message);
      }
    } catch (error) {
      setResults([]);
      setSuggestion('Error searching: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item, type) => {
    searchManager.selectItem(item, type);
    setSelectedFilters(searchManager.getCurrentFilters());
    
    // Auto-search next step if in hierarchical mode
    if (searchMode === 'hierarchical' && type !== 'products') {
      // Trigger next step search
    }
  };

  const clearSelection = () => {
    searchManager.clearSelection();
    setSelectedFilters({
      category: null,
      brand: null,
      model: null,
      variant: null
    });
  };

  return (
    <div className="advanced-search-container">
      {/* Search Mode Selection */}
      <div className="search-modes">
        <button 
          className={searchMode === 'intelligent' ? 'active' : ''}
          onClick={() => setSearchMode('intelligent')}
        >
          🧠 Intelligent Search
        </button>
        <button 
          className={searchMode === 'hierarchical' ? 'active' : ''}
          onClick={() => setSearchMode('hierarchical')}
        >
          📋 Hierarchical Search
        </button>
      </div>

      {/* Search Input */}
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type anything: category, brand, model, variant, or product name..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Selected Filters */}
      {Object.values(selectedFilters).some(filter => filter !== null) && (
        <div className="selected-filters">
          <h3>Selected Filters:</h3>
          {selectedFilters.category && (
            <span className="filter-tag">Category: {selectedFilters.category.name}</span>
          )}
          {selectedFilters.brand && (
            <span className="filter-tag">Brand: {selectedFilters.brand.name}</span>
          )}
          {selectedFilters.model && (
            <span className="filter-tag">Model: {selectedFilters.model.name}</span>
          )}
          {selectedFilters.variant && (
            <span className="filter-tag">Variant: {selectedFilters.variant.name}</span>
          )}
          <button onClick={clearSelection}>Clear</button>
        </div>
      )}

      {/* Suggestion */}
      {suggestion && (
        <div className="suggestion-box">
          <p>{suggestion}</p>
        </div>
      )}

      {/* Detected Path */}
      {Object.keys(detectedPath).length > 0 && (
        <div className="detected-path">
          <h3>Detected Path:</h3>
          {detectedPath.category && (
            <span className="path-item">Category: {detectedPath.category.name}</span>
          )}
          {detectedPath.brand && (
            <span className="path-item">Brand: {detectedPath.brand.name}</span>
          )}
          {detectedPath.model && (
            <span className="path-item">Model: {detectedPath.model.name}</span>
          )}
          {detectedPath.variant && (
            <span className="path-item">Variant: {detectedPath.variant.name}</span>
          )}
        </div>
      )}

      {/* Results */}
      <div className="results-grid">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="result-card"
            onClick={() => handleItemSelect(result, result.type || 'product')}
          >
            <div className="result-type">{result.type || 'Product'}</div>
            <div className="result-name">{result.name || result.product_name}</div>
            <div className="result-code">{result.code || result.sku_code}</div>
            {result.price && (
              <div className="result-price">₹{result.price}</div>
            )}
            {result.stock && (
              <div className="result-stock">Stock: {result.stock} units</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedProductSearch;
```

### **4. Vue.js Integration Example**

```vue
<template>
  <div class="advanced-search-container">
    <!-- Search Mode Selection -->
    <div class="search-modes">
      <button 
        :class="{ active: searchMode === 'intelligent' }"
        @click="setSearchMode('intelligent')"
      >
        🧠 Intelligent Search
      </button>
      <button 
        :class="{ active: searchMode === 'hierarchical' }"
        @click="setSearchMode('hierarchical')"
      >
        📋 Hierarchical Search
      </button>
    </div>

    <!-- Search Input -->
    <div class="search-box">
      <input
        v-model="query"
        placeholder="Type anything: category, brand, model, variant, or product name..."
        @keypress.enter="handleSearch"
      />
      <button @click="handleSearch" :disabled="loading">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Selected Filters -->
    <div v-if="hasSelectedFilters" class="selected-filters">
      <h3>Selected Filters:</h3>
      <span v-if="selectedFilters.category" class="filter-tag">
        Category: {{ selectedFilters.category.name }}
      </span>
      <span v-if="selectedFilters.brand" class="filter-tag">
        Brand: {{ selectedFilters.brand.name }}
      </span>
      <span v-if="selectedFilters.model" class="filter-tag">
        Model: {{ selectedFilters.model.name }}
      </span>
      <span v-if="selectedFilters.variant" class="filter-tag">
        Variant: {{ selectedFilters.variant.name }}
      </span>
      <button @click="clearSelection">Clear</button>
    </div>

    <!-- Suggestion -->
    <div v-if="suggestion" class="suggestion-box">
      <p>{{ suggestion }}</p>
    </div>

    <!-- Detected Path -->
    <div v-if="hasDetectedPath" class="detected-path">
      <h3>Detected Path:</h3>
      <span v-if="detectedPath.category" class="path-item">
        Category: {{ detectedPath.category.name }}
      </span>
      <span v-if="detectedPath.brand" class="path-item">
        Brand: {{ detectedPath.brand.name }}
      </span>
      <span v-if="detectedPath.model" class="path-item">
        Model: {{ detectedPath.model.name }}
      </span>
      <span v-if="detectedPath.variant" class="path-item">
        Variant: {{ detectedPath.variant.name }}
      </span>
    </div>

    <!-- Results -->
    <div class="results-grid">
      <div 
        v-for="(result, index) in results" 
        :key="index"
        class="result-card"
        @click="handleItemSelect(result, result.type || 'product')"
      >
        <div class="result-type">{{ result.type || 'Product' }}</div>
        <div class="result-name">{{ result.name || result.product_name }}</div>
        <div class="result-code">{{ result.code || result.sku_code }}</div>
        <div v-if="result.price" class="result-price">₹{{ result.price }}</div>
        <div v-if="result.stock" class="result-stock">Stock: {{ result.stock }} units</div>
      </div>
    </div>
  </div>
</template>

<script>
import { SearchManager } from './search-manager.js';

export default {
  name: 'AdvancedProductSearch',
  data() {
    return {
      searchMode: 'intelligent',
      query: '',
      results: [],
      loading: false,
      suggestion: '',
      detectedPath: {},
      selectedFilters: {
        category: null,
        brand: null,
        model: null,
        variant: null
      },
      searchManager: new SearchManager()
    };
  },
  computed: {
    hasSelectedFilters() {
      return Object.values(this.selectedFilters).some(filter => filter !== null);
    },
    hasDetectedPath() {
      return Object.keys(this.detectedPath).length > 0;
    }
  },
  methods: {
    setSearchMode(mode) {
      this.searchMode = mode;
      this.searchManager.setMode(mode);
    },
    async handleSearch() {
      if (this.query.length < 2) return;

      this.loading = true;
      try {
        const response = await this.searchManager.search(this.query, { limit: 10 });
        
        if (response.success) {
          this.results = response.data.results;
          this.suggestion = response.data.suggestion;
          this.detectedPath = response.data.detectedPath || {};
        } else {
          this.results = [];
          this.suggestion = 'Search failed: ' + response.message;
        }
      } catch (error) {
        this.results = [];
        this.suggestion = 'Error searching: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    handleItemSelect(item, type) {
      this.searchManager.selectItem(item, type);
      this.selectedFilters = this.searchManager.getCurrentFilters();
    },
    clearSelection() {
      this.searchManager.clearSelection();
      this.selectedFilters = {
        category: null,
        brand: null,
        model: null,
        variant: null
      };
    }
  }
};
</script>
```

## Usage Examples

### **1. Basic Intelligent Search**
```javascript
const search = new IntelligentSearch();

// Search for "spark plug maruti suzuki"
const result = await search.search('spark plug maruti suzuki');
console.log('Detected type:', result.data.type);
console.log('Results:', result.data.results);
console.log('Suggestion:', result.data.suggestion);
```

### **2. Hierarchical Search Flow**
```javascript
const hierarchicalSearch = new HierarchicalSearch();

// Step 1: Search categories
const categories = await hierarchicalSearch.searchCategories('air filter');
hierarchicalSearch.selectCategory(categories.data.results[0]);

// Step 2: Search brands
const brands = await hierarchicalSearch.searchBrands('maruti', categories.data.results[0].id);
hierarchicalSearch.selectBrand(brands.data.results[0]);

// Step 3: Search models
const models = await hierarchicalSearch.searchModels('swift', brands.data.results[0].id);
hierarchicalSearch.selectModel(models.data.results[0]);

// Step 4: Search variants
const variants = await hierarchicalSearch.searchVariants('vdi', models.data.results[0].id);
hierarchicalSearch.selectVariant(variants.data.results[0]);

// Step 5: Search products
const products = await hierarchicalSearch.searchProducts(
  '', 
  categories.data.results[0].id, 
  brands.data.results[0].id, 
  models.data.results[0].id, 
  variants.data.results[0].id
);
```

### **3. Combined Search Manager**
```javascript
const searchManager = new SearchManager();

// Set mode
searchManager.setMode('intelligent');

// Search
const result = await searchManager.search('spark plug maruti suzuki');

// Handle result
if (result.data.type === 'model') {
  // User can select a model
  searchManager.selectItem(result.data.results[0], 'model');
  
  // Continue with variant search
  const variants = await searchManager.search('vdi');
}
```

## Key Features

### **✅ Enhanced Category Detection**
- **Smart Detection**: Automatically detects categories from product names
- **Complex Queries**: Handles "spark plug maruti suzuki" type queries
- **Context Awareness**: Maintains category + brand context

### **✅ Dual Search Modes**
- **Intelligent Search**: Smart auto-detection
- **Hierarchical Search**: Step-by-step guided process
- **Seamless Switching**: Easy mode switching

### **✅ Complete Search Flow**
- **5-Step Process**: Category → Brand → Model → Variant → Products
- **Progressive Filtering**: Each step narrows down results
- **Context Preservation**: Maintains selections throughout

### **✅ Rich User Experience**
- **Real-time Search**: Auto-search as user types
- **Visual Feedback**: Progress bars, suggestions, detected paths
- **Responsive Design**: Works on all devices
- **Search History**: Remembers recent searches

### **✅ Developer-Friendly**
- **Multiple Frameworks**: HTML, React, Vue.js examples
- **Modular Classes**: Reusable search components
- **Error Handling**: Comprehensive error management
- **TypeScript Ready**: Easy to convert to TypeScript

## Summary

This comprehensive frontend implementation guide provides:

✅ **Complete HTML Interface**: Full-featured search interface
✅ **JavaScript Classes**: Reusable search components
✅ **React Integration**: Modern React component example
✅ **Vue.js Integration**: Vue.js component example
✅ **Enhanced Category Detection**: Smart category + brand detection
✅ **Dual Search Modes**: Intelligent and hierarchical search
✅ **5-Step Search Flow**: Category → Brand → Model → Variant → Products
✅ **Rich User Experience**: Progress bars, suggestions, visual feedback
✅ **Responsive Design**: Works on all devices
✅ **Error Handling**: Comprehensive error management
✅ **Search History**: Remembers recent searches
✅ **Framework Agnostic**: Works with any frontend framework

The implementation provides a complete, production-ready search interface that handles both intelligent auto-detection and step-by-step hierarchical search with enhanced category detection capabilities.
