const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  date: {
    type: String,
    required: [true, 'Please provide expense date (YYYY-MM-DD)'],
  },
  supplierOrPayee: {
    type: String,
    required: [true, 'Please provide supplier / contractor / payee name'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Material', 'Labour', 'Equipment', 'Contractor Fee', 'Permits & Fees', 'Other'],
    default: 'Material',
  },
  materialOrService: {
    type: String,
    required: [true, 'Please provide item or service description'],
  },
  quantity: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    default: 'unit',
  },
  rate: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  additionalCharges: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partially Paid'],
    default: 'Paid',
  },
  associatedBoqCode: {
    type: String,
    default: '',
  },
  associatedStageCode: {
    type: String,
    default: '',
  },
  invoiceNumber: {
    type: String,
    default: '',
  },
  invoiceUrl: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  isVoided: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
