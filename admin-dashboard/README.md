# AGF CAFE - Modern Admin Dashboard

A pixel-perfect, production-grade recreation of the **AGF CAFE** modern admin dashboard, crafted with **React**, **Tailwind CSS**, and **GSAP** for smooth, lightweight micro-animations.

---

## 🚀 Features

- **Exact Design Match**: Recreated every widget, badge, curve, font, and button from the design reference.
- **GSAP Animations**:
  - Staggered entrance animation for dashboard cards on page load.
  - Interactive chart curve tooltip with dynamic position interpolation.
  - Growing bar chart animation for the weekly activity graph.
  - Continuous subtle floating & breathing animation for the 3D AI sphere.
- **Production Folder Structure**:
  - Modularized components separated into `common`, `layout`, `dashboard`, and `modals`.
  - Reusable animation hooks in `hooks/`.
  - Centralized mock analytics data and navigation definitions in `constants/`.
  - Formatters and helpers in `utils/`.
- **Interactive Widgets**:
  - **KPI Cards**: Page Views (16,431), Visitors (6,225), Click (2,832), and Orders (1,224) with up/down trend pills.
  - **Total Profit Curve**: Interactive dual-line chart with cubic bezier curves, gradient area fill, and active point marker on Jan 18 ($12,324 / $5,563).
  - **Customer Breakdown**: Retailers (2,884), Distributors (1,432), and Wholesalers (562) with colored progress indicators.
  - **Most Day Active**: Weekly bar chart with Tue highlight badge (8,162).
  - **Repeat Customer Rate**: Radial semi-circle gauge (68%) with emerald green ticks.
  - **Best Selling Products**: Product table with status badges, dollar indicators, and star ratings.
  - **AI Assistant**: 3D orb with realistic lighting gradients and interactive chat input.
  - **Modals**: Export Analytics modal (CSV, PDF, JSON), Widget customization modal, and Date range picker.

---

## 📁 Production-Grade Folder Structure

```
admin-dashboard/
├── public/
├── src/
│   ├── assets/                       # Static media, icons, and svgs
│   ├── components/
│   │   ├── common/                   # Reusable UI primitives
│   │   │   ├── Badge.jsx             # Trend and count badges
│   │   │   ├── Button.jsx            # Royal blue, outline, and ghost buttons
│   │   │   └── Card.jsx              # Rounded card containers
│   │   ├── layout/                   # Layout structure
│   │   │   ├── Header.jsx            # Search bar with ⌘K, theme toggle, notifications
│   │   │   ├── Sidebar.jsx           # Collapsible sidebar with navigation & upgrade card
│   │   │   └── MainLayout.jsx        # Responsive app wrapper
│   │   ├── dashboard/                # Feature-specific dashboard widgets
│   │   │   ├── AIAssistantWidget.jsx # 3D glowing orb AI widget
│   │   │   ├── BestSellingProducts.jsx # Top products table
│   │   │   ├── DashboardHeader.jsx   # Page title, date filter, actions
│   │   │   ├── MetricCards.jsx       # 4 KPI cards
│   │   │   ├── MostDayActive.jsx     # Weekly active volume bar chart
│   │   │   ├── ProfitAnalytics.jsx   # Dual line chart + Customer breakdown
│   │   │   └── RepeatCustomerRate.jsx# Semi-circular radial gauge
│   │   └── modals/                   # Interactive dialogs
│   │       ├── AddWidgetModal.jsx    # Customize widget visibility
│   │       ├── DatePickerModal.jsx   # Date range picker
│   │       └── ExportModal.jsx       # Data export dialog (CSV, PDF, JSON)
│   ├── constants/
│   │   ├── dashboardData.js          # All metrics, points, and table data
│   │   └── navigation.js             # Menu navigation structure
│   ├── hooks/
│   │   └── useGSAPAnimation.js       # GSAP stagger, counter, and orb float hooks
│   ├── utils/
│   │   └── formatters.js             # Currency and number formatting
│   ├── App.jsx                       # Main application dashboard
│   ├── index.css                     # Tailwind CSS v4 & theme rules
│   └── main.jsx                      # React entrypoint
├── package.json
└── vite.config.js                    # Vite configuration with Tailwind CSS plugin
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
