import React, { useState, useCallback, useRef } from 'react';
import { Eye, EyeOff, Lock, Copy, Undo, Redo, Download } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrambleText = useCallback((input: string) => {
    return input
      .split('')
      .map(() => String.fromCharCode(Math.floor(Math.random() * (126 - 33 + 1)) + 33))
      .join('');
  }, []);

  const renderScrambledText = useCallback(() => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {scrambleText(line)}
      </React.Fragment>
    ));
  }, [text, scrambleText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUndoStack([text, ...undoStack]);
    setRedoStack([]);
    setText(e.target.value);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousText = undoStack[0];
      const newUndoStack = undoStack.slice(1);
      setRedoStack([text, ...redoStack]);
      setUndoStack(newUndoStack);
      setText(previousText);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextText = redoStack[0];
      const newRedoStack = redoStack.slice(1);
      setUndoStack([text, ...undoStack]);
      setRedoStack(newRedoStack);
      setText(nextText);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSave = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyphernote.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatButton = "px-2 py-1 rounded hover:bg-emerald-900/50 text-emerald-400 transition-colors";

  return (
    <div className="min-h-screen bg-black p-2 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/50 backdrop-blur rounded-xl shadow-lg shadow-emerald-500/20 p-3 sm:p-6 border border-emerald-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-mono font-semibold text-emerald-400">Cyphernote</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors font-mono text-sm sm:text-base"
                title="Copy text"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors font-mono text-sm sm:text-base"
                title="Save as file"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors font-mono text-sm sm:text-base"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 p-2 bg-emerald-900/20 rounded-lg">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`${formatButton} ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`${formatButton} ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              className="w-full h-64 sm:h-96 p-3 sm:p-4 text-emerald-400 bg-black/50 border border-emerald-900/30 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none font-mono placeholder-emerald-700 text-sm sm:text-base"
              placeholder="Type your private text here..."
              spellCheck="true"
              style={{ caretColor: 'rgb(52 211 153)' }}
            />
            {!isRevealed && text && (
              <div 
                key={text + Date.now()}
                className="absolute inset-0 pointer-events-none bg-black/50 border border-emerald-900/30 rounded-lg p-3 sm:p-4 font-mono text-emerald-400 overflow-auto text-sm sm:text-base"
                style={{ userSelect: 'none' }}
              >
                {renderScrambledText()}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-emerald-600 font-mono gap-2">
            <span>{text.length} characters</span>
            <span>
              {undoStack.length} undo • {redoStack.length} redo
            </span>
          </div>
          
          {/* Attribution line */}
          <div className="mt-4 sm:mt-6 text-center text-emerald-500/70 font-mono text-xs sm:text-sm" style={{ fontFamily: 'monospace' }}>
            Built by{' '}
            <a 
              href="https://www.linkedin.com/in/rohith-borana-b10778266/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              therohithborana
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;