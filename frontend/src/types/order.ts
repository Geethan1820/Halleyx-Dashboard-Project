export interface Order {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdBy: string;
  createdAt: string;
}

export type OrderInput = Omit<Order, 'id' | 'totalAmount' | 'createdAt'>;
