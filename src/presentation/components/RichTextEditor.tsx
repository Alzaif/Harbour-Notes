import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar.js';

interface RichTextEditorProps {
  contentJson: string;
  onChange: (json: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  editable?: boolean;
}

export function RichTextEditor({
  contentJson,
  onChange,
  onImageUpload,
  editable = true,
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const suppressUpdate = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: JSON.parse(contentJson),
    editable,
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdate.current) return;
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    suppressUpdate.current = true;
    const current = JSON.stringify(editor.getJSON());
    if (current !== contentJson) {
      editor.commands.setContent(JSON.parse(contentJson), { emitUpdate: false });
    }
    queueMicrotask(() => {
      suppressUpdate.current = false;
    });
  }, [contentJson, editor]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      e.target.value = '';
    }
  };

  if (!editor) return null;

  return (
    <div className="wiki-editor">
      {editable && (
        <EditorToolbar editor={editor} onInsertImage={() => fileRef.current?.click()} />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImagePick}
      />
      <div className="wiki-editor__body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
