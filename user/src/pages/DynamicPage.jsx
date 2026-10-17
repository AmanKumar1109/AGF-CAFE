import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Clock, FileText, ChevronRight, Home, ShieldCheck, ArrowRight, Utensils } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Comprehensive default policies for AGF Cafe
const DEFAULT_POLICIES = {
  privacyPolicy: `
<h1>Privacy Policy for AGF CAFE</h1>
<p><strong>Effective Date:</strong> January 1, 2026</p>
<p>Welcome to <strong>AGF CAFE</strong> ("we", "our", or "us"), located in Beheragoda, Jharkhand. We respect your privacy and are committed to protecting any personal data you share with us through our website, mobile application, or offline dine-in and takeaway ordering services.</p>

<h2>1. Information We Collect</h2>
<p>When you interact with AGF Cafe, we may collect the following information:</p>
<ul>
  <li><strong>Contact Details:</strong> Your full name, phone number, and email address for order verification and notification.</li>
  <li><strong>Delivery Address:</strong> House/flat number, street, landmark, and GPS coordinates to ensure fast food delivery.</li>
  <li><strong>Order History:</strong> Past orders, preferred dishes, loyalty reward points, and discount voucher redemption.</li>
  <li><strong>Feedback & Reviews:</strong> Ratings, reviews, and support complaints submitted to help us improve our service.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use your information strictly for the following purposes:</p>
<ul>
  <li>To prepare, package, and deliver your food orders accurately and on time.</li>
  <li>To send real-time order status updates via SMS and WhatsApp.</li>
  <li>To credit loyalty cashback points and notify you about exclusive seasonal offers.</li>
  <li>To resolve any complaints or customer service queries promptly.</li>
</ul>

<h2>3. Data Protection & Security</h2>
<p>We do not sell, rent, or trade your personal information with any third-party marketing agencies. All online payment transactions are processed through RBI-approved secure payment gateways with SSL encryption. AGF Cafe does not store your card PIN or net-banking passwords.</p>

<h2>4. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please reach out to us:</p>
<blockquote>
  <p><strong>AGF CAFE</strong><br/>
  Main Boulevard, Beheragoda, Jharkhand - 832101<br/>
  Phone: +91 98765 43210 | Email: hello@agfcafe.in</p>
</blockquote>
`,

  termsOfService: `
<h1>Terms & Conditions</h1>
<p><strong>Last Updated:</strong> January 1, 2026</p>
<p>Please read these Terms and Conditions ("Terms") carefully before using the online ordering system or visiting <strong>AGF CAFE</strong> ("Cafe"). By placing an order via our website or visiting our outlet in Beheragoda, you agree to be bound by these terms.</p>

<h2>1. Orders & Pricing</h2>
<ul>
  <li>All menu items are subject to availability. In rare cases where an item or ingredient is sold out, our team will contact you to offer a suitable replacement or instant refund.</li>
  <li>All prices displayed are in Indian Rupees (INR) and inclusive of applicable taxes unless specified otherwise.</li>
  <li>Menu prices and promotional combos are subject to change without prior notice.</li>
</ul>

<h2>2. Food Quality & Fresh Preparation</h2>
<p>Every dish at AGF Cafe is prepared freshly upon order confirmation. To experience the best flavor and texture, we strongly advise consuming our hot items (burgers, pizzas, pasta, fries) immediately upon delivery or dine-in service.</p>

<h2>3. Customer Conduct</h2>
<p>We are dedicated to providing a warm, family-friendly, and safe environment for all guests and staff. AGF Cafe reserves the right to refuse service to anyone demonstrating inappropriate or abusive behavior.</p>

<h2>4. Limitation of Liability</h2>
<p>AGF Cafe will not be liable for any delayed deliveries resulting from severe weather conditions, road closures, or incorrect address information provided by the customer.</p>

<h2>5. Jurisdiction</h2>
<p>These terms shall be governed by and construed in accordance with the laws of India, under the exclusive jurisdiction of the courts of Baharagora / East Singhbhum, Jharkhand.</p>
`,

  refundPolicy: `
<h1>Refund & Returns Policy</h1>
<p>At <strong>AGF CAFE</strong>, our top priority is serving you delicious, fresh, and hygienic food. Because our items are freshly prepared food and beverages, traditional returns cannot be accepted once delivered. However, we have a clear and fair refund policy in place.</p>

<h2>1. Eligibility for Refunds</h2>
<p>You may be eligible for a full or partial refund or replacement under the following circumstances:</p>
<ul>
  <li><strong>Incorrect Item Delivered:</strong> If you received an item different from what was ordered.</li>
  <li><strong>Missing Items:</strong> If any item from your prepaid order was not packed in the delivery parcel.</li>
  <li><strong>Quality Issues:</strong> If the food is spoiled, damaged in transit, or fails our hygienic standards (photo proof may be required within 30 minutes of delivery).</li>
  <li><strong>Order Cancellation:</strong> If an order is cancelled before kitchen preparation starts.</li>
</ul>

<h2>2. Non-Refundable Scenarios</h2>
<ul>
  <li>Dislike of taste or personal preference without any defect in the dish.</li>
  <li>Orders delivered to an incorrect address entered by the customer.</li>
  <li>Delivery refused upon arrival by customer after rider reached location.</li>
</ul>

<h2>3. Refund Timelines & Mode</h2>
<ul>
  <li><strong>UPI / Netbanking / Debit Cards:</strong> Processed within 3 to 5 business days back to your original source account.</li>
  <li><strong>Cafe Wallet / Credits:</strong> Issued instantly and valid on all future orders.</li>
  <li><strong>Cash on Delivery (COD):</strong> Resolved via UPI transfer or store credit upon verification.</li>
</ul>

<p>To report an issue, please contact our support team at <strong>+91 98765 43210</strong> or lodge a ticket via the <em>Customer Lounge &gt; Complaints</em> section.</p>
`,

  cancellationPolicy: `
<h1>Cancellation Policy</h1>
<p>We understand that plans can change. Here is how order cancellations work at <strong>AGF CAFE</strong>:</p>

<h2>1. Cancellation Before Kitchen Preparation</h2>
<p>You can cancel your order free of charge within <strong>2 minutes</strong> of placing it, or until the cafe staff marks the order as <em>"In Kitchen / Preparing"</em>. If you paid online, a 100% refund will be issued immediately.</p>

<h2>2. Cancellation After Kitchen Preparation Begins</h2>
<p>Once our chefs begin cooking your fresh meal, cancellation cannot be processed because fresh perishable food cannot be resold or re-cooked. In this case, the order amount will be charged.</p>

<h2>3. Out for Delivery Orders</h2>
<p>Orders that are already with the delivery rider cannot be cancelled. Please ensure someone is available at the delivery location to receive the parcel.</p>

<h2>4. Cancellations by AGF Cafe</h2>
<p>In rare situations, AGF Cafe may have to cancel an order due to unforeseen circumstances (e.g., ingredient stock-out, kitchen emergency, extreme weather). In such cases, we will inform you immediately and provide a 100% full refund.</p>
`,

  disclaimer: `
<h1>Food & Allergen Disclaimer</h1>
<p>Welcome to <strong>AGF CAFE</strong>. Please review the following health and nutritional disclaimers regarding our menu items:</p>

<h2>1. Allergen Information</h2>
<p>Our cafe kitchen handles various allergens including:</p>
<ul>
  <li><strong>Dairy:</strong> Milk, cheese, butter, and cream used in pizzas, shakes, and pasta sauces.</li>
  <li><strong>Gluten / Wheat:</strong> Brioche buns, pizza dough, pasta, and bread crumbs.</li>
  <li><strong>Nuts & Seeds:</strong> Certain desserts, shakes, and pesto sauces may contain or come into contact with tree nuts or sesame seeds.</li>
  <li><strong>Soy & Mustard:</strong> Condiments and dressings.</li>
</ul>
<p>If you or someone in your dining party has a severe food allergy, please notify our team before placing your order. While we follow strict cross-contamination prevention measures, we cannot guarantee a 100% allergen-free kitchen.</p>

<h2>2. Images & Presentation</h2>
<p>Photographs displayed on our website and digital menus are for illustrative and presentation purposes. Actual food garnishing, packaging style, and dish presentation may vary slightly.</p>

<h2>3. Operational Hours</h2>
<p>Delivery and kitchen timings may be modified during holidays or local festivals. Last kitchen orders are accepted 30 minutes before closing time.</p>
`,

  shippingPolicy: `
<h1>Shipping & Delivery Policy</h1>
<p>At <strong>AGF CAFE</strong>, we strive to deliver hot, sizzling, and mouth-watering cafe favorites right to your doorstep in Baharagora.</p>

<h2>1. Delivery Areas & Radius</h2>
<p>We deliver fresh food across Baharagora and surrounding localities within our active cafe delivery zone from our central kitchen. If your address is outside our delivery zone, takeaway and self-pickup options are always available.</p>

<h2>2. Estimated Delivery Time</h2>
<ul>
  <li><strong>Standard Delivery:</strong> 25 to 40 minutes depending on kitchen volume and distance.</li>
  <li><strong>Peak Hours / Weekends:</strong> Delivery may take an additional 10 to 15 minutes to guarantee thorough food preparation.</li>
  <li><strong>Rain / Adverse Weather:</strong> We prioritize rider safety; slight delays may occur during torrential rains.</li>
</ul>

<h2>3. Packaging & Quality</h2>
<p>All items are packed in eco-friendly food-grade thermal containers to preserve optimal temperature, crispiness, and aroma from our kitchen to your hands.</p>

<h2>4. Delivery Charges</h2>
<p>A standard nominal delivery fee applies to cover logistics. Free delivery is available on orders exceeding <strong>₹299</strong>.</p>
`,

  aboutUs: `
<h1>About AGF CAFE</h1>
<p><strong>Good Food • Happy Mood</strong></p>
<p>Welcome to <strong>AGF CAFE</strong>, Beheragoda's favorite casual hangout for gourmet food, specialty coffees, and refreshing desserts.</p>

<h2>Our Journey</h2>
<p>Started with a passion for bringing modern cafe culture to Beheragoda, AGF CAFE was built to be a warm community hub. Whether you are catching up with friends over loaded nachos, working remotely with a chilled hazelnut frappe, or celebrating birthdays with our handcrafted pizzas, our doors are always open.</p>

<h2>What Sets Us Apart</h2>
<ul>
  <li><strong>Artisanal Brioche Burgers:</strong> Hand-shaped patties grilled to perfection with authentic herbs and house sauces.</li>
  <li><strong>Stone-Baked Pizzas:</strong> Slow-fermented dough topped with real mozzarella and rich tomato marinara.</li>
  <li><strong>Thick Shakes & Mocktails:</strong> Blended fresh with whole milk, premium scoops, and real fruit purees.</li>
  <li><strong>Unmatched Hygiene:</strong> 5-star kitchen sanitation standards with zero compromises on food safety.</li>
</ul>

<h2>Visit Us</h2>
<blockquote>
  <p><strong>AGF CAFE</strong><br/>
  Main Boulevard, Near Shitla Mandir, Baharagora, Jharkhand - 832101<br/>
  Open Daily: 10:00 AM – 11:30 PM | Helpline: +91 98765 43210</p>
</blockquote>
`,
};

