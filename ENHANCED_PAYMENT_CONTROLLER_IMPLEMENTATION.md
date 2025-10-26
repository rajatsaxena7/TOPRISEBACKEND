# Comprehensive Frontend Implementation Guide
## Multi-Step Product Search with Intelligent Detection

### Overview
This guide provides complete frontend implementation for both **Intelligent Search** and **Hierarchical Search** endpoints, supporting a 5-step search flow: **Category → Brand → Model → Variant → Products**.

---

## 🎯 Search Flow Architecture

### **Intelligent Search Flow**
```
User Input → Auto-Detection → Smart Results
"air filter" → Detects Category → Returns Categories
"maruti suzuki" → Detects Brand → Returns Brands  
"maruti suzuki swift" → Detects Brand+Model → Returns Models
"maruti suzuki swift vdi" → Detects Brand+Model+Variant → Returns Variants
"spark plug" → Detects Product → Returns Products
```

### **Hierarchical Search Flow**
```
Step 1: Category Selection → Step 2: Brand Selection → Step 3: Model Selection → Step 4: Variant Selection → Step 5: Products
```

---

## 🔧 API Endpoints

### **1. Intelligent Search**
```http
GET /products/v1/intelligent-search?query={search_term}&limit={number}&page={number}
```

### **2. Hierarchical Search**
```http
GET /products/v1/hierarchical-search?type={type}&query={search_term}&categoryId={id}&brandId={id}&modelId={id}&variantId={id}&limit={number}&page={number}
```

**Search Types:**
- `category` - Search categories
- `brand` - Search brands (requires categoryId)
- `model` - Search models (requires brandId)
- `variant` - Search variants (requires modelId)
- `products` - Search products (requires categoryId, brandId)

---

## 🎨 Complete Frontend Implementation

### **HTML Structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Step Product Search</title>
    <style>
        /* Complete CSS styles provided below */
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔍 Smart Product Search</h1>
            <p>Find products with intelligent search or step-by-step navigation</p>
        </div>

        <!-- Search Mode Toggle -->
        <div class="search-mode-toggle">
            <button class="mode-btn active" id="intelligentMode">🧠 Intelligent Search</button>
            <button class="mode-btn" id="hierarchicalMode">📋 Step-by-Step</button>
        </div>

        <!-- Intelligent Search Interface -->
        <div class="search-interface" id="intelligentSearch">
            <div class="search-box">
                <input type="text" class="search-input" id="intelligentInput" 
                       placeholder="Type anything: category, brand, model, variant, or product...">
                <button class="search-button" onclick="performIntelligentSearch()">Search</button>
            </div>
            
            <div class="search-examples">
                <h3>💡 Try these examples:</h3>
                <div class="example-item" onclick="searchExample('air filter')">air filter</div>
                <div class="example-item" onclick="searchExample('maruti')">maruti</div>
                <div class="example-item" onclick="searchExample('maruti suzuki swift')">maruti suzuki swift</div>
                <div class="example-item" onclick="searchExample('spark plug')">spark plug</div>
            </div>

            <div class="suggestion-box" id="intelligentSuggestion" style="display: none;">
                <div class="suggestion-text" id="intelligentSuggestionText"></div>
            </div>

            <div class="detected-path" id="intelligentDetectedPath" style="display: none;">
                <h3>🎯 Detected Path:</h3>
                <div id="intelligentPathList"></div>
            </div>

            <div class="results-container" id="intelligentResults"></div>
        </div>

        <!-- Hierarchical Search Interface -->
        <div class="search-interface" id="hierarchicalSearch" style="display: none;">
            <!-- Progress Bar -->
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 20%"></div>
            </div>

            <!-- Step 1: Category Selection -->
            <div class="search-step active" id="categoryStep">
                <div class="step-header">
                    <div class="step-number" id="categoryStepNumber">1</div>
                    <div class="step-title">Select Category</div>
                </div>
                <input type="text" class="search-input" id="categoryInput" 
                       placeholder="Search categories (e.g., air filter, spark plug, oil filter)">
                <button class="search-button" onclick="searchCategories()">Search Categories</button>
                <div class="results-container" id="categoryResults"></div>
            </div>

            <!-- Step 2: Brand Selection -->
            <div class="search-step" id="brandStep">
                <div class="step-header">
                    <div class="step-number" id="brandStepNumber">2</div>
                    <div class="step-title">Select Brand</div>
                </div>
                <input type="text" class="search-input" id="brandInput" 
                       placeholder="Search brands" disabled>
                <button class="search-button" onclick="searchBrands()" disabled id="brandSearchBtn">Search Brands</button>
                <div class="results-container" id="brandResults"></div>
            </div>

            <!-- Step 3: Model Selection -->
            <div class="search-step" id="modelStep">
                <div class="step-header">
                    <div class="step-number" id="modelStepNumber">3</div>
                    <div class="step-title">Select Model</div>
                </div>
                <input type="text" class="search-input" id="modelInput" 
                       placeholder="Search models" disabled>
                <button class="search-button" onclick="searchModels()" disabled id="modelSearchBtn">Search Models</button>
                <div class="results-container" id="modelResults"></div>
            </div>

            <!-- Step 4: Variant Selection -->
            <div class="search-step" id="variantStep">
                <div class="step-header">
                    <div class="step-number" id="variantStepNumber">4</div>
                    <div class="step-title">Select Variant</div>
                </div>
                <input type="text" class="search-input" id="variantInput" 
                       placeholder="Search variants" disabled>
                <button class="search-button" onclick="searchVariants()" disabled id="variantSearchBtn">Search Variants</button>
                <div class="results-container" id="variantResults"></div>
            </div>

            <!-- Step 5: Product Search -->
            <div class="search-step" id="productStep">
                <div class="step-header">
                    <div class="step-number" id="productStepNumber">5</div>
                    <div class="step-title">View Products</div>
                </div>
                <input type="text" class="search-input" id="productInput" 
                       placeholder="Search within products (optional)" disabled>
                <button class="search-button" onclick="searchProducts()" disabled id="productSearchBtn">Search Products</button>
                <div class="results-container" id="productResults"></div>
            </div>

            <!-- Selected Filters -->
            <div class="selected-filters" id="selectedFilters" style="display: none;">
                <h3>Selected Filters:</h3>
                <div id="selectedFiltersList"></div>
                <button class="clear-button" onclick="clearAllSelections()">Clear All</button>
            </div>
        </div>
    </div>

    <script>
        // Complete JavaScript implementation provided below
    </script>
