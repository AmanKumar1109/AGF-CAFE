# 🍽️ AGF CAFE — User Panel Dashboard Blueprint & Feature Analysis
> **Document Purpose:** Complete analysis of `grovery-hub` user dashboard reference architecture and concrete implementation blueprint for **AGF CAFE** with dark luxury cafe aesthetics.

---

## 📌 Executive Summary

The reference dashboard from `grovery-hub` is a production-grade, highly engaging customer portal built with **React**, **Tailwind CSS**, **Lucide Icons**, **GSAP Animations**, and **Firebase Firestore/Storage**. 

While `grovery-hub` uses a light grocery store theme (emerald greens, yellows, and white backgrounds), **AGF CAFE** will adapt the exact same rich functionality into its signature **Dark Luxury Cafe Theme** (`#101216` obsidian black, `#f59e0b` warm amber, `#ea580c` burnt orange, subtle frosted glassmorphism, and elegant typography with Caveat handwriting accents).

---

## 🔍 Module-by-Module Feature Breakdown (`grovery-hub`)

### 1. Dashboard Layout & Navigation (`components/dashboard/`)

| Component | Features & Purpose | Technical Details |
| :--- | :--- | :--- |
| **`DashboardLayout.jsx`** | Master responsive shell for all user dashboard sub-pages. | • Desktop: 2-column flex layout with sticky sidebar.<br>• Mobile: Full-width view with floating bottom navigation.<br>• Includes slide-over Cart Drawer, global Header/Footer, and auto-prompting `ProfileCompletionModal`.<br>• Print-safe CSS rules (`print:hidden`, `print:bg-white`) for clean invoice generation. |
| **`Sidebar.jsx`** | Desktop navigation drawer that stays sticky on scroll. | • User avatar with fallback initials and "Gold Member" loyalty badge.<br>• Active tab highlighting with slide translation (`translate-x-1`) and amber shadow.<br>• Quick links: Dashboard Home, Back to Menu, My Orders, Refer & Earn, Complaints, Help & Support, Wishlist, Saved Addresses, Profile.<br>• One-click Logout with red accent hover. |
| **`BottomNav.jsx`** | Mobile-first bottom bar + expandable GSAP drawer. | • Persistent bottom bar showing primary icons: Home, Shop, Orders, Profile, and **"More"** button.<br>• Clicking "More" triggers a high-performance **GSAP** bottom slide-up drawer for remaining options (Refer & Earn, Complaints, Wishlist, Addresses, Logout).<br>• Backdrop blur with click-outside dismiss. |
| **`ProfileCompletionModal.jsx`** | New user onboarding gatekeeper. | • Automatically triggers if user logged in without phone number or address.<br>• **Step 1:** Mandatory Phone Number collection for order updates.<br>• **Step 2:** Delivery address capture with interactive map picker (`LocationPickerModal`) or skippable flow saved in `localStorage`. |
| **`EmptyState.jsx`** | Standardized reusable empty state component. | • Clean SVG illustration badge with soft glow.<br>• Customizable title, descriptive subtext, and action button (e.g., "Browse Menu"). |
| **`OrderSkeleton.jsx`** | Shimmer loading skeleton for orders. | • Animated pulse skeleton matching exact order card dimensions to eliminate cumulative layout shift (CLS). |

---

### 2. Dashboard Pages & Business Logic (`pages/dashboard/`)

#### 🏠 `DashboardHome.jsx` (Overview & Command Center)
- **Personalized Welcome Hero**: Dynamic greeting (`Hello, {FirstName}! 👋`) with ambient glow gradient and direct CTA button to explore the cafe menu.
- **3-Metric Quick Stats Cards**:
  - *Wishlist Count:* Quick access to saved favorite items.
  - *Total Orders:* Real-time tally of all lifetime cafe orders.
  - *Total Spent:* Live calculated spending total (`₹XX.XX`).
- **Live Active Delivery Card**:
  - Automatically filters and highlights the most recent active order that is neither `delivered` nor `cancelled`.
  - Shows real-time badge (`Processing 🚚`, `Preparing ☕`, `Out for Delivery 🛵`).
  - Displays primary food item preview thumbnail, item count, and delivery ETA.
  - 1-click button: **"Track Live Delivery Status"**.
- **Customer Care Quick Bar**: Direct links to Lodge Complaints and instant WhatsApp chat assistance.

---

