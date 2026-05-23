import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Order, OrderInput } from '../types/order';
import OrderTable from '../components/OrderTable';
import OrderFormModal from '../components/OrderFormModal';
import { PlusCircle, Search, FileSpreadsheet } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import ExportDropdown from '../components/ExportDropdown';
import { exportOrdersCsv } from '../lib/exportUtils';

function OrdersPage() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCreate = async (data: OrderInput) => {
    try {
      await api.post('/orders', data);
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) { console.error('Failed to create order', error); }
  };

  const handleUpdate = async (data: OrderInput) => {
    if (!editingOrder) return;
    try {
      await api.put(`/orders/${editingOrder.id}`, data);
      setIsModalOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (error) { console.error('Failed to update order', error); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      message: 'Are you sure you want to delete this item?',
    });
    if (!ok) return;
    try {
      await api.delete(`/orders/${id}`);
      fetchOrders();
    } catch (error) {
      console.error('Failed to delete order', error);
    }
  };

  const filteredOrders = orders.filter(order =>
    `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      exportOrdersCsv(filteredOrders);
      toast.success(`Exported ${filteredOrders.length} orders to CSV.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'CSV export failed.';
      toast.error(msg);
      console.error('CSV export failed:', err);
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Customer Orders</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 bg-white placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ExportDropdown
              loading={exportingCsv}
              disabled={filteredOrders.length === 0}
              label="Export"
              items={[
                {
                  id: 'csv',
                  label: 'Export CSV',
                  description: `${filteredOrders.length} filtered orders`,
                  icon: <FileSpreadsheet size={16} />,
                  onClick: handleExportCSV,
                },
              ]}
            />
            <button
              onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-100 whitespace-nowrap"
            >
              <PlusCircle size={18} />
              Create Order
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <OrderTable
            orders={filteredOrders}
            onEdit={(order) => { setEditingOrder(order); setIsModalOpen(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      <OrderFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
        onSubmit={editingOrder ? handleUpdate : handleCreate}
        initialData={editingOrder}
        title={editingOrder ? 'Edit Order' : 'Create New Order'}
      />
      {confirmDialog}
    </div>
  );
}

export default OrdersPage;