</body>
</html>
```

### **CSS Styles**

```css
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

.header p {
    font-size: 1.1rem;
    opacity: 0.9;
}

/* Search Mode Toggle */
.search-mode-toggle {
    display: flex;
    justify-content: center;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e5e9;
}

.mode-btn {
    padding: 12px 24px;
    margin: 0 10px;
    border: 2px solid #e1e5e9;
    background: white;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.mode-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.mode-btn:hover:not(.active) {
    border-color: #667eea;
    color: #667eea;
}

/* Search Interface */
.search-interface {
    padding: 30px;
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

.search-button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

/* Search Examples */
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

/* Suggestion Box */
.suggestion-box {
    background: #f8f9ff;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 30px;
    text-align: center;
}

.suggestion-text {
    color: #667eea;
    font-size: 1.1rem;
    font-weight: 600;
}

/* Detected Path */
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

/* Progress Bar */
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

/* Search Steps */
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

/* Results */
.results-container {
    margin-top: 20px;
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

.result-description {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.result-brand {
    color: #667eea;
    font-size: 0.9rem;
    margin-bottom: 5px;
}

.result-model {
    color: #28a745;
    font-size: 0.9rem;
    margin-bottom: 10px;
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

.result-status {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
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

/* Selected Filters */
.selected-filters {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    margin-top: 30px;
}

.selected-filters h3 {
    color: #333;
    margin-bottom: 15px;
}

.filter-item {
    display: inline-block;
    background: #667eea;
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
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

/* Loading and No Results */
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

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
}

.pagination button {
    padding: 8px 12px;
    border: 2px solid #e1e5e9;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
    border-color: #667eea;
    background: #667eea;
    color: white;
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination .current-page {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

/* Responsive Design */
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
    
    .search-interface {
        padding: 20px;
    }
    
    .results-grid {
        grid-template-columns: 1fr;
    }
    
    .search-mode-toggle {
        flex-direction: column;
        align-items: center;
    }
    
    .mode-btn {
        margin: 5px 0;
        width: 200px;
    }
}
```

### **JavaScript Implementation**

```javascript
// Configuration
const API_BASE_URL = 'http://localhost:5002';
const INTELLIGENT_SEARCH_ENDPOINT = '/products/v1/intelligent-search';
const HIERARCHICAL_SEARCH_ENDPOINT = '/products/v1/hierarchical-search';

// State Management
class SearchState {
    constructor() {
        this.mode = 'intelligent'; // 'intelligent' or 'hierarchical'
        this.selectedCategory = null;
        this.selectedBrand = null;
        this.selectedModel = null;
        this.selectedVariant = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }

    reset() {
        this.selectedCategory = null;
        this.selectedBrand = null;
        this.selectedModel = null;
        this.selectedVariant = null;
        this.currentPage = 1;
        this.totalPages = 1;
    }

    addToHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        }
    }
}

const searchState = new SearchState();

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateSearchHistory();
});

function setupEventListeners() {
    // Mode toggle
    document.getElementById('intelligentMode').addEventListener('click', () => switchMode('intelligent'));
    document.getElementById('hierarchicalMode').addEventListener('click', () => switchMode('hierarchical'));

    // Intelligent search
    document.getElementById('intelligentInput').addEventListener('input', function() {
        if (this.value.length >= 2) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                performIntelligentSearch();
            }, 1000);
        } else {
            hideIntelligentResults();
        }
    });

    // Hierarchical search inputs
    ['categoryInput', 'brandInput', 'modelInput', 'variantInput', 'productInput'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            if (this.value.length >= 2) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    const functionName = id.replace('Input', 'Search').replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase()).replace(/\s/g, '');
                    window[`search${functionName}`]();
                }, 1000);
            }
        });
    });
}

