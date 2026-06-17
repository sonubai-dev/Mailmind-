import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Sliders, 
  Terminal,
  Database,
  ArrowRight,
  UserPlus,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Contact } from '../../types';
import toast from 'react-hot-toast';

interface CSVImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingContacts: Contact[];
}

interface ParsedRow {
  raw: string[];
  [key: string]: any;
}

export default function CSVImporterModal({ isOpen, onClose, userId, existingContacts }: CSVImporterModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapping options
  const [mappings, setMappings] = useState({
    name: -1,
    email: -1,
    company: -1,
    tags: -1,
  });

  // Import configuration options
  const [duplicateBehavior, setDuplicateBehavior] = useState<'skip' | 'overwrite'>('skip');
  const [additionalTags, setAdditionalTags] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<'active' | 'unsubscribed' | 'bounced'>('active');

  // Import execution state
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  });

  // Standard CSV row parser to handle quotes, escapings and commas correctly
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSVContent = (content: string) => {
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('The CSV file appears to be empty.');
      return;
    }

    // Step 1: Extract headers & raw rows
    const firstLineFields = parseCSVLine(lines[0]);
    const parsedRows = lines.slice(1).map(line => ({
      raw: parseCSVLine(line)
    })).filter(row => row.raw.some(field => field !== ''));

    if (parsedRows.length === 0) {
      toast.error('No contact data rows found in this CSV.');
      return;
    }

    setHeaders(firstLineFields);
    setRows(parsedRows);

    // Step 2: Auto-map indices based on header keyword matching
    const mappingIndices = {
      name: -1,
      email: -1,
      company: -1,
      tags: -1,
    };

    firstLineFields.forEach((header, index) => {
      const lower = header.toLowerCase();
      if (lower.includes('name') || lower === 'fname' || lower === 'contact') {
        if (mappingIndices.name === -1) mappingIndices.name = index;
      } else if (lower.includes('email') || lower === 'mail' || lower === 'address') {
        if (mappingIndices.email === -1) mappingIndices.email = index;
      } else if (lower.includes('company') || lower.includes('org') || lower === 'work') {
        if (mappingIndices.company === -1) mappingIndices.company = index;
      } else if (lower.includes('tag') || lower.includes('segment') || lower.includes('label')) {
        if (mappingIndices.tags === -1) mappingIndices.tags = index;
      }
    });

    // If auto-mapping failed to locate email/name, look up indices by simple defaults
    if (mappingIndices.email === -1 && firstLineFields.length > 0) {
      // Find the first column containing an '@' in the first row as email fallback
      const rowSample = parsedRows[0]?.raw || [];
      const emailColIdx = rowSample.findIndex(v => v.includes('@'));
      if (emailColIdx !== -1) mappingIndices.email = emailColIdx;
      else mappingIndices.email = 0; // fallback to 1st col
    }

    if (mappingIndices.name === -1) {
      // mapping name to the column next to email
      mappingIndices.name = mappingIndices.email === 0 ? 1 : 0;
    }

    setMappings(mappingIndices);
    setStep(2);
  };

  const handleFileReader = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file (.csv extensions only)');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(selectedFile);
  };

  // Drag-and-drop Event Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileReader(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileReader(e.target.files[0]);
    }
  };

  // Process the Bulk Import sequentially to respect Firestore rate limits and update progress beautifully
  const startImport = async () => {
    if (mappings.name === -1 || mappings.email === -1) {
      toast.error('Name & Email columns must be mapped to proceed.');
      return;
    }

    setStep(3);
    setImporting(true);
    setProgress({ current: 0, total: rows.length });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const baseTags = additionalTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    // Index existing contacts by email for super-fast duplicate detection
    const contactsMap = new Map<string, Contact>();
    existingContacts.forEach(c => {
      contactsMap.set(c.email.toLowerCase().trim(), c);
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].raw;
      const email = row[mappings.email]?.trim() || '';
      const name = row[mappings.name]?.trim() || '';
      
      // Basic validation
      if (!email || !email.includes('@') || !name) {
        skippedCount++;
        setImportResults(prev => ({ ...prev, skipped: skippedCount }));
        setProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      const company = mappings.company !== -1 ? row[mappings.company]?.trim() : '';
      
      // Parse individual row tags
      const rowTags = mappings.tags !== -1 && row[mappings.tags]
        ? row[mappings.tags].split(/[;,|]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      // Combine row tags with global additional tags
      const combinedTags = Array.from(new Set([...rowTags, ...baseTags]));

      const contactKey = email.toLowerCase().trim();
      const existing = contactsMap.get(contactKey);

      try {
        if (existing) {
          if (duplicateBehavior === 'skip') {
            skippedCount++;
          } else {
            // Overwrite contact data
            const updatedData = {
              name,
              company: company || existing.company || '',
              tags: Array.from(new Set([...(existing.tags || []), ...combinedTags])),
              status: existing.status || defaultStatus,
              updatedAt: serverTimestamp()
            };

            try {
              await updateDoc(doc(db, 'contacts', existing.id), updatedData);
              updatedCount++;
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `contacts/${existing.id}`);
            }
          }
        } else {
          // Create new contact
          const newContact = {
            userId,
            name,
            email,
            company: company || '',
            tags: combinedTags,
            status: defaultStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          try {
            await addDoc(collection(db, 'contacts'), newContact);
            createdCount++;
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'contacts');
          }
        }
      } catch (err) {
        console.error(`Error importing email ${email}:`, err);
        errorCount++;
      }

      // Update intermediate state variables for UI reactive progress counters
      setImportResults({
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount
      });
      setProgress({ current: i + 1, total: rows.length });

      // Tiny delay for gorgeous visual progression feedback
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    setImporting(false);
    toast.success(`Successfully imported ${createdCount + updatedCount} contacts!`);
  };

  const handleDownloadSample = () => {
    const csvContent = "Name,Email,Company,Tags\nKartik Sharma,kartik@example.com,VentureLabs,\"vip, customer\"\nAnjali R,anjali@domain.com,DesignCorp,\"trial, designer\"";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mailmind_contacts_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample template downloaded!');
  };

  const resetAll = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMappings({ name: -1, email: -1, company: -1, tags: -1 });
    setDuplicateBehavior('skip');
    setAdditionalTags('');
    setImportResults({ created: 0, updated: 0, skipped: 0, errors: 0 });
    setImporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!importing ? onClose : undefined}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 z-10 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 select-none">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <Database size={20} className="text-indigo-600" />
              Bulk Import Subscribers
            </h2>
            <p className="text-xs text-slate-500 mt-1">Upload CSV format to sync list records directly to Database.</p>
          </div>
          {!importing && (
            <button 
              onClick={onClose}
              className="p-1 px-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-transform hover:rotate-90"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Multi-Step Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* STEP 1: Upload Zone */}
          {step === 1 && (
            <div className="space-y-6">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all ${
                  dragActive 
                    ? 'border-indigo-600 bg-indigo-50/20' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350'
                }`}
              >
                <input 
                  type="file"
                  id="csv-file-upload"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden" 
                />
                
                <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm animate-bounce">
                  <UploadCloud size={24} />
                </div>
                
                <h3 className="text-sm font-bold text-slate-800">Drag & drop your CSV file here</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                  Or <span className="text-indigo-600 font-bold underline">click to browse</span> from computer files. Make sure columns contain Name & Email identifiers.
                </p>
                
                <div className="mt-4 px-2 py-1 bg-slate-100/80 rounded-md text-[9px] text-slate-400 font-mono font-medium">
                  Supports .csv extension files
                </div>
              </div>

              {/* Sample and Requirements Panel */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 shrink-0 mt-0.5">
                    <Info size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">CSV Template Guidelines</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                      Required values: <strong>Name</strong> and <strong>Email</strong> columns. Optional values: Company, Tags. For columns containing commas in tags, please wrap them in double quotes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold text-[10px] rounded-lg shadow-sm transition-all"
                >
                  Download Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Previews, Mappings, Configuration */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              {/* File details summary */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/40 rounded-2xl border border-indigo-150">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{file?.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {(file?.size ? file.size / 1024 : 0).toFixed(1)} KB • {rows.length} records parsed
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1 transition-all"
                >
                  <RefreshCw size={12} />
                  Change File
                </button>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                  <Sliders size={12} />
                  Configure Column Mapping
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Name map selector */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Name *</div>
                      <div className="text-xs text-slate-500 mt-0.5">Required field</div>
                    </div>
                    <select
                      value={mappings.name}
                      onChange={e => setMappings({ ...mappings, name: Number(e.target.value) })}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-bold p-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer min-w-[120px]"
                    >
                      <option value={-1}>-- Select --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Email map selector */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address *</div>
                      <div className="text-xs text-slate-500 mt-0.5">Unique identifier</div>
                    </div>
                    <select
                      value={mappings.email}
                      onChange={e => setMappings({ ...mappings, email: Number(e.target.value) })}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-bold p-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer min-w-[120px]"
                    >
                      <option value={-1}>-- Select --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company map selector */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Office</div>
                      <div className="text-xs text-slate-500 mt-0.5">Optional column</div>
                    </div>
                    <select
                      value={mappings.company}
                      onChange={e => setMappings({ ...mappings, company: Number(e.target.value) })}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-bold p-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer min-w-[120px]"
                    >
                      <option value={-1}>-- None --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags map selector */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags Column</div>
                      <div className="text-xs text-slate-500 mt-0.5">Multiple tag split</div>
                    </div>
                    <select
                      value={mappings.tags}
                      onChange={e => setMappings({ ...mappings, tags: Number(e.target.value) })}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-bold p-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer min-w-[120px]"
                    >
                      <option value={-1}>-- None --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Import Preferences */}
              <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-indigo-600" />
                  Import Setup Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duplicates Rule */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Duplicate Emails rule</label>
                    <select
                      value={duplicateBehavior}
                      onChange={e => setDuplicateBehavior(e.target.value as any)}
                      className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="skip">Skip duplicates (Safe & Keeps history)</option>
                      <option value="overwrite">Overwrite with incoming CSV records</option>
                    </select>
                  </div>

                  {/* Default status */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Default Subscriber State</label>
                    <select
                      value={defaultStatus}
                      onChange={e => setDefaultStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="active">Active (Verified)</option>
                      <option value="unsubscribed">Unsubscribed (Opt-out)</option>
                      <option value="bounced">Bounced (Undeliverable)</option>
                    </select>
                  </div>
                </div>

                {/* Additional Master tags */}
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Attach Additional Tags to All Imported Records</label>
                  <input
                    type="text"
                    placeholder="e.g. jared_newsletter_june, import_lead_segment"
                    value={additionalTags}
                    onChange={e => setAdditionalTags(e.target.value)}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[9px] text-slate-400">Comma separated. Extracted tags will merge automatically.</span>
                </div>
              </div>

              {/* Parsed Preview Table */}
              <div className="space-y-2 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-2 text-[10px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 flex justify-between">
                  <span>First 3 Parsed preview rows</span>
                  <span>Row Index</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto">
                  {rows.slice(0, 3).map((item, rowIdx) => {
                    const mappedName = mappings.name !== -1 ? item.raw[mappings.name] : '—';
                    const mappedEmail = mappings.email !== -1 ? item.raw[mappings.email] : '—';
                    const mappedCompany = mappings.company !== -1 ? item.raw[mappings.company] : '—';
                    return (
                      <div key={rowIdx} className="px-4 py-3 flex justify-between items-center bg-white text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{mappedName || '—'}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{mappedEmail || '—'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-medium italic">{mappedCompany || '—'}</span>
                          <span className="text-[9px] font-black font-mono text-slate-300">#{rowIdx + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Execution Progress / Summary */}
          {step === 3 && (
            <div className="space-y-6 text-center py-6 animate-fadeIn select-none">
              <div className="relative mx-auto w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                {importing ? (
                  <RefreshCw className="w-10 h-10 animate-spin" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center p-2.5 shadow-sm">
                    <Check size={24} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {importing ? 'Processing Subscriber Bulk Upload...' : 'Bulk Upload Executed successfully!'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {importing 
                    ? `Synchronizing segment coordinates into database instances. Keep browser active...`
                    : `Your contact list dataset was parsed and imported cleanly to the database.`
                  }
                </p>
              </div>

              {/* Progress Slider Bar */}
              {importing && (
                <div className="max-w-md mx-auto space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-bold font-mono">
                    <span>Import Status</span>
                    <span>{progress.current} / {progress.total} Row Elements</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-75"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Analytics Report Grid */}
              <div className="max-w-md mx-auto grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150 shadow-sm mt-4">
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Created</span>
                  <span className="text-lg font-black text-emerald-600 mt-1 block">{importResults.created}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Updated</span>
                  <span className="text-lg font-black text-indigo-600 mt-1 block">{importResults.updated}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Skipped</span>
                  <span className="text-lg font-black text-slate-600 mt-1 block">{importResults.skipped}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Failed</span>
                  <span className="text-lg font-black text-rose-600 mt-1 block">{importResults.errors}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-4 border-t border-slate-100 flex gap-3 select-none">
          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-all"
            >
              Cancel
            </button>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-all"
              >
                Reset & Back
              </button>
              <button
                type="button"
                onClick={startImport}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
              >
                <UserPlus size={14} />
                <span>Begin Bulk Sync ({rows.length} Contacts)</span>
              </button>
            </>
          )}

          {step === 3 && !importing && (
            <button
              type="button"
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all"
            >
              Finish & Return
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
