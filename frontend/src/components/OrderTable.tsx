import React from 'react';
import type { Order } from '../types/order';
import { Edit, Trash2 } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Customer</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Product</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Quantity</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Total</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Status</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                <div className="font-medium text-gray-900">{order.firstName} {order.lastName}</div>
                <div className="text-gray-500 text-xs">{order.email}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-700">{order.product}</td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-700">{order.quantity}</td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-700 font-semibold">${order.totalAmount.toFixed(2)}</td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(order)}
                    className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(order.id)}
                    className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">
                No orders found. Create one to get started!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