// Mode Switching
function switchMode(mode) {
    searchState.mode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}Mode`).classList.add('active');
    
    document.getElementById('intelligentSearch').style.display = mode === 'intelligent' ? 'block' : 'none';
    document.getElementById('hierarchicalSearch').style.display = mode === 'hierarchical' ? 'block' : 'none';
    
    if (mode === 'hierarchical') {
        resetHierarchicalSearch();
    } else {
        hideIntelligentResults();
    }
}

// Intelligent Search Functions
async function performIntelligentSearch() {
    const query = document.getElementById('intelligentInput').value.trim();
    if (query.length < 2) return;

    showIntelligentLoading();
    hideIntelligentResults();

    try {
        const response = await fetch(`${API_BASE_URL}${INTELLIGENT_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&limit=10`, {
            headers: {
                'Authorization': 'Bearer your-auth-token-here',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayIntelligentResults(data.data);
            searchState.addToHistory(query);
        } else {
            showIntelligentError('Search failed: ' + data.message);
        }
    } catch (error) {
        console.error('Intelligent search error:', error);
        showIntelligentError('Error searching: ' + error.message);
    }
}

function displayIntelligentResults(data) {
    hideIntelligentLoading();
    
    // Show suggestion
    if (data.suggestion) {
        showIntelligentSuggestion(data.suggestion);
    }

    // Show detected path
    if (data.detectedPath && Object.keys(data.detectedPath).length > 0) {
        showIntelligentDetectedPath(data.detectedPath);
    }

    // Show results
    if (data.results && data.results.length > 0) {
        displayIntelligentResultsGrid(data.results, data.type);
    } else {
        showIntelligentNoResults();
    }
}

function displayIntelligentResultsGrid(results, type) {
    const container = document.getElementById('intelligentResults');
    
    const html = results.map(result => {
        let cardContent = '';
        
        if (type === 'category') {
            cardContent = `
                <div class="result-type">Category</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="result-description">${result.description || 'No description available'}</div>
                <div class="status-badge status-${result.status.toLowerCase()}">${result.status}</div>
            `;
        } else if (type === 'brand') {
            cardContent = `
                <div class="result-type">Brand</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                ${result.featured ? '<div class="status-badge status-featured">Featured</div>' : ''}
            `;
        } else if (type === 'model') {
            cardContent = `
                <div class="result-type">Model</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="result-brand">Brand: ${result.brand?.name || 'N/A'}</div>
                <div class="status-badge status-active">${result.status}</div>
            `;
        } else if (type === 'variant') {
            cardContent = `
                <div class="result-type">Variant</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="result-brand">Brand: ${result.brand?.name || 'N/A'}</div>
                <div class="result-model">Model: ${result.model?.name || 'N/A'}</div>
                <div class="status-badge status-active">${result.status}</div>
                ${result.description ? `<div class="result-description">${result.description}</div>` : ''}
            `;
        } else if (type === 'products') {
            cardContent = `
                <div class="result-type">Product</div>
                <div class="result-name">${result.product_name}</div>
                <div class="result-code">SKU: ${result.sku_code}</div>
                <div class="result-brand">Brand: ${result.brand?.name || 'N/A'}</div>
                <div class="result-model">Model: ${result.model?.name || 'N/A'}</div>
                <div class="result-price">₹${result.pricing.selling_price}</div>
                <div class="result-stock ${result.stock.out_of_stock ? 'stock-out' : 'stock-available'}">
                    Stock: ${result.stock.no_of_stock} units
                </div>
                <div class="result-status">
                    <div class="status-badge status-${result.status.live_status.toLowerCase()}">${result.status.live_status}</div>
                    <div class="status-badge status-${result.status.qc_status.toLowerCase()}">${result.status.qc_status}</div>
                </div>
            `;
        }

        return `
            <div class="result-card" onclick="selectIntelligentResult('${result.id}', '${result.name}', '${type}')">
                ${cardContent}
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="results-grid">${html}</div>`;
}

// Hierarchical Search Functions
async function searchCategories() {
    const query = document.getElementById('categoryInput').value.trim();
    if (query.length < 2) return;

    try {
        showHierarchicalLoading('categoryResults');
        
        const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&type=category&limit=10`, {
            headers: {
                'Authorization': 'Bearer your-auth-token-here',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayHierarchicalResults('categoryResults', data.data.results, 'category');
        } else {
            showHierarchicalError('categoryResults', 'Failed to search categories: ' + data.message);
        }
    } catch (error) {
        console.error('Category search error:', error);
        showHierarchicalError('categoryResults', 'Error searching categories: ' + error.message);
    }
}

