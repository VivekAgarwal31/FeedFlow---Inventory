// Company-specific localStorage utility
// This ensures data is shared across all users within the same company

const getCompanyId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.companyId?._id || user.companyId || null
}

// Track the last known company ID to detect company changes
const LAST_COMPANY_KEY = 'lastCompanyId'

const detectCompanyChange = () => {
  const currentCompanyId = getCompanyId()
  const lastCompanyId = localStorage.getItem(LAST_COMPANY_KEY)
  
  if (currentCompanyId !== lastCompanyId) {
    // Company has changed, clear any cached data
    if (lastCompanyId) {
      console.log(`Company changed from ${lastCompanyId} to ${currentCompanyId}`)
    }
    
    // Update the last known company ID
    if (currentCompanyId) {
      localStorage.setItem(LAST_COMPANY_KEY, currentCompanyId)
    } else {
      localStorage.removeItem(LAST_COMPANY_KEY)
    }
    
    return true
  }
  
  return false
}

const getCompanyKey = (key) => {
  const companyId = getCompanyId()
  if (!companyId) {
    console.warn('No company ID found, using global key')
    return key
  }
  return `${companyId}_${key}`
}

export const companyStorage = {
  getItem: (key) => {
    const companyKey = getCompanyKey(key)
    return localStorage.getItem(companyKey)
  },

  setItem: (key, value) => {
    const companyKey = getCompanyKey(key)
    localStorage.setItem(companyKey, value)
  },

  removeItem: (key) => {
    const companyKey = getCompanyKey(key)
    localStorage.removeItem(companyKey)
  },

  // Helper methods for common operations
  getJSON: (key, defaultValue = null) => {
    try {
      const item = companyStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error parsing JSON for key ${key}:`, error)
      return defaultValue
    }
  },

  setJSON: (key, value) => {
    try {
      companyStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error stringifying JSON for key ${key}:`, error)
    }
  }
}

// Migration function to move existing data to company-specific keys
export const migrateToCompanyStorage = () => {
  const companyId = getCompanyId()
  if (!companyId) return

  // Detect if company has changed
  const companyChanged = detectCompanyChange()

  const keysToMigrate = [
    'suppliers',
    'purchases', 
    'stockTransactions',
    'sales',
    'stockItems',
    'warehouses',
    'clients'
  ]

  // Check if we've already migrated for this company
  const migrationKey = `${companyId}_migrated`
  const alreadyMigrated = localStorage.getItem(migrationKey)

  // Only migrate if this company hasn't been migrated yet AND we have global data
  if (!alreadyMigrated) {
    // Check if this is truly legacy data (not from another company)
    const hasLegacyData = keysToMigrate.some(key => {
      const globalData = localStorage.getItem(key)
      return globalData && globalData !== '[]' && globalData !== '{}'
    })

    if (hasLegacyData) {
      // Only migrate if there's actual legacy data and no other company has been migrated
      const allMigrationKeys = Object.keys(localStorage).filter(key => key.endsWith('_migrated'))
      const isFirstMigration = allMigrationKeys.length === 0

      if (isFirstMigration) {
        keysToMigrate.forEach(key => {
          const existingData = localStorage.getItem(key)
          const companyKey = `${companyId}_${key}`

          if (existingData && existingData !== '[]' && existingData !== '{}') {
            localStorage.setItem(companyKey, existingData)
            console.log(`Migrated ${key} to company-specific storage for company ${companyId}`)
          }
        })
      }
    }

    // Mark this company as migrated (even if no data was migrated)
    localStorage.setItem(migrationKey, 'true')
  }

  // Always clear global data after migration attempt to prevent cross-contamination
  if (companyChanged || !alreadyMigrated) {
    clearGlobalBusinessData()
  }
}

// Clear all company-specific data (useful when switching companies)
export const clearCompanyData = () => {
  const companyId = getCompanyId()
  if (!companyId) return

  const keysToMigrate = [
    'suppliers',
    'purchases', 
    'stockTransactions',
    'sales',
    'stockItems',
    'warehouses',
    'clients'
  ]

  keysToMigrate.forEach(key => {
    const companyKey = `${companyId}_${key}`
    localStorage.removeItem(companyKey)
  })

  // Also remove migration marker
  localStorage.removeItem(`${companyId}_migrated`)
  console.log(`Cleared all data for company ${companyId}`)
}

// Clear global business data (prevents cross-contamination between companies)
export const clearGlobalBusinessData = () => {
  const keysToMigrate = [
    'suppliers',
    'purchases', 
    'stockTransactions',
    'sales',
    'stockItems',
    'warehouses',
    'clients'
  ]

  keysToMigrate.forEach(key => {
    localStorage.removeItem(key)
  })

  console.log('Cleared global business data to prevent cross-contamination')
}

