import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  X, Bold, Italic, Heading1, Heading2,
  List, Link2, Image as ImageIcon, Clock,
} from 'lucide-react';
import { useNoteHistory } from '../hooks/useNoteHistory.js';

// ─── Toolbar button ───────────────────────────────────────────────────────────
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

// ─── FocusModal ──────────────────────────────────────────────────────────────
export default function FocusModal({ note, canEdit = true, onClose, onSave }) {
  const titleRef = useRef(null);
  const { history, loading: histLoading, fetchHistory } = useNoteHistory();

  // Fetch history saat pertama buka (hanya untuk note existing)
  useEffect(() => {
    if (note.id) fetchHistory(note.id);
  }, [note.id, fetchHistory]);

  // Tutup dengan Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Tiptap editor — read-only kalau viewer
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' },
      }),
      Image.configure({
        allowBase64: true,  // Allow base64 data URIs
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

  // ✅ Sync editor content dan judul saat note berubah
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
    // Jangan treat sebagai empty jika ada image, bahkan jika hanya image saja
    if (html.includes('<img')) return false;
    
    const normalized = html
      .replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/<!--.*?-->/g, '')
      .replace(/<[^>]*>/g, '')  // Remove all tags
      .trim();
    return normalized === '';
  };

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    // Selalu kirim content (jangan kosongkan), kecuali truly empty (tanpa image dan tanpa text)
    const content = isEmptyContent(html) ? '' : html;

    // Debug: pastikan content dengan gambar dikirim ke server
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
        content,  // Selalu kirim, undefined akan cause masalah
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

  const imageInputRef = useRef(null);

  useEffect(() => {
    if (editor && canEdit) {
      editor.chain().focus().run();
    }
  }, [editor, canEdit]);

  const handleAddLink = () => {
    const url = window.prompt('Masukkan URL:');
    if (url && editor) editor.chain().focus().setLink({ href: url }).run();
  };

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
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* ── Modal panel ───────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: note.background_color || '#ffffff' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Editor column ──────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Toolbar (disabled bila viewer) */}
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
                <ToolBtn disabled={!canEdit} onClick={handleAddLink} title="Sisipkan link">
                <Link2 size={15} />
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

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <EditorContent editor={editor} />
            </div>

            {/* Footer */}
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

          {/* ── History panel ──────────────────────────────────────────────── */}
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