async function searchBrands() {
    if (!searchState.selectedCategory) return;
    
    const query = document.getElementById('brandInput').value.trim();
    if (query.length < 2) return;

    try {
        showHierarchicalLoading('brandResults');
        
        const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&type=brand&categoryId=${searchState.selectedCategory.id}&limit=10`, {
            headers: {
                'Authorization': 'Bearer your-auth-token-here',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayHierarchicalResults('brandResults', data.data.results, 'brand');
        } else {
            showHierarchicalError('brandResults', 'Failed to search brands: ' + data.message);
        }
    } catch (error) {
        console.error('Brand search error:', error);
        showHierarchicalError('brandResults', 'Error searching brands: ' + error.message);
    }
}

async function searchModels() {
    if (!searchState.selectedBrand) return;
    
    const query = document.getElementById('modelInput').value.trim();
    if (query.length < 2) return;

    try {
        showHierarchicalLoading('modelResults');
        
        const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&type=model&brandId=${searchState.selectedBrand.id}&limit=10`, {
            headers: {
                'Authorization': 'Bearer your-auth-token-here',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayHierarchicalResults('modelResults', data.data.results, 'model');
        } else {
            showHierarchicalError('modelResults', 'Failed to search models: ' + data.message);
        }
    } catch (error) {
        console.error('Model search error:', error);
        showHierarchicalError('modelResults', 'Error searching models: ' + error.message);
    }
}

async function searchVariants() {
    if (!searchState.selectedModel) return;
    
    const query = document.getElementById('variantInput').value.trim();
    if (query.length < 2) return;

    try {
        showHierarchicalLoading('variantResults');
        
        const response = await fetch(`${API_BASE_URL}${HIERARCHICAL_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&type=variant&modelId=${searchState.selectedModel.id}&limit=10`, {
            headers: {
                'Authorization': 'Bearer your-auth-token-here',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayHierarchicalResults('variantResults', data.data.results, 'variant');
        } else {
            showHierarchicalError('variantResults', 'Failed to search variants: ' + data.message);
        }
    } catch (error) {
        console.error('Variant search error:', error);
        showHierarchicalError('variantResults', 'Error searching variants: ' + error.message);
    }
}

async function searchProducts() {
    if (!searchState.selectedCategory || !searchState.selectedBrand) return;
    
    const query = document.getElementById('productInput').value.trim();
    
    try {
        showHierarchicalLoading('productResults');
        
        let url = `${API_BASE_URL}${HIERARCHICAL_SEARCH_ENDPOINT}?type=products&categoryId=${searchState.selectedCategory.id}&brandId=${searchState.selectedBrand.id}&limit=10&page=${searchState.currentPage}`;
        
        if (searchState.selectedModel) {
            url += `&modelId=${searchState.selectedModel.id}`;
        }
        
        if (searchState.selectedVariant) {
            url += `&variantId=${searchState.selectedVariant.id}`;
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
            displayHierarchicalResults('productResults', data.data.results, 'products', data.data.pagination);
        } else {
            showHierarchicalError('productResults', 'Failed to search products: ' + data.message);
        }
    } catch (error) {
        console.error('Product search error:', error);
        showHierarchicalError('productResults', 'Error searching products: ' + error.message);
    }
}

// Selection Functions
function selectCategory(id, name, code) {
    searchState.selectedCategory = { id, name, code };
    
    // Update UI
    document.getElementById('categoryStep').classList.add('completed');
    document.getElementById('categoryStepNumber').classList.add('completed');
    document.getElementById('brandStep').classList.add('active');
    document.getElementById('brandInput').disabled = false;
    document.getElementById('brandSearchBtn').disabled = false;
    
    // Update progress
    document.getElementById('progressFill').style.width = '40%';
    
    // Clear subsequent selections
    searchState.selectedBrand = null;
    searchState.selectedModel = null;
    searchState.selectedVariant = null;
    clearSubsequentSteps();
    
    updateSelectedFilters();
}

function selectBrand(id, name, code) {
    searchState.selectedBrand = { id, name, code };
    
    // Update UI
    document.getElementById('brandStep').classList.add('completed');
    document.getElementById('brandStepNumber').classList.add('completed');
    document.getElementById('modelStep').classList.add('active');
    document.getElementById('modelInput').disabled = false;
    document.getElementById('modelSearchBtn').disabled = false;
    
    // Update progress
    document.getElementById('progressFill').style.width = '60%';
    
    // Clear subsequent selections
    searchState.selectedModel = null;
    searchState.selectedVariant = null;
    clearSubsequentSteps(['model', 'variant', 'product']);
    
    updateSelectedFilters();
}

function selectModel(id, name, code) {
    searchState.selectedModel = { id, name, code };
    
    // Update UI
    document.getElementById('modelStep').classList.add('completed');
    document.getElementById('modelStepNumber').classList.add('completed');
    document.getElementById('variantStep').classList.add('active');
    document.getElementById('variantInput').disabled = false;
    document.getElementById('variantSearchBtn').disabled = false;
    
    // Update progress
    document.getElementById('progressFill').style.width = '80%';
    
    // Clear subsequent selections
    searchState.selectedVariant = null;
    clearSubsequentSteps(['variant', 'product']);
    
    updateSelectedFilters();
}

function selectVariant(id, name, code) {
    searchState.selectedVariant = { id, name, code };
    
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
    
    updateSelectedFilters();
    
    // Auto-search products when variant is selected
    searchProducts();
}

// Utility Functions
function displayHierarchicalResults(containerId, results, type, pagination = null) {
    const container = document.getElementById(containerId);
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    const html = results.map(result => {
        let cardContent = '';
        
        if (type === 'category') {
            cardContent = `
                <div class="result-type">Category</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="result-description">${result.description || 'No description available'}</div>
                <div class="status-badge status-${result.status.toLowerCase()}">${result.status}</div>
            `;
        } else if (type === 'brand') {
            cardContent = `
                <div class="result-type">Brand</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                ${result.featured ? '<div class="status-badge status-featured">Featured</div>' : ''}
            `;
        } else if (type === 'model') {
            cardContent = `
                <div class="result-type">Model</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="status-badge status-active">${result.status}</div>
            `;
        } else if (type === 'variant') {
            cardContent = `
                <div class="result-type">Variant</div>
                <div class="result-name">${result.name}</div>
                <div class="result-code">Code: ${result.code}</div>
                <div class="status-badge status-active">${result.status}</div>
                ${result.description ? `<div class="result-description">${result.description}</div>` : ''}
            `;
        } else if (type === 'products') {
            cardContent = `
                <div class="result-type">Product</div>
                <div class="result-name">${result.product_name}</div>
                <div class="result-code">SKU: ${result.sku_code}</div>
                <div class="result-price">₹${result.pricing.selling_price}</div>
                <div class="result-stock ${result.stock.out_of_stock ? 'stock-out' : 'stock-available'}">
                    Stock: ${result.stock.no_of_stock} units
                </div>
                <div class="result-status">
                    <div class="status-badge status-${result.status.live_status.toLowerCase()}">${result.status.live_status}</div>
                    <div class="status-badge status-${result.status.qc_status.toLowerCase()}">${result.status.qc_status}</div>
                </div>
            `;
        }

        const clickHandler = type === 'category' ? `selectCategory('${result.id}', '${result.name}', '${result.code}')` :
                           type === 'brand' ? `selectBrand('${result.id}', '${result.name}', '${result.code}')` :
                           type === 'model' ? `selectModel('${result.id}', '${result.name}', '${result.code}')` :
                           type === 'variant' ? `selectVariant('${result.id}', '${result.name}', '${result.code}')` :
                           `selectProduct('${result.id}', '${result.name}')`;

        return `
            <div class="result-card" onclick="${clickHandler}">
                ${cardContent}
            </div>
        `;
    }).join('');

    let paginationHtml = '';
    if (pagination && pagination.totalPages > 1) {
        paginationHtml = `
            <div class="pagination">
                <button onclick="changePage(1)" ${pagination.currentPage === 1 ? 'disabled' : ''}>First</button>
                <button onclick="changePage(${pagination.currentPage - 1})" ${!pagination.hasPreviousPage ? 'disabled' : ''}>Previous</button>
                <span class="current-page">${pagination.currentPage}</span>
                <button onclick="changePage(${pagination.currentPage + 1})" ${!pagination.hasNextPage ? 'disabled' : ''}>Next</button>
                <button onclick="changePage(${pagination.totalPages})" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}>Last</button>
            </div>
        `;
    }

    container.innerHTML = `<div class="results-grid">${html}</div>${paginationHtml}`;
}

function clearSubsequentSteps(steps = ['brand', 'model', 'variant', 'product']) {
    steps.forEach(step => {
        document.getElementById(`${step}Results`).innerHTML = '';
        if (step !== 'product') {
            document.getElementById(`${step}Step`).classList.remove('active', 'completed');
            document.getElementById(`${step}StepNumber`).classList.remove('completed');
            document.getElementById(`${step}Input`).disabled = true;
            document.getElementById(`${step}SearchBtn`).disabled = true;
        }
    });
}

function updateSelectedFilters() {
    const selectedFilters = document.getElementById('selectedFilters');
    const selectedFiltersList = document.getElementById('selectedFiltersList');
    
    const filters = [];
    if (searchState.selectedCategory) filters.push(`Category: ${searchState.selectedCategory.name}`);
    if (searchState.selectedBrand) filters.push(`Brand: ${searchState.selectedBrand.name}`);
    if (searchState.selectedModel) filters.push(`Model: ${searchState.selectedModel.name}`);
    if (searchState.selectedVariant) filters.push(`Variant: ${searchState.selectedVariant.name}`);
    
    if (filters.length > 0) {
        selectedFilters.style.display = 'block';
        selectedFiltersList.innerHTML = filters.map(filter => `<div class="filter-item">${filter}</div>`).join('');
    } else {
        selectedFilters.style.display = 'none';
    }
}

function clearAllSelections() {
    searchState.reset();
    
    // Reset UI
    document.querySelectorAll('.search-step').forEach(step => step.classList.remove('active', 'completed'));
    document.querySelectorAll('.step-number').forEach(step => step.classList.remove('completed'));
    document.querySelectorAll('.search-input').forEach(input => input.disabled = true);
    document.querySelectorAll('.search-button').forEach(btn => btn.disabled = true);
    
    // Enable first step
    document.getElementById('categoryStep').classList.add('active');
    document.getElementById('categoryInput').disabled = false;
    document.getElementById('categorySearchBtn').disabled = false;
    
    // Clear all results
    ['categoryResults', 'brandResults', 'modelResults', 'variantResults', 'productResults'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
    
    // Reset progress
    document.getElementById('progressFill').style.width = '20%';
    
    updateSelectedFilters();
}

function resetHierarchicalSearch() {
    clearAllSelections();
}

// UI Helper Functions
function showIntelligentLoading() {
    document.getElementById('intelligentResults').innerHTML = '<div class="loading">Searching...</div>';
}

function hideIntelligentLoading() {
    // Loading will be replaced by results
}

function showIntelligentSuggestion(text) {
    const suggestionBox = document.getElementById('intelligentSuggestion');
    const suggestionText = document.getElementById('intelligentSuggestionText');
    
    suggestionText.textContent = text;
    suggestionBox.style.display = 'block';
}

function showIntelligentDetectedPath(path) {
    const detectedPath = document.getElementById('intelligentDetectedPath');
    const pathList = document.getElementById('intelligentPathList');
    
    let pathItems = [];
    if (path.category) pathItems.push(`Category: ${path.category.name}`);
    if (path.brand) pathItems.push(`Brand: ${path.brand.name}`);
    if (path.model) pathItems.push(`Model: ${path.model.name}`);
    if (path.variant) pathItems.push(`Variant: ${path.variant.name}`);
    
    pathList.innerHTML = pathItems.map(item => `<div class="path-item">${item}</div>`).join('');
    detectedPath.style.display = 'block';
}

function hideIntelligentResults() {
    document.getElementById('intelligentResults').innerHTML = '';
    document.getElementById('intelligentSuggestion').style.display = 'none';
    document.getElementById('intelligentDetectedPath').style.display = 'none';
}

function showIntelligentNoResults() {
    document.getElementById('intelligentResults').innerHTML = '<div class="no-results">No results found</div>';
}

function showIntelligentError(message) {
    document.getElementById('intelligentResults').innerHTML = `<div class="no-results">${message}</div>`;
}

function showHierarchicalLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">Searching...</div>';
}

function showHierarchicalError(containerId, message) {
    document.getElementById(containerId).innerHTML = `<div class="no-results">${message}</div>`;
}

// Example Functions
function searchExample(query) {
    if (searchState.mode === 'intelligent') {
        document.getElementById('intelligentInput').value = query;
        performIntelligentSearch();
    } else {
        document.getElementById('categoryInput').value = query;
        searchCategories();
    }
}

function updateSearchHistory() {
    // This would update a search history display if needed
}

// Pagination
function changePage(page) {
    if (page >= 1 && page <= searchState.totalPages) {
        searchState.currentPage = page;
        searchProducts();
    }
}

// Selection handlers
function selectIntelligentResult(id, name, type) {
    console.log(`Selected ${type}: ${name} (ID: ${id})`);
    // Implement what happens when a result is selected in intelligent search
}

function selectProduct(id, name) {
    console.log(`Selected product: ${name} (ID: ${id})`);
    // Implement what happens when a product is selected
}
```

---

## 🚀 Implementation Steps

### **1. Setup**
1. Copy the complete HTML, CSS, and JavaScript code above
2. Update the `API_BASE_URL` to match your backend URL
3. Add authentication token if required
4. Test with your backend endpoints

### **2. Customization**
1. **Styling**: Modify CSS variables for colors, fonts, spacing
2. **Layout**: Adjust grid columns, card sizes, responsive breakpoints
3. **Functionality**: Add custom selection handlers, pagination logic
4. **Integration**: Connect with your existing authentication system

### **3. Testing**
1. Test intelligent search with various queries
2. Test hierarchical search step-by-step
3. Test mode switching
4. Test responsive design on different devices

---

## 📱 Features Included

### **Intelligent Search**
- ✅ Auto-detection of search intent
- ✅ Smart suggestions and context display
- ✅ Real-time search with debouncing
- ✅ Search history
- ✅ Example queries

### **Hierarchical Search**
- ✅ 5-step search flow (Category → Brand → Model → Variant → Products)
- ✅ Progressive filtering
- ✅ Visual progress indicator
- ✅ Selected filters display
- ✅ Step-by-step navigation

### **UI/UX Features**
- ✅ Mode switching between intelligent and hierarchical search
- ✅ Responsive design for all devices
- ✅ Loading states and error handling
- ✅ Rich result cards with type indicators
- ✅ Pagination support
- ✅ Clear visual feedback

### **Technical Features**
- ✅ State management
- ✅ Local storage for search history
- ✅ Debounced search inputs
- ✅ Error handling
- ✅ Modular code structure

---

## 🎯 Usage Examples

### **Intelligent Search Examples**
```
"air filter" → Detects category, returns categories
"maruti" → Detects brand, returns brands
"maruti suzuki swift" → Detects brand+model, returns models
"spark plug" → Detects product, returns products
```

### **Hierarchical Search Flow**
```
1. Search "air filter" → Select "Air Filter" category
2. Search "maruti" → Select "Maruti Suzuki" brand
3. Search "swift" → Select "Swift" model
4. Se