export default function DynamicPage({ documentId, title }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [readingTime, setReadingTime] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchPage() {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', documentId);
        const snap = await getDoc(docRef);

        if (snap.exists() && snap.data().content) {
          const htmlContent = snap.data().content;
          setContent(htmlContent);

          const textOnly = htmlContent.replace(/<[^>]+>/g, ' ');
          const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;
          setReadingTime(Math.max(1, Math.ceil(wordCount / 180)));

          if (snap.data().updatedAt) {
            setLastUpdated(snap.data().updatedAt.toDate());
          }
        } else {
          // Fallback to rich cafe default template
          const fallback = DEFAULT_POLICIES[documentId] || `<h1>${title}</h1><p>Content for ${title} will be published shortly.</p>`;
          setContent(fallback);
          const textOnly = fallback.replace(/<[^>]+>/g, ' ');
          const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;
          setReadingTime(Math.max(1, Math.ceil(wordCount / 180)));
        }
      } catch (err) {
        console.error('Failed to load dynamic page content:', err);
        const fallback = DEFAULT_POLICIES[documentId] || `<h1>${title}</h1><p>Failed to connect to server. Please try again.</p>`;
        setContent(fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [documentId, title]);

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans text-stone-900 selection:bg-amber-200 selection:text-amber-950">
      {/* Hero Header matching AGF Cafe Luxury Aesthetic */}
      <div className="relative pt-24 pb-16 bg-gradient-to-b from-[#0a0b0e] via-[#12141a] to-[#0a0b0e] text-white overflow-hidden border-b border-stone-800">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px] translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[11px] font-bold text-amber-300/80 mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3 h-3 text-stone-600" />
            <span className="text-stone-300">{title}</span>
          </nav>

          {/* Page Title & Subtitle */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>AGF CAFE Legal & Guidelines</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-serif text-white tracking-tight drop-shadow-md">
              {title}
            </h1>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-stone-400">
              {lastUpdated ? (
                <div className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800 text-stone-300">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Last Updated: {lastUpdated.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800 text-stone-300">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Policy</span>
                </div>
              )}

              {readingTime > 0 && (
                <div className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800 text-stone-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Floating Paper Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/80 p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Luxury Gold Accent Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin relative z-10" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Loading Cafe Policy...
              </p>
            </div>
          ) : (
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Bottom Card Action Footer */}
          <div className="mt-12 pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-stone-900">Have questions about our menu or service?</p>
                <p className="text-xs text-stone-500">Call our cafe helpline at +91 98765 43210</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/menu')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-stone-950 text-white hover:bg-amber-500 hover:text-stone-950 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md"
            >
              <span>Explore Our Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Scoped CSS for Clean Luxury Typography in Dynamic Page */}
      <style>{`
        .prose-content {
          color: #334155;
          font-size: 0.975rem;
          line-height: 1.8;
        }
        .prose-content h1 {
          font-family: serif;
          font-size: 2rem;
          font-weight: 900;
          color: #1c1917;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
          letter-spacing: -0.015em;
        }
        .prose-content h2 {
          font-family: serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: #292524;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.35;
          border-bottom: 1px solid #f5f5f4;
          padding-bottom: 0.35rem;
        }
        .prose-content h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #44403c;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .prose-content p {
          margin-bottom: 1rem;
          color: #44403c;
        }
        .prose-content ul {
          list-style-type: disc;
          padding-left: 1.75rem;
          margin-bottom: 1.25rem;
        }
        .prose-content ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
          margin-bottom: 1.25rem;
        }
        .prose-content li {
          margin-bottom: 0.4rem;
          color: #44403c;
        }
        .prose-content strong {
          color: #1c1917;
          font-weight: 700;
        }
        .prose-content blockquote {
          border-left: 4px solid #d97706;
          background: #fffbeb;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          border-radius: 0 1rem 1rem 0;
          color: #92400e;
        }
        .prose-content a {
          color: #d97706;
          text-decoration: underline;
          font-weight: 600;
        }
        .prose-content hr {
          border: none;
          border-top: 1px solid #e7e5e4;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
