import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useTemplateStore, Template } from '../store/templateStore';
import { 
  Plus, 
  Search, 
  Layout as LayoutIcon, 
  Copy, 
  Trash2, 
  Edit3, 
  Sparkles,
  Tag,
  Clock,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import TemplateEditor from '../components/templates/TemplateEditor';
import TemplatePreviewModal from '../components/templates/TemplatePreviewModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const { templates, setTemplates } = useTemplateStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'templates'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Template[];
      setTemplates(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'templates');
    });
    
    return () => unsubscribe();
  }, [user]);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      onConfirm: async () => {
        try {
          try {
            await deleteDoc(doc(db, 'templates', id));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
          }
          toast.success('Template deleted');
        } catch (e: any) {
          console.error(e);
          toast.error('Failed to delete template');
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (templates.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete All Templates',
      message: `You are about to delete all ${templates.length} templates. This action is permanent and will remove all your saved marketing copies. Proceed?`,
      onConfirm: async () => {
        try {
          const promises = templates.map(async (t) => {
            try {
              await deleteDoc(doc(db, 'templates', t.id));
            } catch (error) {
              handleFirestoreError(error, OperationType.DELETE, `templates/${t.id}`);
            }
          });
          await Promise.all(promises);
          toast.success('All templates deleted');
        } catch (e: any) {
          console.error(e);
          toast.error('Failed to clear templates');
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">Email Templates</h1>
          <p className="text-slate-500">Save and reuse your best marketing copy.</p>
        </div>
        <div className="flex items-center gap-3">
          {templates.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-3 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all"
            >
              <Trash2 size={20} />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}
          <button 
            onClick={() => {
              setEditingTemplate(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-8 relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-600/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-600/5"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                 {template.aiGenerated ? (
                   <Sparkles className="text-purple-600 w-5 h-5" />
                 ) : (
                   <LayoutIcon className="text-indigo-600 w-5 h-5" />
                 )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-100">
                  {template.category}
                </span>
                {template.aiGenerated && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded border border-purple-100">
                    AI Created
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {template.subject}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsPreviewOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Preview Template"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsEditorOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Edit Template"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Template"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                   <Clock size={12} />
                   {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {templates.length === 0 && (
         <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <div className="w-20 h-20 bg-white shadow-xl shadow-indigo-600/5 rounded-full flex items-center justify-center mb-6 border border-slate-100">
              <LayoutIcon size={32} className="opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">No templates yet</p>
            <p className="text-sm mb-6">Create your first template to get started</p>
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-2"
            >
              <Plus size={16} /> Create template
            </button>
         </div>
      )}

      {isEditorOpen && (
        <TemplateEditor 
          onClose={() => setIsEditorOpen(false)} 
          template={editingTemplate} 
        />
      )}

      {isPreviewOpen && selectedTemplate && (
        <TemplatePreviewModal 
          template={selectedTemplate}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
