import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Save, 
  RotateCcw, 
  Send, 
  Eye, 
  Code2, 
  CheckCircle, 
  Clock, 
  UtensilsCrossed, 
  Bike, 
  XCircle, 
  Sparkles,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { DEFAULT_TEMPLATES, EMAIL_WRAPPER, renderEmailContent, formatOrderItems } from '../../utils/emailTemplates';
import { logAuditEvent } from '../audit/AuditLogsView';

export const NotificationsView = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [senderSettings, setSenderSettings] = useState({
    senderName: 'AGF CAFE',
    senderEmail: 'agfcafe01@gmail.com',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview'
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load templates from Firestore on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const notifDocRef = doc(db, 'settings', 'notifications');
        const notifSnap = await getDoc(notifDocRef);

        if (notifSnap.exists()) {
          const data = notifSnap.data();
          if (data.templates) {
            setTemplates({ ...DEFAULT_TEMPLATES, ...data.templates });
          }
          if (data.senderName || data.senderEmail) {
            setSenderSettings({
              senderName: data.senderName || 'AGF CAFE',
              senderEmail: data.senderEmail || 'agfcafe01@gmail.com',
            });
          }
        } else {
          // Initialize in Firestore with defaults
          await setDoc(notifDocRef, {
            templates: DEFAULT_TEMPLATES,
            senderName: 'AGF CAFE',
            senderEmail: 'agfcafe01@gmail.com',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setTemplates(DEFAULT_TEMPLATES);
        }
      } catch (err) {
        console.error("Error fetching notification templates:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateChange = (field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [field]: value,
      },
    }));
  };

  const insertPlaceholder = (placeholder) => {
    const currentBody = templates[activeTab]?.body || '';
    handleTemplateChange('body', currentBody + (currentBody.endsWith(' ') ? '' : ' ') + placeholder);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const notifDocRef = doc(db, 'settings', 'notifications');
      await updateDoc(notifDocRef, {
        templates,
        senderName: senderSettings.senderName.trim() || 'AGF CAFE',
        senderEmail: senderSettings.senderEmail.trim() || 'agfcafe01@gmail.com',
        updatedAt: serverTimestamp(),
      });

      setStatusMessage({ type: 'success', text: 'Email notification templates saved successfully!' });
      setTimeout(() => setStatusMessage(null), 4000);

      // Record System Audit Log
      await logAuditEvent({
        action: 'EMAIL_TEMPLATES_UPDATED',
        details: `Updated automated email notification templates & sender configurations`,
        category: 'Settings',
        severity: 'info',
        actor: 'Admin',
      });
    } catch (err) {
      console.error("Failed to save templates:", err);
      setStatusMessage({ type: 'error', text: 'Failed to save templates. Please check connection.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all email templates to their luxury cafe defaults? Current customizations will be overwritten."
    );
    if (!confirmed) return;

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const notifDocRef = doc(db, 'settings', 'notifications');
      await updateDoc(notifDocRef, {
        templates: DEFAULT_TEMPLATES,
        updatedAt: serverTimestamp(),
      });
      setTemplates(DEFAULT_TEMPLATES);
      setStatusMessage({ type: 'success', text: 'All templates reset to luxury defaults!' });
      setTimeout(() => setStatusMessage(null), 4000);

      // Record System Audit Log
      await logAuditEvent({
        action: 'EMAIL_TEMPLATES_RESET',
        details: `Reset email notification templates to system default designs`,
        category: 'Settings',
        severity: 'warning',
        actor: 'Admin',
      });
    } catch (err) {
      console.error("Failed to reset templates:", err);
      setStatusMessage({ type: 'error', text: 'Failed to reset templates.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Send a real test email
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid email address.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const currentTemplate = templates[activeTab] || DEFAULT_TEMPLATES[activeTab];
      const dummyOrderItems = formatOrderItems(
        [
          { name: 'Signature Hazelnut Latte', price: 180, quantity: 2 },
          { name: 'Artisan Grilled Chicken Panini', price: 290, quantity: 1 },
          { name: 'Belgium Dark Truffle Cake', price: 190, quantity: 1 },
        ],
        840,
        'Flat 402, Golden Oak Residency, Green Park, Jamshedpur - 831001',
        50,
        30
      );

      const rendered = renderEmailContent(currentTemplate, {
        customerName: 'Aman Kumar (Test Recipient)',
        email: testEmail.trim(),
        orderId: 'AGF-TEST-8492',
        amount: '840.00',
        address: 'Flat 402, Golden Oak Residency, Green Park, Jamshedpur - 831001',
        time: new Date().toLocaleString('en-IN'),
        cancelReason: 'Customer requested cancellation due to change of schedule',
        orderItemsHtml: dummyOrderItems,
      });

      await addDoc(collection(db, 'mail'), {
        to: testEmail.trim(),
        from: `"${senderSettings.senderName}" <${senderSettings.senderEmail}>`,
        message: {
          subject: `[TEST] ${rendered.subject}`,
          html: rendered.html,
        },
        isTestEmail: true,
        templateKey: activeTab,
        queuedAt: serverTimestamp(),
      });

      setTestResult({
        success: true,
        message: `Test email queued for ${testEmail.trim()}! Please check your inbox or spam folder in a moment.`,
      });

      // Record Audit Log
      await logAuditEvent({
        action: 'TEST_EMAIL_SENT',
        details: `Dispatched test email for "${activeTab}" template to ${testEmail.trim()}`,
        category: 'Settings',
        severity: 'info',
        actor: 'Admin',
      });
    } catch (err) {
      console.error("Test email send failed:", err);
      setTestResult({ success: false, message: 'Failed to send test email. Check console.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const tabs = [
    { id: 'Welcome', label: 'Welcome (New Signup)', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'Pending', label: 'Order Received', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Preparing', label: 'Cooking in Kitchen', icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Out for delivery', label: 'Out for Delivery', icon: Bike, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Cancelled', label: 'Order Cancelled', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const placeholders = [
    { id: '[Customer Name]', label: 'Customer Name' },
    { id: '[Email]', label: 'Email' },
    { id: '[Order ID]', label: 'Order ID' },
    { id: '[Amount]', label: 'Total Amount' },
    { id: '[Address]', label: 'Delivery Address' },
    { id: '[Time]', label: 'Order Time' },
    { id: '[Cancel Reason]', label: 'Cancel Reason' },
    { id: '[Order Items]', label: 'Order Items Table' },
  ];

  const currentTemplate = templates[activeTab] || DEFAULT_TEMPLATES[activeTab] || { subject: '', body: '' };

  // Generate preview HTML
  const previewData = renderEmailContent(currentTemplate, {
    customerName: 'Aman Kumar',
    email: 'customer@example.com',
    orderId: 'AGF-789210',
    amount: '650.00',
    address: 'Bungalow 12, Boulevard Road, Bistupur, Jamshedpur - 831001',
    time: new Date().toLocaleString('en-IN'),
    cancelReason: 'Customer requested order cancellation',
    orderItemsHtml: formatOrderItems(
      [
        { name: 'Artisan Spanish Latte', price: 210, quantity: 1 },
        { name: 'Classic Chicken Club Sandwich', price: 260, quantity: 1 },
        { name: 'Dark Chocolate Lava Pastry', price: 180, quantity: 1 },
      ],
      650,
      'Bungalow 12, Boulevard Road, Bistupur, Jamshedpur - 831001',
      0,
      0
    ),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Email Templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Email Notifications</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated customer lifecycle emails (Welcome, Orders, Kitchen, Delivery, Feedback)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsTestModalOpen(true);
              setTestResult(null);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4 text-amber-600" />
            <span>Send Test Email</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            title="Reset to luxury default templates"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Left Tabs & Sender Settings | Right Template Editor/Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Tabs + Sender Configuration) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-3 pt-2">
              Automated Email Events
            </p>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/15'
                      : 'hover:bg-slate-50 text-slate-700 font-bold border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-black/15 text-stone-950' : `${tab.bg} ${tab.color}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{tab.label}</p>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-stone-900/80 font-medium' : 'text-slate-400 font-normal'
                      }`}
                    >
                      {tab.id === 'Welcome' && 'Sent upon customer registration'}
                      {tab.id === 'Pending' && 'Sent right after checkout placement'}
                      {tab.id === 'Preparing' && 'Sent when kitchen begins order'}
                      {tab.id === 'Out for delivery' && 'Sent when rider is dispatched'}
                      {tab.id === 'Delivered' && 'Sent when handover PIN verified'}
                      {tab.id === 'Cancelled' && 'Sent when order is cancelled'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sender Details Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>Sender Identity (From Header)</span>
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sender Brand Name</label>
              <input
                type="text"
                value={senderSettings.senderName}
                onChange={(e) => setSenderSettings({ ...senderSettings, senderName: e.target.value })}
                placeholder="AGF CAFE"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sender Email Address</label>
              <input
                type="email"
                value={senderSettings.senderEmail}
                onChange={(e) => setSenderSettings({ ...senderSettings, senderEmail: e.target.value })}
                placeholder="agfcafe01@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Processed via Firebase Trigger Email extension / SMTP.
              </p>
            </div>
          </div>

          {/* Pro Tip Card */}
          <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider text-amber-950">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Branded Email Container</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
              All messages are automatically wrapped inside the luxury <strong>AGF CAFE</strong> HTML template with header branding, order receipts, and customer support links!
            </p>
          </div>
        </div>

        {/* Right Column: Template Editor & Live Preview */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Editor Header Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Edit "{tabs.find((t) => t.id === activeTab)?.label}" Template</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customize the email subject, message body, and dynamic order variables.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'editor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>

          {/* View Mode Content */}
          {viewMode === 'editor' ? (
            <div className="p-6 space-y-6 flex-1">
              {/* Subject Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Email Subject Line
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(currentTemplate.subject || '').length} characters
                  </span>
                </div>
                <input
                  type="text"
                  value={currentTemplate.subject || ''}
                  onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  placeholder="e.g. Order Received – AGF CAFE #[Order ID]"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-xs"
                />
              </div>

              {/* Dynamic Placeholders Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Insert Dynamic Placeholders
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Click chip to append to body</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                  {placeholders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => insertPlaceholder(p.id)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 hover:border-amber-300 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-xl text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer"
                      title={`Append ${p.label}`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Body Message */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Email Body Content
                </label>
                <textarea
                  value={currentTemplate.body || ''}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  placeholder="Type your email content here..."
                  rows={14}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-mono leading-relaxed whitespace-pre-wrap resize-y shadow-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Line breaks are converted to clean email spacing. You can also use standard HTML such as{' '}
                  <code className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">&lt;strong&gt;</code>,{' '}
                  <code className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">&lt;div class="highlight"&gt;</code>
                  , or emojis.
                </p>
              </div>
            </div>
          ) : (
            /* Live HTML Preview inside Iframe / Sandboxed View */
            <div className="p-6 bg-slate-100 flex-1 flex flex-col">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Preview Subject</span>
                  <span className="font-bold text-slate-800">{previewData.subject}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  Sample Data
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden flex-1 min-h-[520px]">
                <iframe
                  title="Live Email Preview"
                  srcDoc={previewData.html}
                  className="w-full h-full min-h-[520px] border-none"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Test Email Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Send Test Email</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Test how the <strong>"{tabs.find((t) => t.id === activeTab)?.label}"</strong> email looks in a real inbox. Enter your email below to send a sample test.
            </p>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