// Initialize storage for a new company (ensures clean slate)
export const initializeCompanyStorage = () => {
  const companyId = getCompanyId()
  if (!companyId) return

  // Check if this is a new company (no migration marker exists)
  const migrationKey = `${companyId}_migrated`
  const alreadyInitialized = localStorage.getItem(migrationKey)

  if (!alreadyInitialized) {
    // This is a new company, ensure clean data
    const keysToInitialize = [
      'suppliers',
      'purchases', 
      'stockTransactions',
      'sales',
      'stockItems',
      'warehouses',
      'clients',
      'warehouseStock' // New key for warehouse-specific stock tracking
    ]

    keysToInitialize.forEach(key => {
      const companyKey = `${companyId}_${key}`
      // Initialize with empty array if no data exists
      if (!localStorage.getItem(companyKey)) {
        localStorage.setItem(companyKey, JSON.stringify([]))
      }
    })

    // Mark as initialized
    localStorage.setItem(migrationKey, 'true')
    console.log(`Initialized clean storage for new company ${companyId}`)
  }
}

// Warehouse-specific stock management utilities
export const warehouseStockUtils = {
  // Get stock quantity for a specific item in a specific warehouse
  getStockQuantity: (itemId, warehouseId) => {
    const warehouseStock = companyStorage.getJSON('warehouseStock', [])
    const stockRecord = warehouseStock.find(stock => 
      stock.itemId === itemId && stock.warehouseId === warehouseId
    )
    return stockRecord ? stockRecord.quantity : 0
  },

  // Set stock quantity for a specific item in a specific warehouse
  setStockQuantity: (itemId, warehouseId, quantity) => {
    const warehouseStock = companyStorage.getJSON('warehouseStock', [])
    const existingIndex = warehouseStock.findIndex(stock => 
      stock.itemId === itemId && stock.warehouseId === warehouseId
    )

    if (existingIndex >= 0) {
      // Update existing record
      warehouseStock[existingIndex].quantity = quantity
      warehouseStock[existingIndex].updatedAt = new Date().toISOString()
    } else {
      // Create new record
      warehouseStock.push({
        itemId,
        warehouseId,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    companyStorage.setJSON('warehouseStock', warehouseStock)
  },

  // Add stock quantity for a specific item in a specific warehouse
  addStockQuantity: (itemId, warehouseId, quantityToAdd) => {
    const currentQuantity = warehouseStockUtils.getStockQuantity(itemId, warehouseId)
    warehouseStockUtils.setStockQuantity(itemId, warehouseId, currentQuantity + quantityToAdd)
  },

  // Remove stock quantity for a specific item in a specific warehouse
  removeStockQuantity: (itemId, warehouseId, quantityToRemove) => {
    const currentQuantity = warehouseStockUtils.getStockQuantity(itemId, warehouseId)
    const newQuantity = Math.max(0, currentQuantity - quantityToRemove)
    warehouseStockUtils.setStockQuantity(itemId, warehouseId, newQuantity)
  },

  // Get total quantity of an item across all warehouses
  getTotalItemQuantity: (itemId) => {
    const warehouseStock = companyStorage.getJSON('warehouseStock', [])
    return warehouseStock
      .filter(stock => stock.itemId === itemId)
      .reduce((total, stock) => total + stock.quantity, 0)
  },

  // Get all items in a specific warehouse with their quantities
  getWarehouseInventory: (warehouseId) => {
    const warehouseStock = companyStorage.getJSON('warehouseStock', [])
    return warehouseStock.filter(stock => stock.warehouseId === warehouseId)
  },

  // Get distribution of an item across all warehouses
  getItemDistribution: (itemId) => {
    const warehouseStock = companyStorage.getJSON('warehouseStock', [])
    const warehouses = companyStorage.getJSON('warehouses', [])
    
    return warehouses.map(warehouse => {
      const stockRecord = warehouseStock.find(stock => 
        stock.itemId === itemId && stock.warehouseId === warehouse._id
      )
      return {
        warehouse,
        quantity: stockRecord ? stockRecord.quantity : 0
      }
    })
  },

  // Move stock from one warehouse to another
  moveStock: (itemId, fromWarehouseId, toWarehouseId, quantity) => {
    warehouseStockUtils.removeStockQuantity(itemId, fromWarehouseId, quantity)
    warehouseStockUtils.addStockQuantity(itemId, toWarehouseId, quantity)
  }
}
