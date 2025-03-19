const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for media links
const mediaLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['website', 'social', 'music', 'video', 'podcast', 'other'],
    default: 'website'
  },
  icon: {
    type: String,
    default: 'link'
  }
}, { _id: true });

// Define the schema for pricing options
const pricingOptionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryTime: {
    type: Number, // in days
    default: 7
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['personal', 'business', 'custom'],
    default: 'personal'
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password is required only if not using Google auth
    }
  },
  name: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  picture: String,
  isPodcaster: {
    type: Boolean,
    default: false
  },
  bio: String,
  profileImage: String,
  pricePerMessage: {
    type: Number,
    default: 0
  },
  availableForRequests: {
    type: Boolean,
    default: true
  },
  // New fields for enhanced profile
  displayName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  profession: {
    type: String,
    trim: true
  },
  mediaLinks: [mediaLinkSchema],
  profileTheme: {
    type: String,
    enum: ['default', 'dark', 'light', 'colorful'],
    default: 'default'
  },
  customColors: {
    background: String,
    text: String,
    buttons: String
  },
  // Audio request pricing options
  pricingOptions: [pricingOptionSchema],
  acceptsRequests: {
    type: Boolean,
    default: false
  },
  requestsInfo: {
    headline: {
      type: String,
      trim: true,
      default: "Request a personalized audio message"
    },
    description: {
      type: String,
      trim: true
    },
    responseTime: {
      type: Number, // in days
      default: 7
    },
    paymentMethods: {
      paypal: {
        type: Boolean,
        default: false
      },
      stripe: {
        type: Boolean,
        default: false
      },
      paypalEmail: {
        type: String,
        trim: true
      },
      stripeAccountId: {
        type: String,
        trim: true
      }
    }
  },
  paymentSettings: {
    acceptsPayments: { type: Boolean, default: false },
    stripeAccountId: { type: String },
    paypalEmail: { type: String },
    preferredCurrency: { type: String, default: 'USD' }
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving (only if password is modified and exists)
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 