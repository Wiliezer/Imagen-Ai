
import React, { useState, useCallback, useRef } from 'react';
import { ProductSource, NodeResult } from './types';
import { generateProductVariation } from './services/geminiService';
import { Button } from './components/Button';
import { NodeCard } from './components/NodeCard';

const INITIAL_NODES: NodeResult[] = [
  {
    id: 'node1',
    title: 'Estudio Fondo Blanco',
    description: 'Iluminación profesional tipo estudio con cámaras de alta gama y fondo blanco puro.',
    aspectRatio: '1:1',
    status: 'idle'
  },
  {
    id: 'node2',
    title: 'Recorte de Producto',
    description: 'Analiza el producto y genera una imagen limpia con fondo neutro/transparente para catálogo.',
    aspectRatio: '1:1',
    status: 'idle'
  },
  {
    id: 'node3',
    title: 'Historia Instagram (9:16)',
    description: 'Contexto realista y minimalista (ej: cafetería de lujo) con iluminación cinematográfica. Sin texto.',
    aspectRatio: '9:16',
    status: 'idle'
  },
  {
    id: 'node4',
    title: 'Post Cuadrado (1:1)',
    description: 'Mismo contexto profesional pero en formato cuadrado 1:1 para el feed de Instagram.',
    aspectRatio: '1:1',
    status: 'idle'
  },
  {
    id: 'node5',
    title: 'Anuncio con Gancho',
    description: 'Escena de estilo de vida con título y subtítulo gancho persuasivo en ESPAÑOL.',
    aspectRatio: '9:16',
    status: 'idle'
  },
  {
    id: 'node6',
    title: 'Marketing Creativo',
    description: 'Imagen artística de alto impacto diseñada específicamente para ventas y marketing.',
    aspectRatio: '9:16',
    status: 'idle'
  }
];

export default function App() {
  const [productSource, setProductSource] = useState<ProductSource | null>(null);
  const [nodes, setNodes] = useState<NodeResult[]>(INITIAL_NODES);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setProductSource({
          base64,
          mimeType: file.type,
          file: file
        });
        setNodes(INITIAL_NODES.map(n => ({ ...n, status: 'idle', imageUrl: undefined, customPrompt: undefined })));
      };
      reader.readAsDataURL(file);
    }
  };

  const getPromptForNode = (nodeId: string, customInstruction?: string, areaSelected?: boolean): string => {
    let basePrompt = "";
    switch (nodeId) {
      case 'node1':
        basePrompt = "Genera una fotografía de estudio profesional de este producto. Usa iluminación de alta gama, enfoque nítido y un fondo blanco puro sólido. El producto debe ser el protagonista. Mantén la apariencia original del producto.";
        break;
      case 'node2':
        basePrompt = "Genera un recorte limpio del producto sobre un fondo transparente o blanco puro perfecto. El producto debe verse como un recurso de alta calidad para un catálogo web, con bordes definidos y limpios.";
        break;
      case 'node3':
        basePrompt = "Analiza el producto y su contexto. Colócalo en un ambiente realista, minimalista y de lujo. Iluminación cinematográfica profesional. Sin texto. Formato vertical 9:16.";
        break;
      case 'node4':
        basePrompt = "Coloca el producto en el mismo ambiente profesional y minimalista anterior pero en formato cuadrado 1:1. Estilo de fotografía de estilo de vida de alta gama.";
        break;
      case 'node5':
        basePrompt = "Crea un anuncio de marketing vertical para este producto en un entorno aspiracional. Superpón un título elegante y un subtítulo gancho persuasivo, AMBOS EN ESPAÑOL, que inviten a la compra. El texto debe ser legible y estético. Formato 9:16.";
        break;
      case 'node6':
        basePrompt = "Genera una imagen de marketing altamente creativa, dinámica y artística para este producto. Usa ángulos interesantes y una estética moderna enfocada en el deseo y la conversión de ventas. Formato vertical 9:16.";
        break;
      default:
        basePrompt = "Fotografía profesional de producto.";
    }

    if (customInstruction) {
      const locationContext = areaSelected ? "específicamente en la zona que he marcado visualmente" : "en la imagen general";
      return `${basePrompt} ADICIONALMENTE, aplica la siguiente modificación ${locationContext}: ${customInstruction}. Asegúrate de que cualquier texto generado siga siendo en ESPAÑOL.`;
    }

    return basePrompt;
  };

  const processNode = async (node: NodeResult, source: ProductSource, instruction?: string, areaSelected?: boolean) => {
    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'processing', customPrompt: instruction } : n));
    try {
      const prompt = getPromptForNode(node.id, instruction, areaSelected);
      const imageUrl = await generateProductVariation(source.base64, source.mimeType, prompt, node.aspectRatio);
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'completed', imageUrl } : n));
    } catch (error) {
      console.error(`Error procesando ${node.title}:`, error);
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'error' } : n));
    }
  };

  const handleRegenerateNode = (nodeId: string, instruction: string, areaSelected?: boolean) => {
    if (!productSource) return;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      processNode(node, productSource, instruction, areaSelected);
    }
  };

  const startMagic = async () => {
    if (!productSource) return;
    setIsProcessingAll(true);
    const tasks = nodes.map(node => processNode(node, productSource));
    await Promise.allSettled(tasks);
    setIsProcessingAll(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Product Studio <span className="text-indigo-600">AI</span></h1>
          </div>
          
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
               {productSource ? 'Cambiar Imagen' : 'Subir Producto'}
             </Button>
             <Button 
               onClick={startMagic} 
               disabled={!productSource || isProcessingAll}
               isLoading={isProcessingAll}
             >
               Generar Todo
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Imagen Original
              </h2>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />

              {!productSource ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors gap-3 p-8 text-center"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                     </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Seleccionar producto</p>
                    <p className="text-xs text-slate-400 mt-1">PNG o JPG de alta calidad</p>
                  </div>
                </div>
              ) : (
                <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                  <img 
                    src={URL.createObjectURL(productSource.file)} 
                    alt="Original" 
                    className="w-full h-full object-contain bg-slate-50"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="scale-90">
                      Reemplazar
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-700 text-xs leading-relaxed">
                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <p>Usa la herramienta <strong>Pincel</strong> para señalar áreas y pedir cambios locales.</p>
                </div>
                {productSource && !isProcessingAll && (
                   <Button className="w-full" onClick={startMagic}>
                     Comenzar Proceso
                   </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nodes.map((node) => (
                  <NodeCard 
                    key={node.id} 
                    node={node} 
                    onRegenerate={handleRegenerateNode}
                  />
                ))}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
