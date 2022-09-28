import { useEffect } from "react";
import { useQuill } from "react-quilljs";

type TextEditorProps = {
  defaultValue?: string;
};

export default function TextEditor({ defaultValue }: TextEditorProps) {
  const { quill, quillRef } = useQuill();

  useEffect(() => {
    if (quill && defaultValue) {
      quill.clipboard.dangerouslyPasteHTML(defaultValue);
    }
  }, [quill]);

  return (
    <div style={{ width: "100%" }}>
      <div ref={quillRef} />
    </div>
  );
}
