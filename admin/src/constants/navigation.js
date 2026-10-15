export const MAIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/',
    active: true,
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'ClipboardList',
    path: '/orders',
    badge: '46',
    badgeColor: 'emerald',
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'Package',
    path: '/products',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'Users',
    path: '/customers',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: 'Star',
    path: '/reviews',
  },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: 'MessageSquareWarning',
    path: '/complaints',
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'FileText',
    path: '/content',
  },
  {
    id: 'online-store',
    label: 'Online Store',
    icon: 'Store',
    path: '/store',
  },
];

export const SECONDARY_NAV_ITEMS = [
  {
    id: 'finances',
    label: 'Finances',
    icon: 'Banknote',
    expandable: true,
    children: [
      { id: 'invoices', label: 'Invoices', path: '/finances/invoices' },
      { id: 'transactions', label: 'Transactions', path: '/finances/transactions' },
      { id: 'reports', label: 'Reports', path: '/finances/reports' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart2',
    path: '/analytics',
  },
  {
    id: 'discounts',
    label: 'Discounts',
    icon: 'Percent',
    path: '/discounts',
  },
];

export const BOTTOM_NAV_ITEMS = [
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'HelpCircle',
    path: '/help',
  },
];
