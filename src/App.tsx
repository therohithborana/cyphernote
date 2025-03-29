import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, EyeOff, Lock, Copy, Undo, Redo, Download, List, ListOrdered } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrambleText = useCallback((input: string) => {
    // Preserve bullet points, numbers, and spaces
    return input
      .split('')
      .map(char => {
        // Preserve spaces, bullet points, numbers with periods, and other formatting characters
        if (/[\s\-\*\•\d\.\(\)\[\]\{\}]/.test(char)) {
          return char;
        }
        // Scramble other characters
        return String.fromCharCode(Math.floor(Math.random() * (126 - 33 + 1)) + 33);
      })
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

  const handleClear = () => {
    // Reset text without saving to undo stack
    setText('');
    // Clear both undo and redo stacks
    setUndoStack([]);
    setRedoStack([]);
  };

  const formatButton = "px-2 py-1 rounded hover:bg-emerald-900/50 text-emerald-400 transition-colors";

  // Handle special key presses for lists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Alt+B for bullet list
    if (e.altKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertBulletPoint();
      return;
    }
    
    // Alt+N for numbered list
    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      insertNumberedItem();
      return;
    }
    
    // Handle Enter key for list continuation
    if (e.key === 'Enter' && !e.shiftKey) {
      const cursorPosition = e.currentTarget.selectionStart;
      const currentText = text;
      const currentLine = getCurrentLine(currentText, cursorPosition);
      
      // Check for bullet points
      if (currentLine.match(/^\s*[\-\*\•]\s+/)) {
        e.preventDefault();
        const bulletMatch = currentLine.match(/^(\s*)([\-\*\•])(\s+)/);
        if (bulletMatch) {
          const [, indent, bullet, space] = bulletMatch;
          // If the line is empty except for the bullet, remove the bullet
          if (currentLine.trim() === `${bullet}${space.trimEnd()}`) {
            removeBullet(cursorPosition);
          } else {
            // Continue the bullet list
            continueBulletList(cursorPosition, indent, bullet, space);
          }
        }
        return;
      }
      
      // Check for numbered lists
      if (currentLine.match(/^\s*\d+\.\s+/)) {
        e.preventDefault();
        const numberMatch = currentLine.match(/^(\s*)(\d+)(\.\s+)/);
        if (numberMatch) {
          const [, indent, number, suffix] = numberMatch;
          // If the line is empty except for the number, remove the number
          if (currentLine.trim() === `${number}${suffix.trimEnd()}`) {
            removeNumberedItem(cursorPosition);
          } else {
            // Continue the numbered list with incremented number
            continueNumberedList(cursorPosition, indent, parseInt(number), suffix);
          }
        }
        return;
      }
    }
  };

  // Helper functions for list handling
  const getCurrentLine = (text: string, cursorPosition: number) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const lineStartIndex = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    
    const textAfterCursor = text.substring(cursorPosition);
    const nextNewlineIndex = textAfterCursor.indexOf('\n');
    const lineEndIndex = nextNewlineIndex === -1 
      ? text.length 
      : cursorPosition + nextNewlineIndex;
    
    return text.substring(lineStartIndex, lineEndIndex);
  };

  const insertBulletPoint = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPosition = textarea.selectionStart;
    const newText = text.substring(0, cursorPosition) + '• ' + text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor position after the bullet point
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorPosition + 2;
    }, 0);
  };

  const insertNumberedItem = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPosition = textarea.selectionStart;
    const newText = text.substring(0, cursorPosition) + '1. ' + text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor position after the number
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorPosition + 3;
    }, 0);
  };

  const continueBulletList = (cursorPosition: number, indent: string, bullet: string, space: string) => {
    const newText = 
      text.substring(0, cursorPosition) + 
      '\n' + indent + bullet + space + 
      text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor position after the new bullet
    const newCursorPosition = cursorPosition + 1 + indent.length + bullet.length + space.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPosition;
      }
    }, 0);
  };

  const continueNumberedList = (cursorPosition: number, indent: string, number: number, suffix: string) => {
    const nextNumber = number + 1;
    const newText = 
      text.substring(0, cursorPosition) + 
      '\n' + indent + nextNumber + suffix + 
      text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor position after the new number
    const newCursorPosition = cursorPosition + 1 + indent.length + nextNumber.toString().length + suffix.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPosition;
      }
    }, 0);
  };

  const removeBullet = (cursorPosition: number) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const lineStartIndex = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    
    const newText = 
      text.substring(0, lineStartIndex) + 
      text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor at the beginning of the next line
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStartIndex;
      }
    }, 0);
  };

  const removeNumberedItem = (cursorPosition: number) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const lineStartIndex = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    
    const newText = 
      text.substring(0, lineStartIndex) + 
      text.substring(cursorPosition);
    
    setUndoStack([text, ...undoStack]);
    setText(newText);
    
    // Set cursor at the beginning of the next line
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStartIndex;
      }
    }, 0);
  };

  // Add keyboard shortcut handler for toggling text visibility
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Use Alt+H instead of Ctrl+H to avoid browser history conflict
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault(); // Prevent browser's default behavior
        setIsRevealed(prev => !prev);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

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
                title={`${isRevealed ? 'Hide' : 'Show'} text (Alt+H)`}
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
            
            <div className="h-4 w-px bg-emerald-800/50 mx-1"></div>
            
            <button
              onClick={insertBulletPoint}
              className={formatButton}
              title="Bullet List (Alt+B)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={insertNumberedItem}
              className={formatButton}
              title="Numbered List (Alt+N)"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleClear}
              disabled={!text}
              className={`ml-auto ${formatButton} ${!text ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Clear text"
            >
              <span className="text-xs">Clear</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className={`w-full h-64 sm:h-96 p-3 sm:p-4 text-emerald-400 ${!isRevealed ? 'text-transparent' : ''} bg-black/50 border border-emerald-900/30 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none font-mono placeholder-emerald-700 text-sm sm:text-base`}
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