import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar.js';
import { markdownToEditorHtml } from '../../shared/markdown-to-tiptap.js';
import { tiptapJsonToMarkdownBody } from '../../shared/tiptap-to-markdown.js';

interface RichTextEditorProps {
  contentJson?: string;
  contentMarkdown?: string;
  onChange?: (json: string) => void;
  onMarkdownChange?: (markdown: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  editable?: boolean;
  placeholder?: string;
}

export function RichTextEditor({
  contentJson,
  contentMarkdown,
  onChange,
  onMarkdownChange,
  onImageUpload,
  editable = true,
  placeholder = 'Start writing…',
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const suppressUpdate = useRef(true);
  const markdownMode = contentMarkdown !== undefined;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: markdownMode ? markdownToEditorHtml(contentMarkdown ?? '') : JSON.parse(contentJson ?? '{}'),
    editable,
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdate.current) return;
      const json = JSON.stringify(ed.getJSON());
      onChange?.(json);
      if (markdownMode) {
        onMarkdownChange?.(tiptapJsonToMarkdownBody(json));
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    suppressUpdate.current = true;
    if (markdownMode) {
      const html = markdownToEditorHtml(contentMarkdown ?? '');
      if (editor.getHTML() !== html) {
        editor.commands.setContent(html, { emitUpdate: false });
      }
    } else if (contentJson) {
      const current = JSON.stringify(editor.getJSON());
      if (current !== contentJson) {
        editor.commands.setContent(JSON.parse(contentJson), { emitUpdate: false });
      }
    }
    queueMicrotask(() => {
      suppressUpdate.current = false;
    });
  }, [contentJson, contentMarkdown, editor, markdownMode]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor || !onImageUpload) return;
    try {
      const url = await onImageUpload(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } finally {
      e.target.value = '';
    }
  };

  if (!editor) return null;

  return (
    <div className="wiki-editor">
      {editable && (
        <EditorToolbar
          editor={editor}
          onInsertImage={onImageUpload ? () => fileRef.current?.click() : undefined}
        />
      )}
      {onImageUpload && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImagePick}
        />
      )}
      <div className="wiki-editor__body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
