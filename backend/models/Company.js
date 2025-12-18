import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyCode: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['wholesale', 'retail', 'manufacturing', 'all'],
    default: 'all'
  },
  address: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// Generate company code before validation so "required" passes
companySchema.pre('validate', async function(next) {
  try {
    if (!this.companyCode) {
      let code = ''
      let exists = true
      let attempts = 0
      const MAX_ATTEMPTS = 20

      while (exists && attempts < MAX_ATTEMPTS) {
        const randomNum = Math.floor(10000 + Math.random() * 90000)
        code = `CFX-${randomNum}`
        exists = await this.constructor.exists({ companyCode: code })
        attempts++
      }

      if (exists) {
        return next(new Error('Failed to generate unique company code'))
      }

      this.companyCode = code
    }
    next()
  } catch (err) {
    next(err)
  }
});

export default mongoose.model('Company', companySchema);
