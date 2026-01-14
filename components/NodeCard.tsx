
import React, { useState, useRef, useEffect } from 'react';
import { NodeResult, HistoryEntry } from '../types';
import { Button } from './Button';

interface NodeCardProps {
  node: NodeResult;
  onRegenerate: (nodeId: string, instruction: string, areaSelected?: boolean) => void;
  onRevert: (nodeId: string, historyIndex: number) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ node, onRegenerate, onRevert }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editMode, setEditMode] = useState<'text' | 'pencil' | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const is916 = node.aspectRatio === "9:16";

  useEffect(() => {
    if (editMode === 'pencil' && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 25;
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
      }
    }
  }, [editMode]);

  const handleDownload = () => {
    if (!node.imageUrl) return;
    const fileName = `${node.title.toLowerCase().replace(/\s+/g, '_')}_${node.id}.png`;
    const link = document.createElement('a');
    link.href = node.imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (editMode !== 'pencil') return;
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawn(false);
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      onRegenerate(node.id, instruction, editMode === 'pencil');
      setEditMode(null);
      setInstruction('');
      setHasDrawn(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md ${is916 ? 'row-span-2' : ''}`}>
      <div 
        ref={containerRef}
        className={`relative bg-slate-100 flex items-center justify-center overflow-hidden ${is916 ? 'aspect-[9/16]' : 'aspect-square'}`}
        style={{ cursor: editMode === 'pencil' ? 'crosshair' : 'default' }}
      >
        {node.status === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">Procesando...</p>
          </div>
        )}
        
        {node.status === 'error' && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <svg className="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 font-medium">Error al generar</p>
          </div>
        )}

        {node.imageUrl ? (
          <>
            <img 
              src={node.imageUrl} 
              alt={node.title} 
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
            
            {editMode === 'pencil' && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 z-10 touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            )}

            {node.status === 'completed' && !editMode && (
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                {/* History Trigger */}
                {node.history.length > 0 && (
                  <button 
                    onClick={() => { setShowHistory(!showHistory); setShowMenu(false); }}
                    className={`p-2 backdrop-blur shadow-sm rounded-full transition-colors ${showHistory ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-600 hover:text-indigo-600'}`}
                    title="Ver historial"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}

                {/* Edit Trigger */}
                <button 
                  onClick={() => { setShowMenu(!showMenu); setShowHistory(false); }}
                  className={`p-2 backdrop-blur shadow-sm rounded-full transition-colors ${showMenu ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-600 hover:text-indigo-600'}`}
                  title="Opciones de edición"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-10 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => { setEditMode('text'); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar con texto
                    </button>
                    <button 
                      onClick={() => { setEditMode('pencil'); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar con pincel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* History Panel Overlay */}
            {showHistory && (
              <div className="absolute inset-0 bg-white/95 z-30 p-4 flex flex-col animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Historial de versiones
                  </h4>
                  <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {[...node.history].reverse().map((entry, idx) => {
                    const actualIndex = node.history.length - 1 - idx;
                    return (
                      <div key={entry.timestamp} className="group relative bg-slate-50 border border-slate-100 rounded-lg p-2 flex gap-3 hover:border-indigo-200 transition-colors">
                        <img src={entry.imageUrl} className="w-16 h-16 object-cover rounded shadow-sm" alt="v-prev" />
                        <div className="flex flex-col justify-between flex-grow min-w-0">
                          <p className="text-[10px] text-slate-500 italic truncate">
                            {entry.customPrompt || "Versión original"}
                          </p>
                          <button 
                            onClick={() => { onRevert(node.id, actualIndex); setShowHistory(false); }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restaurar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : node.status === 'idle' && (
          <div className="text-slate-400">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
        )}

        {editMode && (
          <div className={`absolute inset-0 bg-indigo-900/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-30 ${editMode === 'pencil' && !hasDrawn ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}`}>
            <form onSubmit={handleSubmitEdit} className="bg-white rounded-xl p-4 shadow-2xl w-full max-w-xs animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  {editMode === 'pencil' ? 'Área marcada' : 'Instrucciones'}
                </span>
                <button type="button" onClick={() => { setEditMode(null); clearCanvas(); }} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                autoFocus
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={editMode === 'pencil' ? "¿Qué quieres cambiar en el área?" : "Ej: Cambia el fondo a color rojo..."}
                className="w-full text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none mb-3 shadow-inner"
              />
              <div className="flex gap-2">
                {editMode === 'pencil' && (
                  <Button type="button" variant="outline" onClick={clearCanvas} className="flex-1 text-xs">Borrar</Button>
                )}
                <Button type="submit" className="flex-[2] text-xs">Regenerar</Button>
              </div>
            </form>
          </div>
        )}

        {editMode === 'pencil' && !hasDrawn && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg animate-bounce z-40">
            Dibuja sobre el área a modificar
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-800 text-sm">{node.title}</h3>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wider">{node.aspectRatio}</span>
        </div>
        <div className="text-xs text-slate-500 line-clamp-2 mb-4 flex-grow">
          {node.customPrompt ? (
            <div className="flex items-start gap-1">
               <svg className="w-3 h-3 mt-0.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span className="italic text-indigo-600">{node.customPrompt}</span>
            </div>
          ) : (
            node.description
          )}
        </div>
        
        {node.imageUrl && (
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="w-full text-xs py-2 mt-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar Imagen
          </Button>
        )}
      </div>
    </div>
  );
};