#### 📦 `MyOrders.jsx` (Order History & Lifecycle Management)
- **Real-Time Synchronized List**: Real-time snapshot (`onSnapshot`) listening directly to Firestore `orders` where `userId == currentUser.uid`.
- **Search & Filter Tabs**: Instant filter pills: `All Orders`, `Active`, `Delivered`, `Cancelled`, plus a real-time Search input by Order ID.
- **5-Minute Order Cancellation Countdown Timer**:
  - Automatically calculates remaining cancellation window from `order.createdAt`.
  - Shows dynamic ticking countdown: `Cancel Order [04:32]`.
  - If 5 minutes elapse, automatically switches state to `Cancellation Time Expired` (disabled).
- **Automated Inventory Restocking on Cancel**:
  - Clicking cancel opens a confirmation popup requiring user cancellation reason.
  - Automatically iterates through items and increments Firestore stock quantities back.
- **Digital Delivery OTP Card**:
  - Displays a secure 4/6-digit OTP in large monospace font for active deliveries (`🔐 Delivery OTP: 8492`).
  - Security hint: *"Share this OTP only after receiving your cafe order."*
- **Reorder 1-Click Injection**:
  - For delivered or cancelled orders, clicking "Reorder Items" pushes all items back into `cartItems` and opens the cart drawer automatically.
- **Invoice Link**: Instant navigation to the dedicated thermal receipt view.

---

#### 🛵 `TrackOrder.jsx` (Real-Time Visual Order Tracker)
- **4-Stage Vertical Progress Stepper**:
  1. `Order Received` (Kitchen confirmed order)
  2. `Packed with Care / Preparing` (Chef preparing meals & brewing beverages)
  3. `Out for Delivery` (Delivery partner on the way)
  4. `Delivered` (Order received)
- **Animated Progress Line**: Emerald fill height transitions smoothly using CSS transitions and GSAP stagger.
- **Active Step Ping Beacon**: Radar pulse animation on the currently active status.
- **Delivery Rider Information Card**:
  - Partner profile picture, name, and rating badge (e.g., `⭐ 4.9`).
  - Direct Action Buttons:
    - 📞 **Call Partner** (`tel:${phone}`)
    - 💬 **Message** (`sms:${phone}`)
- **Live Map Widget (`OrderLiveMap.jsx`)**:
  - Visual pin showing delivery route and destination address.

---

#### 🧾 `InvoicePage.jsx` (80mm POS Thermal Receipt & Printer)
- **Retail Thermal Printer Layout**:
  - Pre-styled specifically for **80mm thermal receipt roll printers** via `@media print`.
  - Monospace Courier typography with dashed dividers and centered cafe header.
- **Cafe Header & Tax Details**:
  - Cafe Name, Address, Contact Phone Numbers, GSTIN / FSSAI numbers.
  - Tax invoice badge, invoice number, date/time, customer name & contact.
- **Detailed Itemized Table**:
  - Item name with portion/size tag, Quantity, Unit Rate, and Line Total.
- **Automatic Number-to-Words Generator**:
  - Translates net numeric total (e.g., `₹450`) into English legal currency string: *"Rupees Four Hundred Fifty Only"*.
- **1-Click Print & Download**:
  - Direct browser `window.print()` trigger with print preview button.

---

#### 📍 `SavedAddresses.jsx` (Multi-Address Book with Geolocation)
- **Categorized Address Cards**:
  - Supports labels: `Home` 🏠, `Office` 💼, `Other` 🏷️.
  - Shows Primary Default badge with `Set as Primary` action.
- **GPS Auto-Detect Location**:
  - Uses Browser `navigator.geolocation` + Reverse Geocoding to automatically populate locality, city, and pincode.
- **Interactive Pin-Drop Map Modal (`LocationPickerModal.jsx`)**:
  - Allows the customer to drag and drop a pin on the map to pinpoint their exact cafe delivery entrance.
- **CRUD Operations**: Add new address, update existing address, or delete address with instant UI update.

---

#### ❤️ `Wishlist.jsx` (Customer Favorites & Quick Ordering)
- **Responsive Cafe Dishes Grid**:
  - Dish image with discount percentage pill badge.
  - Rating stars, dish title, current price, and original strikethrough price.
- **Direct Basket Controls**:
  - If item not in cart: Large **"Add to Cart"** button.
  - If item already in cart: Interactive Quantity Selector (`-` `Qty` `+`) with max stock limit guard and a quick-open Cart icon.
- **Heart Toggle Animation**: Instant removal or addition with GSAP scale effect.

---

#### 🎁 `ReferEarn.jsx` (Viral Growth & Reward Coupons)
- **Unique Referral Code & Share Link**:
  - Auto-generated unique customer code (e.g., `AGFCAFE-9281`).
  - Native Web Share API integration (`navigator.share`) with automatic fallback to clipboard copy.
