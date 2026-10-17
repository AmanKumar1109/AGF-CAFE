export const NAV_CATEGORIES = [
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/',
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'ClipboardList',
        path: '/orders',
      },
      {
        id: 'offline-tables',
        label: 'Offline POS & Tables',
        icon: 'UtensilsCrossed',
        path: '/offline-tables',
      },
      {
        id: 'fleet-radar',
        label: 'Live Fleet Radar & Map',
        icon: 'Radio',
        path: '/fleet-radar',
      },
      {
        id: 'products',
        label: 'Menu & Dishes',
        icon: 'Package',
        path: '/products',
      },
      {
        id: 'staff',
        label: 'Delivery Personnel',
        icon: 'Bike',
        path: '/staff',
      },
    ],
  },
  {
    id: 'growth',
    label: 'Growth & Offers',
    items: [
      {
        id: 'coupons',
        label: 'Coupons & Offers',
        icon: 'Ticket',
        path: '/coupons',
      },
      {
        id: 'referrals',
        label: 'Referral Program',
        icon: 'Gift',
        path: '/referrals',
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    items: [
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
        id: 'notifications',
        label: 'Email Notifications',
        icon: 'Mail',
        path: '/notifications',
      },
    ],
  },
];

// Flat export of all main navigation items for compatibility
export const MAIN_NAV_ITEMS = NAV_CATEGORIES.flatMap((cat) => cat.items);

export const CONTENT_NAV_ITEMS = [
  {
    id: 'privacy-policy',
    label: 'Privacy Policy',
    docId: 'privacyPolicy',
    icon: 'FileText',
    path: '/privacy-policy',
  },
  {
    id: 'terms-of-service',
    label: 'Terms and Conditions',
    docId: 'termsOfService',
    icon: 'FileText',
    path: '/terms-of-service',
  },
  {
    id: 'refund-policy',
    label: 'Refund Policy',
    docId: 'refundPolicy',
    icon: 'FileText',
    path: '/refund-policy',
  },
  {
    id: 'cancellation-policy',
    label: 'Cancellation Policy',
    docId: 'cancellationPolicy',
    icon: 'FileText',
    path: '/cancellation-policy',
  },
  {
    id: 'disclaimer',
    label: 'Disclaimer',
    docId: 'disclaimer',
    icon: 'FileText',
    path: '/disclaimer',
  },
  {
    id: 'shipping-policy',
    label: 'Shipping & Delivery',
    docId: 'shippingPolicy',
    icon: 'FileText',
    path: '/shipping-policy',
  },
  {
    id: 'about-us',
    label: 'About Us',
    docId: 'aboutUs',
    icon: 'FileText',
    path: '/about-us',
  },
];

export const SECONDARY_NAV_ITEMS = [];

export const BOTTOM_NAV_ITEMS = [
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: 'ShieldCheck',
    path: '/audit-logs',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
  },
];
