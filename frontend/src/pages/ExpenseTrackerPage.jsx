import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { expenseApi } from '../services/api';
import {
  Receipt,
  Plus,
  Trash2,
  Pencil,
  TrendingDown,
  TrendingUp,
  Calculator,
  CheckCircle2,
  Upload,
  AlertCircle,
  Tag
} from 'lucide-react';

export const ExpenseTrackerPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Use string values for numeric fields so users can type naturally without disruption
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierOrPayee: '',
    category: 'Material',
    materialOrService: '',
    quantity: '1',
    unit: 'unit',
    rate: '',
    discount: '0',
    additionalCharges: '0',
    paymentStatus: 'Paid',
    associatedBoqCode: '',
    invoiceNumber: '',
    notes: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseApi.getExpenses(id);
      if (res.data.success) {
        setExpenses(res.data.expenses);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchExpenses();
  }, [id]);

  const openAddModal = () => {
    setEditingExpenseId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierOrPayee: '',
      category: 'Material',
      materialOrService: '',
      quantity: '1',
      unit: 'unit',
      rate: '',
      discount: '0',
      additionalCharges: '0',
      paymentStatus: 'Paid',
      associatedBoqCode: '',
      invoiceNumber: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpenseId(expense._id || expense.id);
    setFormData({
      date: expense.date || new Date().toISOString().split('T')[0],
      supplierOrPayee: expense.supplierOrPayee || '',
      category: expense.category || 'Material',
      materialOrService: expense.materialOrService || '',
      quantity: String(expense.quantity ?? 1),
      unit: expense.unit || 'unit',
      rate: String(expense.rate ?? ''),
      discount: String(expense.discount ?? 0),
      additionalCharges: String(expense.additionalCharges ?? 0),
      paymentStatus: expense.paymentStatus || 'Paid',
      associatedBoqCode: expense.associatedBoqCode || '',
      invoiceNumber: expense.invoiceNumber || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  // Live calculation of net amount: Quantity × Rate - Discount + Additional Charges
  const numQty = parseFloat(formData.quantity) || 0;
  const numRate = parseFloat(formData.rate) || 0;
  const numDisc = parseFloat(formData.discount) || 0;
  const numAddl = parseFloat(formData.additionalCharges) || 0;
  const computedSubtotal = Math.round(numQty * numRate);
  const computedFinalAmount = Math.max(0, Math.round(computedSubtotal - numDisc + numAddl));

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!formData.supplierOrPayee || !formData.materialOrService || formData.rate === '') {
      showToast('Please provide payee, material/service description, and rate', true);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        date: formData.date,
        supplierOrPayee: formData.supplierOrPayee,
        category: formData.category,
        materialOrService: formData.materialOrService,
        quantity: numQty || 1,
        unit: formData.unit || 'unit',
        rate: numRate,
        subtotal: computedSubtotal,
        discount: numDisc,
        additionalCharges: numAddl,
        totalAmount: computedFinalAmount,
        paymentStatus: formData.paymentStatus,
        associatedBoqCode: formData.associatedBoqCode,
        invoiceNumber: formData.invoiceNumber,
        notes: formData.notes
      };

      if (editingExpenseId) {
        // Edit existing record
        const res = await expenseApi.updateExpense(id, editingExpenseId, payload);
        if (res.data.success) {
          setShowModal(false);
          setEditingExpenseId(null);
          await fetchExpenses();
          showToast('Expense record updated successfully!');
        }
      } else {
        // Create new record
        const data = new FormData();
        Object.entries(payload).forEach(([k, v]) => data.append(k, v));
        const res = await expenseApi.addExpense(id, data);
        if (res.data.success) {
          setShowModal(false);
          await fetchExpenses();
          showToast('Expense logged successfully!');
        }
      }
    } catch (err) {
      console.error('Save expense error:', err);
      showToast(err.response?.data?.message || 'Failed to save expense', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to void this expense entry?')) {
      await expenseApi.deleteExpense(id, expenseId);
      await fetchExpenses();
      showToast('Expense marked as voided.');
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading project expenditures and ledger...
      </div>
    );
  }

  const totalBudget = summary?.totalBudget || 3500000;
  const totalSpent = summary?.totalSpent || 0;
  const remaining = summary?.remainingBudget ?? (totalBudget - totalSpent);
  const burnPercent = summary?.burnPercentage || 0;

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toast && (
        <div className={`p-3 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in ${
          toast.isError ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.isError ? <AlertCircle className="w-4 h-4 text-red-200 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              AUDITABLE EXPENDITURE LEDGER
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{expenses.length} Records Logged</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Project Expenses & Purchase Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log actual material purchases, labour payouts, contractor disbursements, discounts, and transportation charges.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent to Date</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">₹ {Number(totalSpent).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{burnPercent}% of total target budget</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Budget</span>
          <h3 className={`text-xl font-bold mt-1 ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹ {Number(remaining).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">{remaining >= 0 ? 'Available liquidity' : 'Budget overrun'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Material Purchases</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">₹ {Number(summary?.materialSpent || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Cement, steel, tiles & wood</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Labour Payouts</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">₹ {Number(summary?.labourSpent || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Masonry, concrete & electrical</p>
        </div>
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Expense Transactions</h3>
          <span className="text-[11px] text-slate-500">{expenses.length} Total Entries</span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No expenses logged yet. Click "Log New Expense" to track purchases.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier / Payee</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Qty & Unit</th>
                  <th className="py-2.5 px-3">Rate (INR)</th>
                  <th className="py-2.5 px-3">Discount / Extra</th>
                  <th className="py-2.5 px-3">Total Paid (INR)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e._id || e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-600">{e.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{e.supplierOrPayee}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{e.materialOrService}</td>
                    <td className="py-3 px-3 font-mono">{e.quantity} {e.unit}</td>
                    <td className="py-3 px-3 font-mono">₹ {Number(e.rate).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-[11px]">
                      {e.discount > 0 && <span className="text-emerald-600 block">-₹{Number(e.discount).toLocaleString('en-IN')} disc</span>}
                      {e.additionalCharges > 0 && <span className="text-amber-600 block">+₹{Number(e.additionalCharges).toLocaleString('en-IN')} extra</span>}
                      {!e.discount && !e.additionalCharges && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">₹ {Number(e.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {e.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit Expense Record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e._id || e.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Void Expense Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingExpenseId ? 'Edit Expenditure Record' : 'Log Construction Expenditure'}
            </h3>
            
            <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="Material">Material Purchase</option>
                    <option value="Labour">Labour Payment</option>
                    <option value="Contractor Fee">Contractor Fee</option>
                    <option value="Equipment">Equipment / JCB Rental</option>
                    <option value="Permits & Fees">Permits & Fees</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier / Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplierOrPayee}
                  onChange={(e) => setFormData(p => ({ ...p, supplierOrPayee: e.target.value }))}
                  placeholder="e.g. Warangal Cement Traders"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material / Service Description *</label>
                <input
                  type="text"
                  required
                  value={formData.materialOrService}
                  onChange={(e) => setFormData(p => ({ ...p, materialOrService: e.target.value }))}
                  placeholder="e.g. 25 bags OPC 53 Cement for Column Footings"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Quantity, Unit & Rate Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                    placeholder="25"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                    placeholder="bag/kg/sqft"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate (INR) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData(p => ({ ...p, rate: e.target.value }))}
                    placeholder="1200"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Discount and Additional Charges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount (INR)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.discount}
                    onChange={(e) => setFormData(p => ({ ...p, discount: e.target.value }))}
                    placeholder="e.g. 2000"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Additional Charges (INR)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.additionalCharges}
                    onChange={(e) => setFormData(p => ({ ...p, additionalCharges: e.target.value }))}
                    placeholder="e.g. 1500 (Transport/Unloading)"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Transparent Calculation Summary Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({numQty} × ₹{numRate}):</span>
                  <span className="font-mono">₹ {computedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {numDisc > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">- ₹ {numDisc.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {numAddl > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Additional Charges:</span>
                    <span className="font-mono">+ ₹ {numAddl.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Final Amount Paid:</span>
                  <span className="font-mono text-blue-600 text-sm">₹ {computedFinalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData(p => ({ ...p, paymentStatus: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Pending">Payment Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice / Receipt #</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(p => ({ ...p, invoiceNumber: e.target.value }))}
                    placeholder="INV-2026-081"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional site memo or delivery remarks"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingExpenseId(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingExpenseId ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpenseTrackerPage;