- **3-Tab Referral Dashboard**:
  1. *Overview:* Quick metric cards for Total Referrals, Successful Conversions, Pending Orders, and Available Coupons.
  2. *My Referrals:* Real-time list of friends who signed up with status tags (`REGISTERED`, `REWARDED`, `NOT_QUALIFIED`).
  3. *My Rewards:* Coupon wallet showcasing unlocked voucher cards (`₹50 OFF`, `20% OFF`), expiration dates, and `Used` vs `Active` badges.

---

#### ⚠️ `MyComplaints.jsx` (Grievance & Feedback Management)
- **Direct Grievance Tracking**:
  - Lists past complaints submitted by the customer with ticket ID, timestamp, and issue type (e.g., *Food Quality*, *Missing Items*, *Delivery Delay*).
- **Status Indicators**:
  - `Pending` (Amber clock icon)
  - `In Progress` (Blue message icon)
  - `Resolved` (Emerald checkmark icon)
- **Admin Support Reply Box**:
  - Displays manager/admin replies directly under the ticket in real time.
- **Action Header**: 1-click button to file a new complaint (`/complaint`).

---

#### 👤 `Profile.jsx` (User Information & Photo Upload)
- **Avatar Photo Upload**:
  - Upload profile picture directly to **Firebase Storage** (`profilePhotos/{uid}-{timestamp}`).
  - Image size validation (max 2MB) with loader spinner and real-time avatar preview.
- **Editable Profile Attributes**:
  - Full Name, Mobile Number, Read-only Verified Email.
  - "Verified Member" & loyalty status badges.
  - Form validation with animated success toast/messages.

---

#### 💬 `HelpSupport.jsx` (Omnichannel Customer Care)
- **Direct WhatsApp Chat Launcher**:
  - Opens WhatsApp (`https://wa.me/91XXXXXXXXXX?text=...`) with pre-filled customer support message.
- **Direct Telephone Call Card**:
  - Click-to-call link (`tel:+91...`) with customer care operating hours.
- **Email Assistance**: Direct `mailto:` support trigger.
- **Interactive FAQ Accordion**:
  - Expandable/collapsible FAQ cards addressing common order, delivery, and refund questions.

---

## 🎨 Design System Adaptation: Grocery Hub ➡️ AGF CAFE

| Design Attribute | `grovery-hub` (Grocery Store) | `AGF-CAFE` (Dark Luxury Cafe) |
| :--- | :--- | :--- |
| **Primary Background** | Light Gray (`#f8fafc` / `#ffffff`) | **Obsidian Slate** (`#0a0b0e` / `#101216`) |
| **Card Surface** | White glass with light borders (`bg-white/80 border-slate-200`) | **Dark Frosted Glass** (`bg-stone-900/60 backdrop-blur-xl border-white/10`) |
| **Brand Accent Color** | Green / Emerald (`#10b981`) & Yellow (`#facc15`) | **Warm Golden Amber** (`#f59e0b`) & **Burnt Orange** (`#ea580c`) |
| **Text Primary** | Deep Charcoal (`#0f172a`) | **Warm White / Cream** (`#ffffff` / `#faf7f2`) |
| **Text Muted** | Slate Gray (`#64748b`) | **Warm Stone Gray** (`#a8a29e`) |
| **Fonts** | Inter / System Sans | **Plus Jakarta Sans** (headings & body) + **Caveat** (handwritten cafe accents) |
| **Badges & Highlights** | Pastel emerald & amber pills | **Warm amber metallic borders & soft golden glows** (`shadow-amber-500/20`) |

---

## 🗄️ Firestore Database Schema for AGF CAFE Dashboard

### 1. Collection: `orders`
```typescript
interface CafeOrder {
  id: string;                      // Auto ID
  userId: string;                  // Firebase Auth UID
  customerName: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    portion?: string;              // e.g. "Regular", "Large", "250ml"
    notes?: string;                // e.g. "Less sugar, extra hot"
  }>;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponApplied?: string;
  status: 'Received' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  deliveryOtp?: string;            // 4-digit code e.g. "4921"
  assignedPartnerName?: string;
  assignedPartnerPhone?: string;
  cancelReason?: string;
  paymentMethod: 'COD' | 'ONLINE' | 'UPI';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
    type: 'Home' | 'Office' | 'Other';
  };
  createdAt: any;                  // serverTimestamp
  updatedAt: any;
}
```

