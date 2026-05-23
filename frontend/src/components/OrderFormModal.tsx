import React, { useState, useEffect } from 'react';
import type { Order, OrderInput } from '../types/order';
import { X, AlertCircle } from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderInput) => void;
  initialData?: Order | null;
  title: string;
}

const countries = ["USA", "Canada", "UK", "Germany", "India"];
const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"];
const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
const creators = ["Admin", "Sales Manager", "Support", "Inventory"];

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState<OrderInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    product: 'Laptop',
    quantity: 1,
    unitPrice: 0,
    status: 'Pending',
    createdBy: 'Admin',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const { id, totalAmount, createdAt, ...rest } = initialData;
      setFormData(rest as OrderInput);
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
        product: 'Laptop',
        quantity: 1,
        unitPrice: 0,
        status: 'Pending',
        createdBy: 'Admin',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const mandatoryFields = [
      'firstName', 'lastName', 'email', 'phone', 
      'street', 'city', 'state', 'postalCode', 
      'product', 'status', 'createdBy'
    ];
    
    mandatoryFields.forEach(field => {
      if (!formData[field as keyof OrderInput]) {
        newErrors[field] = 'Please fill the field';
      }
    });

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Please fill the field';
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      newErrors.unitPrice = 'Please fill the field';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, parseInt(value) || 0) : name === 'unitPrice' ? Math.max(0, parseFloat(value) || 0) : value
    }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  const renderField = (label: string, name: keyof OrderInput, type: string = 'text') => (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={formData[name] as string | number}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 bg-gray-50 border ${errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 ${errors[name] ? 'focus:ring-red-100' : 'focus:ring-indigo-100'} focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {errors[name] && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 flex items-center gap-1">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase">{errors[name]}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-indigo-50/30">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-0.5">Halleyx Compliant Data Entry</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Customer Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Customer Information</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {renderField('First Name', 'firstName')}
              {renderField('Last Name', 'lastName')}
            </div>
            <div className="flex flex-wrap gap-4">
              {renderField('Email Address', 'email', 'email')}
              {renderField('Phone Number', 'phone', 'tel')}
            </div>
          </section>

          {/* Location */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Delivery Address</h3>
            </div>
            <div className="flex flex-col gap-4">
              {renderField('Street Address', 'street')}
              <div className="flex flex-wrap gap-4">
                {renderField('City', 'city')}
                {renderField('State', 'state')}
                {renderField('Postal Code', 'postalCode')}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none appearance-none"
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Order Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Order Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product</label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none appearance-none"
                >
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Order Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none appearance-none"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unit Price ($)</label>
                <input
                  type="number"
                  name="unitPrice"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-black text-indigo-500 uppercase tracking-wider mb-1.5 underline underline-offset-4 decoration-2">Total Amount</label>
                <div className="w-full px-4 py-2.5 bg-indigo-600 border border-indigo-700 rounded-xl text-white font-black text-lg shadow-inner ring-4 ring-indigo-50">
                  ${(formData.quantity * formData.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Created By</label>
              <select
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.createdBy ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 ${errors.createdBy ? 'focus:ring-red-100' : 'focus:ring-indigo-100'} focus:border-indigo-500 transition-all text-sm font-medium text-gray-900 outline-none appearance-none`}
              >
                {creators.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.createdBy && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.createdBy}</p>
              )}
            </div>
          </section>
        </form>

        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 hover:bg-white rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-8 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 uppercase tracking-widest"
          >
            {initialData ? 'Update Order' : 'Commit Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFormModal;
