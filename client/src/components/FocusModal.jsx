import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  X, Bold, Italic, Heading1, Heading2,
  List, CheckSquare, Image as ImageIcon, Clock,
} from 'lucide-react';
import { useNoteHistory } from '../hooks/useNoteHistory.js';


const ToolBtn = ({ onClick, active, title, disabled, children }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      active ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    {children}
  </button>
);


const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}d yang lalu`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j yang lalu`;
  return `${Math.floor(diff / 86400)} hari yang lalu`;
};


export default function FocusModal({ note, canEdit = true, onClose, onSave }) {
  const titleRef = useRef(null);
  const { history, loading: histLoading, fetchHistory } = useNoteHistory();

  
  useEffect(() => {
    if (note.id) fetchHistory(note.id);
  }, [note.id, fetchHistory]);

  
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList.configure({ HTMLAttributes: { class: 'task-list pl-0' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-item flex items-center gap-3' } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' },
      }),
      Image.configure({
        allowBase64: true,  
        HTMLAttributes: { class: 'rounded-xl max-w-full my-3' },
      }),
    ],
    content: note.content || '',
    editable: canEdit,
    editorProps: {
      attributes: {
        class: `outline-none min-h-[180px] text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none ${
          !canEdit ? 'cursor-default select-text' : ''
        }`,
      },
    },
  });

  
  useEffect(() => {
    if (!editor) return;

    const nextContent = note?.content || '';
    const nextTitle = note?.title || '';

    console.log('[FocusModal] Reset editor untuk note baru/edit:', {
      noteId: note?.id,
      contentLength: nextContent.length,
      hasImage: nextContent.includes('<img'),
      title: nextTitle,
    });

    editor.commands.setContent(nextContent);
    if (titleRef.current) {
      titleRef.current.value = nextTitle;
    }
  }, [note?.id, note?.content, note?.title, editor]);

  const isEmptyContent = (html) => {
    if (!html) return true;
    
    if (html.includes('<img')) return false;
    
    const normalized = html
      .replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/<!--.*?-->/g, '')
      .replace(/<[^>]*>/g, '')  
      .trim();
    return normalized === '';
  };

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    
    const content = isEmptyContent(html) ? '' : html;

    
    const contentLength = content.length;
    const hasImage = content.includes('<img');
    console.log('[FocusModal Save]', {
      noteId: note.id,
      contentLength,
      hasImage,
      contentPreview: content.substring(0, 100),
    });

    try {
      const result = await onSave(note.id, {
        title:   titleRef.current?.value ?? note.title,
        content,  
      });
      console.log('[FocusModal Save Response]', {
        returnedContentLength: result?.content?.length || 0,
        hasImageInResponse: result?.content?.includes('<img') || false,
      });
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan catatan:', err);
    }
  }, [editor, note, onSave, onClose]);

  const handleToggleChecklist = async (itemId) => {
    if (!canEdit) return;
    const nextChecklist = (note.checklist || []).map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    await onSave(note.id, { checklist: nextChecklist });
  };

  
  
  
  const handleToggleCheckbox = () => {
    if (!editor || !canEdit) return;

    
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const blockStart = $from.start();
    const blockEnd = $from.end();
    const cursorOffsetInBlock = selection.from - blockStart;

    
    
    try {
      editor.chain().focus().setTextSelection({ from: blockStart, to: blockEnd }).run();
    } catch (e) {
      
    }

    
    if (editor.commands.toggleTaskItem) {
      editor.chain().focus().toggleTaskItem().run();
    } else if (editor.commands.toggleTaskList) {
      editor.chain().focus().toggleTaskList().run();
    } else {
      
      try {
        
        const blockText = editor.state.doc.textBetween(blockStart, blockEnd, '\n');
        const safeText = blockText.replaceAll('\n', '<br/>');
        const html = `<label class=\"task-item inline-flex items-center gap-2\"><input type=\"checkbox\" class=\"task-checkbox\" /><span class=\"task-text\">${safeText}</span></label>`;
        editor.chain().focus().deleteRange({ from: blockStart, to: blockEnd }).insertContentAt(blockStart, html).run();
      } catch (err) {
        console.error('handleToggleCheckbox fallback error:', err);
      }
    }

    
    
    try {
      
      const postCheckboxOffset = blockStart + 2 + cursorOffsetInBlock;
      editor.chain().focus().setTextSelection(postCheckboxOffset).run();
    } catch (e) {
      
    }
  };

  const createChecklistItemId = () =>
    window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('deNotes-task-styles')) return;

    const css = `
    .task-list { list-style: none; padding-left: 0; }
    .task-item { display: flex; align-items: center; gap: 0.5rem; }
    .task-item .task-checkbox, .task-item input[type="checkbox"] { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 6px; border: 2px solid #cbd5e1; background: white; display: inline-grid; place-items: center; }
    .task-item .task-checkbox:checked, .task-item input[type="checkbox"]:checked { background: #2563eb; border-color: #2563eb; }
    .task-item .task-checkbox:checked::after, .task-item input[type="checkbox"]:checked::after { content: ''; width: 8px; height: 5px; border-left: 2px solid white; border-bottom: 2px solid white; transform: rotate(-45deg); display: block; }
    .task-item .task-text, .task-item label > span, .task-item label > p { display: inline-block; }
    .task-item .task-checkbox:checked + .task-text, .task-item input[type="checkbox"]:checked + .task-text, .task-item input[type="checkbox"]:checked + span { text-decoration: line-through; color: #6b7280; opacity: 0.6; }
    .checked-item { text-decoration: line-through; opacity: 0.6; }
    .checked-item input[type="checkbox"] { opacity: 0.6; }
    .checked-item span { opacity: 0.6; }
    `;

    const style = document.createElement('style');
    style.id = 'deNotes-task-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }, []);

  const handleAddChecklist = async () => {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, '\n').trim();
    const currentLine = editor.state.selection.$from.parent.textContent.trim();

    let text = selectedText || currentLine;
    if (!text) {
      const promptText = window.prompt('Masukkan teks checklist:');
      if (!promptText) return;
      text = promptText.trim();
    }

    const nextChecklist = [
      ...(Array.isArray(note.checklist) ? note.checklist : []),
      { id: createChecklistItemId(), text, done: false },
    ];

    await onSave(note.id, { checklist: nextChecklist });

    if (selectedText) {
      editor.chain().focus().deleteSelection().run();
    } else if (currentLine) {
      const { $from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: $from.start(), to: $from.end() }).run();
    }
  };

  const imageInputRef = useRef(null);

  useEffect(() => {
    if (editor && canEdit) {
      editor.chain().focus().run();
    }
  }, [editor, canEdit]);

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        editor.chain().focus().setImage({ src: result }).run();
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: note.background_color || '#ffffff' }}
        onClick={e => e.stopPropagation()}
      >
        
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-black/5">
          <input
            ref={titleRef}
            defaultValue={note.title}
            readOnly={!canEdit}
            placeholder="Judul catatan..."
            className="flex-1 bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 text-gray-400 flex-shrink-0"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        
        <div className="flex flex-1 overflow-hidden">

          
          <div className="flex flex-1 flex-col overflow-hidden">

            
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-black/5 flex-wrap">
              <ToolBtn disabled={!canEdit}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor?.isActive('heading', { level: 1 })} title="Heading 1">
                <Heading1 size={15} />
              </ToolBtn>
              <ToolBtn disabled={!canEdit}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 size={15} />
              </ToolBtn>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <ToolBtn disabled={!canEdit}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive('bold')} title="Bold (Ctrl+B)">
                <Bold size={15} />
              </ToolBtn>
              <ToolBtn disabled={!canEdit}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive('italic')} title="Italic (Ctrl+I)">
                <Italic size={15} />
              </ToolBtn>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <ToolBtn disabled={!canEdit}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')} title="Bullet list">
                <List size={15} />
              </ToolBtn>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <ToolBtn disabled={!canEdit} onClick={handleToggleCheckbox} title="Tambahkan checklist">
                <CheckSquare size={15} />
              </ToolBtn>
              <ToolBtn disabled={!canEdit} onClick={handleAddImage} title="Upload gambar dari komputer">
                <ImageIcon size={15} />
              </ToolBtn>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {!canEdit && (
                <span className="ml-auto text-xs text-gray-400 italic">Hanya lihat</span>
              )}
            </div>

            
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <EditorContent editor={editor} />

              {(Array.isArray(note.checklist) ? note.checklist : []).length > 0 && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white/80 p-4 text-sm text-gray-700">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Checklist
                  </div>
                  {(note.checklist || []).filter(item => !item.done).map(item => (
                    <label key={item.id} className="flex items-start gap-2 mb-2 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!canEdit}
                        onChange={e => handleToggleChecklist(item.id, e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-300"
                      />
                      <span className="transition-all duration-300">
                        {item.text}
                      </span>
                    </label>
                  ))}
                  {(note.checklist || []).filter(item => item.done).length > 0 && (
                    <>
                      <hr className="my-3 border-t border-gray-200 opacity-20" />
                      {(note.checklist || []).filter(item => item.done).map(item => (
                        <label key={item.id} className="flex items-start gap-2 mb-2 transition-all duration-300 text-gray-500">
                          <input
                            type="checkbox"
                            checked
                            disabled
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-400 opacity-60 transition-all duration-300"
                          />
                          <span className="transition-all duration-300 line-through opacity-50 text-gray-500">
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-black/5">
              <button
                onClick={onClose}
                className="text-sm px-4 py-1.5 rounded-lg text-gray-500 hover:bg-black/5"
              >
                {canEdit ? 'Batal' : 'Tutup'}
              </button>
              {canEdit && (
                <button
                  onClick={handleSave}
                  className="text-sm px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                >
                  Simpan
                </button>
              )}
            </div>
          </div>

          
          <div className="w-52 flex-shrink-0 border-l border-black/5 flex flex-col bg-black/[0.02]">
            <div className="flex items-center gap-1.5 px-3 py-3 border-b border-black/5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Riwayat
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {histLoading ? (
                <div className="flex items-center justify-center h-16">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8 px-3 leading-relaxed">
                  Belum ada riwayat perubahan
                </p>
              ) : (
                <ul>
                  {history.map((h, i) => (
                    <li
                      key={h.id}
                      className={`px-3 py-2.5 ${i !== history.length - 1 ? 'border-b border-black/5' : ''}`}
                    >
                      <p className="text-xs text-gray-700 leading-snug">
                        <span className="font-semibold text-gray-800">{h.changed_by}</span>
                        {' '}{h.action}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(h.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
