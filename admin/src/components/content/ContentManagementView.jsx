import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CONTENT_NAV_ITEMS } from '../../constants/navigation';
import { logAuditEvent } from '../audit/AuditLogsView';
import {
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Pencil,
  RotateCcw,
  Code2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Eraser,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

// Default templates for AGF Cafe if not saved yet in Firestore
const DEFAULT_TEMPLATES = {
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
<p>We deliver across Beheragoda and surrounding localities within an <strong>8 km radius</strong> from our cafe location. If your address is outside our standard delivery zone, takeaway and self-pickup options are available.</p>

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

export const ContentManagementView = ({ initialPageId = 'privacy-policy', onSelectPage }) => {
  // Find current item from CONTENT_NAV_ITEMS
  const currentItem = useMemo(() => {
    return CONTENT_NAV_ITEMS.find((item) => item.id === initialPageId) || CONTENT_NAV_ITEMS[0];
  }, [initialPageId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [sourceCodeMode, setSourceCodeMode] = useState(false);
  const [content, setContent] = useState('');
  const originalContent = useRef('');
  const editorRef = useRef(null);

  // Load policy from Firestore
  useEffect(() => {
    async function loadPolicy() {
      setLoading(true);
      setError(null);
      setSaved(false);
      try {
        const docRef = doc(db, 'settings', currentItem.docId);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().content) {
          const loaded = snap.data().content;
          setContent(loaded);
          originalContent.current = loaded;
          if (snap.data().updatedAt) {
            setLastUpdated(snap.data().updatedAt.toDate());
          } else {
            setLastUpdated(null);
          }
        } else {
          // Use default template for this document
          const fallback = DEFAULT_TEMPLATES[currentItem.docId] || `<p>Write ${currentItem.label} here...</p>`;
          setContent(fallback);
          originalContent.current = fallback;
          setLastUpdated(null);
        }
        setHasChanges(false);
      } catch (err) {
        console.error('Failed to load page content:', err);
        setError('Failed to load content from database.');
      } finally {
        setLoading(false);
      }
    }

    loadPolicy();
  }, [currentItem.docId, currentItem.label]);

  // Sync editor content with contentEditable when content state changes
  useEffect(() => {
    if (editorRef.current && !sourceCodeMode && !previewMode) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content, sourceCodeMode, previewMode]);

  // Calculate words and read time
  const { wordCount, charCount, readTime } = useMemo(() => {
    const textOnly = content.replace(/<[^>]+>/g, ' ').trim();
    const words = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
    const chars = textOnly.length;
    const time = Math.max(1, Math.ceil(words / 180));
    return { wordCount: words, charCount: chars, readTime: time };
  }, [content]);

  const handleEditorInput = (e) => {
    const newHtml = e.currentTarget.innerHTML;
    setContent(newHtml);
    setHasChanges(newHtml !== originalContent.current);
    setSaved(false);
  };

  const handleSourceChange = (e) => {
    const newHtml = e.target.value;
    setContent(newHtml);
    setHasChanges(newHtml !== originalContent.current);
    setSaved(false);
  };

  // Formatting actions for rich editor
  const executeCommand = (command, value = null) => {
    if (sourceCodeMode || previewMode) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      const updated = editorRef.current.innerHTML;
      setContent(updated);
      setHasChanges(updated !== originalContent.current);
      setSaved(false);
    }
  };

  const handleInsertHeading = (tag) => {
    executeCommand('formatBlock', `<${tag}>`);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL (e.g. https://... or /menu):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleResetToTemplate = () => {
    const template = DEFAULT_TEMPLATES[currentItem.docId];
    if (!template) return;
    if (window.confirm(`Reset "${currentItem.label}" to AGF Cafe's standard verified template? Unsaved changes will be replaced.`)) {
      setContent(template);
      if (editorRef.current) {
        editorRef.current.innerHTML = template;
      }
      setHasChanges(true);
      setSaved(false);

      logAuditEvent({
        action: 'POLICY_RESET',
        details: `Reset "${currentItem.label}" to AGF Cafe standard verified template in editor`,
        category: 'Content',
        severity: 'warning',
        actor: 'Admin',
      });
    }
  };

  // Save to Firestore settings collection
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'settings', currentItem.docId);
      await setDoc(docRef, {
        content: content,
        updatedAt: serverTimestamp(),
      });
      originalContent.current = content;
      setHasChanges(false);
      setSaved(true);
      setLastUpdated(new Date());

      // Log event in System Audit Logs
      await logAuditEvent({
        action: 'POLICY_SAVED',
        details: `Saved & published revised policy "${currentItem.label}" (settings/${currentItem.docId})`,
        category: 'Content',
        severity: 'success',
        actor: 'Admin',
      });

      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('Failed to save content:', err);
      setError('Failed to save policy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] bg-slate-50/50 pb-12">
      {/* Top Header matching Grocery Hub Dashboard */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">
                  {currentItem.label}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  settings/{currentItem.docId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {lastUpdated
                  ? `Last updated: ${lastUpdated.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Default cafe template active (not yet saved to cloud)'}
              </p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Word count stats */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span>{wordCount} words</span>
              <span className="text-slate-300">•</span>
              <span>~{readTime} min read</span>
            </div>

            {/* Changes indicator */}
            {hasChanges && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Unsaved Changes
              </span>
            )}

            {saved && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Saved!
              </span>
            )}

            {/* Mode switchers */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPreviewMode(false);
                  setSourceCodeMode(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !previewMode && !sourceCodeMode
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" /> Visual
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode(false);
                  setSourceCodeMode(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceCodeMode
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> HTML
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode(true);
                  setSourceCodeMode(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 disabled:shadow-none cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>

        {/* Quick Navigation Pills for the 7 pages */}
        <div className="px-6 lg:px-8 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Pages:
          </span>
          {CONTENT_NAV_ITEMS.map((item) => {
            const isCurrent = item.id === currentItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-blue-600 shadow-xs border border-blue-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 lg:mx-8 mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Editor Wrapper */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Formatting Toolbar (Visible in Visual Mode) */}
          {!previewMode && !sourceCodeMode && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 select-none">
              <div className="flex flex-wrap items-center gap-1">
                {/* Heading selectors */}
                <button
                  type="button"
                  title="Paragraph"
                  onClick={() => handleInsertHeading('p')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  P
                </button>
                <button
                  type="button"
                  title="Heading 1"
                  onClick={() => handleInsertHeading('h1')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Heading 2"
                  onClick={() => handleInsertHeading('h2')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onClick={() => handleInsertHeading('h3')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Inline Styles */}
                <button
                  type="button"
                  title="Bold"
                  onClick={() => executeCommand('bold')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => executeCommand('italic')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Underline"
                  onClick={() => executeCommand('underline')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Strikethrough"
                  onClick={() => executeCommand('strikeThrough')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Lists & Quotes */}
                <button
                  type="button"
                  title="Bullet List"
                  onClick={() => executeCommand('insertUnorderedList')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onClick={() => executeCommand('insertOrderedList')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Blockquote"
                  onClick={() => handleInsertHeading('blockquote')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Horizontal Divider"
                  onClick={() => executeCommand('insertHorizontalRule')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Insert Link"
                  onClick={handleInsertLink}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Remove Formatting"
                  onClick={() => executeCommand('removeFormat')}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Template Reset Button */}
              <button
                type="button"
                onClick={handleResetToTemplate}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition cursor-pointer"
                title="Reset to default cafe template"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Reset Template
              </button>
            </div>
          )}

          {/* Editor Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Loading policy content...</p>
            </div>
          ) : previewMode ? (
            /* Live Preview Screen */
            <div className="p-8 lg:p-12 min-h-[550px] bg-white">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                    Live Customer Preview
                  </span>
                  <p className="text-xs text-slate-400 mt-1">This is how your customers see this document on the public store.</p>
                </div>
                <a
                  href={`http://localhost:5174${currentItem.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  Open in store <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div
                className="content-typography"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          ) : sourceCodeMode ? (
            /* Raw HTML Mode */
            <div className="p-4">
              <textarea
                value={content}
                onChange={handleSourceChange}
                rows={22}
                className="w-full font-mono text-xs leading-relaxed p-4 bg-slate-900 text-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 border border-slate-800 resize-y"
                placeholder="Enter HTML markup here..."
              />
            </div>
          ) : (
            /* Rich ContentEditable Visual Mode */
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              className="p-8 lg:p-12 min-h-[550px] focus:outline-hidden content-typography"
              data-placeholder="Start typing your policy content here..."
            />
          )}
        </div>
      </div>

      {/* Scoped CSS for Content Typography */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
          pointer-events: none;
        }
        .content-typography {
          color: #334155;
          font-size: 0.95rem;
          line-height: 1.75;
          font-family: inherit;
        }
        .content-typography h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .content-typography h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        .content-typography h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #334155;
          margin-top: 1.25rem;
          margin-bottom: 0.35rem;
        }
        .content-typography p {
          margin-bottom: 1rem;
          color: #475569;
        }
        .content-typography ul {
          list-style-type: disc;
          padding-left: 1.75rem;
          margin-bottom: 1rem;
        }
        .content-typography ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
          margin-bottom: 1rem;
        }
        .content-typography li {
          margin-bottom: 0.35rem;
          color: #475569;
        }
        .content-typography blockquote {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
          padding: 0.85rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.75rem 0.75rem 0;
          color: #1e3a8a;
          font-style: italic;
        }
        .content-typography a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 600;
        }
        .content-typography hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 1.75rem 0;
        }
        .content-typography strong {
          color: #0f172a;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
export default ContentManagementView;
