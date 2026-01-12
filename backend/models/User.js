import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
      // Password required only for local auth (not Google)
      return this.authProvider === 'local' || !this.authProvider;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  microsoftId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'microsoft', 'both'],
    default: 'local'
  },
  profilePicture: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'staff', 'new_joinee', 'super_admin'],
    default: 'new_joinee'
  },
  permissions: {
    canManageStaff: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canManageSales: { type: Boolean, default: false },
    canManagePurchases: { type: Boolean, default: false },
    canManageClients: { type: Boolean, default: false },
    canManageSuppliers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Skip hashing if password is not modified or not provided (Google auth)
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set permissions based on role
userSchema.methods.setRolePermissions = function () {
  const rolePermissions = {
    owner: {
      canManageStaff: true,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageClients: true,
      canManageSuppliers: true,
      canViewReports: true,
      canManageSettings: true
    },
    admin: {
      canManageStaff: true,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageClients: true,
      canManageSuppliers: true,
      canViewReports: true,
      canManageSettings: false
    },
    manager: {
      canManageStaff: false,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageClients: true,
      canManageSuppliers: true,
      canViewReports: true,
      canManageSettings: false
    },
    staff: {
      canManageStaff: false,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageClients: false,
      canManageSuppliers: false,
      canViewReports: false,
      canManageSettings: false
    },
    new_joinee: {
      canManageStaff: false,
      canManageInventory: false,
      canManageSales: false,
      canManagePurchases: false,
      canManageClients: false,
      canManageSuppliers: false,
      canViewReports: false,
      canManageSettings: false
    }
  };

  this.permissions = rolePermissions[this.role] || rolePermissions.new_joinee;
};

export default mongoose.model('User', userSchema);