### 2. Collection: `users`
```typescript
interface UserProfile {
  uid: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  photoURL?: string;
  myReferralCode: string;          // e.g. "AGFCAFE-1042"
  referredBy?: string;
  wishlist: string[];              // Array of menu item IDs
  addresses: Array<{
    id: string;
    name: string;
    phone: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    type: 'Home' | 'Office' | 'Other';
    lat?: number;
    lng?: number;
  }>;
  primaryAddressId?: string;
  usedCoupons?: string[];
  createdAt: any;
  updatedAt: any;
}
```

### 3. Collection: `complaints`
```typescript
interface Complaint {
  id: string;
  userId: string;
  orderId?: string;
  customerName: string;
  phone: string;
  issueType: 'Quality Issue' | 'Wrong Order' | 'Delivery Delayed' | 'Billing / Payment' | 'Other';
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  adminReply?: string;
  createdAt: any;
  updatedAt: any;
}
```

### 4. Collection: `referrals` & `coupons`
```typescript
interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: 'REGISTERED' | 'REWARDED' | 'NOT_QUALIFIED';
  createdAt: any;
}

interface Coupon {
  id: string;
  code: string;                    // e.g. "WELCOME50", "AGFREFER30"
  userId?: string;                 // If personal reward coupon
  discountType: 'flat' | 'percentage';
  discountValue: number;           // e.g. 50 or 20
  minOrderValue: number;
  validUntil: string;              // ISO Date
  isActive: boolean;
  isReferralCoupon?: boolean;
}
```

---

## 🛠️ Implementation Architecture for AGF CAFE

```
c:\Users\ghosh\AGF-CAFE\user\src\
│
├── components/
│   └── dashboard/
│       ├── DashboardLayout.jsx         # Dark glassmorphism layout with desktop sidebar & mobile nav
│       ├── DashboardSidebar.jsx        # Sticky sidebar with cafe gold accents & user avatar
│       ├── DashboardBottomNav.jsx      # Mobile bar with GSAP animated drawer for sub-options
│       ├── OrderSkeleton.jsx           # Dark skeleton shimmer loader
│       └── EmptyState.jsx              # Reusable empty card with gold CTA buttons
│
├── pages/
│   └── dashboard/
│       ├── DashboardHome.jsx           # Welcome hero, stats, live order card, support banner
│       ├── MyOrders.jsx                # Order cards, 5-min cancel countdown, OTP display, reorder
│       ├── TrackOrder.jsx              # 4-stage stepper, rider call/msg, live status
│       ├── InvoicePage.jsx             # 80mm thermal receipt generator with print styles
│       ├── SavedAddresses.jsx          # Address book, GPS auto-detect, map picker
│       ├── Wishlist.jsx                # Saved dishes with in-card quantity counters
│       ├── ReferEarn.jsx               # Referral code, coupon wallet, reward stats
│       ├── MyComplaints.jsx            # Grievance tickets with admin response box
│       ├── Profile.jsx                 # User information & Storage photo upload
│       └── HelpSupport.jsx             # WhatsApp direct chat, call support, FAQ accordion
│
└── routes/
    └── AppRoutes.jsx                   # Nested /dashboard routing configuration
```

---

## 🚀 Step-by-Step Execution Plan

### Step 1: Core Shell & Navigation
1. Create `components/dashboard/DashboardLayout.jsx` tailored to AGF CAFE dark glass theme (`bg-[#0a0b0e]`).
2. Create `DashboardSidebar.jsx` with amber highlights and user profile summary.
3. Create `DashboardBottomNav.jsx` with smooth GSAP slide-up sheet for mobile navigation.
4. Update `Navbar.jsx` user dropdown to link directly to `/dashboard`.

### Step 2: Orders, Tracking & Invoice
1. Implement `MyOrders.jsx` with real-time Firebase Firestore snapshot queries.
2. Build the **5-minute countdown cancellation timer** and instant reorder cart injection.
3. Build `TrackOrder.jsx` with the 4-phase preparation timeline (Received ➔ Preparing ☕ ➔ Out for Delivery 🛵 ➔ Delivered 🎉).
4. Build `InvoicePage.jsx` with standard 80mm thermal receipt printing support.

### Step 3: Address Management & Profile
1. Implement `SavedAddresses.jsx` with Home/Office tags and browser Geolocation auto-fill.
2. Build `Profile.jsx` with Firebase Storage avatar image upload.

### Step 4: Loyalty, Grievance & Help Center
1. Implement `Wishlist.jsx` with direct cart controls.
2. Build `ReferEarn.jsx` with referral code copying, Web Share API, and discount coupons.
3. Build `MyComplaints.jsx` with ticket history and admin replies.
4. Build `HelpSupport.jsx` with WhatsApp direct link and interactive FAQ accordion.
