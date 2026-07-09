
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Eraser, Brush, Loader2, Undo, Info } from 'lucide-react';

interface Props {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mask: string, prompt: string) => void;
  isProcessing: boolean;
}

const InpaintModal: React.FC<Props> = ({ imageUrl, isOpen, onClose, onConfirm, isProcessing }) => {
  const [brushSize, setBrushSize] = useState(30);
  const [isEraser, setIsEraser] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Canvas with Image
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        if (canvasRef.current && maskCanvasRef.current && containerRef.current) {
          // Calculate Aspect Ratio to fit screen
          const maxWidth = Math.min(window.innerWidth * 0.9, 800);
          const maxHeight = window.innerHeight * 0.6;
          
          let width = img.width;
          let height = img.height;

          // Resize logic to fit container
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Set canvas dimensions
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          maskCanvasRef.current.width = width;
          maskCanvasRef.current.height = height;

          // Draw original image
          const ctx = canvasRef.current.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Clear mask canvas
          const maskCtx = maskCanvasRef.current.getContext('2d');
          if (maskCtx) {
              maskCtx.clearRect(0, 0, width, height);
          }
        }
      };
    }
  }, [isOpen, imageUrl]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!maskCanvasRef.current) return { x: 0, y: 0 };
    const rect = maskCanvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = maskCanvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath(); // Reset path
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    // Prevent scrolling on touch
    // e.preventDefault(); 

    const { x, y } = getCoordinates(e);
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red semi-transparent for visual mask
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleGenerate = () => {
    if (!maskCanvasRef.current) return;

    // 1. Create a black and white mask for the AI
    // We need a separate canvas to generate the actual binary mask (White = Edit area, Black = Keep)
    const w = maskCanvasRef.current.width;
    const h = maskCanvasRef.current.height;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const exportCtx = exportCanvas.getContext('2d');
    
    if (exportCtx) {
        // Fill background black
        exportCtx.fillStyle = 'black';
        exportCtx.fillRect(0, 0, w, h);
        
        // Draw the mask content from the visible canvas onto this one
        // But we need it to be white solid.
        // We can iterate pixels or just re-draw if we tracked paths. 
        // Simpler approach: Draw the maskCanvas onto exportCanvas with composite operation? 
        // No, maskCanvas is red transparent.
        
        // Better approach: Use the maskCanvas as a source.
        exportCtx.drawImage(maskCanvasRef.current, 0, 0);
        
        // Now turn non-transparent pixels to white
        const imageData = exportCtx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If alpha > 0, make it white
            if (data[i + 3] > 0) {
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = 255; // Alpha
            }
        }
        exportCtx.putImageData(imageData, 0, 0);
        
        const maskBase64 = exportCanvas.toDataURL('image/png');
        onConfirm(maskBase64, prompt);
    }
  };

  const clearMask = () => {
      const ctx = maskCanvasRef.current?.getContext('2d');
      if (ctx && maskCanvasRef.current) {
          ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Brush className="w-5 h-5 text-misa-blue" />
            Chỉnh sửa ảnh (Inpaint)
        </h3>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Workspace */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4"
        style={{ touchAction: 'none' }}
      >
        <div className="relative shadow-2xl border-2 border-white/20 rounded-sm">
            <canvas 
                ref={canvasRef} 
                className="block bg-gray-800"
            />
            <canvas 
                ref={maskCanvasRef}
                className="absolute inset-0 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
      </div>

      {/* Controls Footer */}
      <div className="w-full max-w-3xl bg-gray-900/90 border border-gray-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        
        {/* Top Row: Tools */}
        <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                <button 
                    onClick={() => setIsEraser(false)}
                    className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${!isEraser ? 'bg-misa-blue text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Brush className="w-4 h-4" /> Tô vùng chọn
                </button>
                <button 
                    onClick={() => setIsEraser(true)}
                    className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${isEraser ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eraser className="w-4 h-4" /> Tẩy
                </button>
            </div>

            <div className="flex-1 max-w-xs px-4">
                 <div className="flex justify-between text-xs text-gray-400 mb-1">
                     <span>Kích thước bút</span>
                     <span>{brushSize}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-misa-blue"
                 />
            </div>

            <button 
                onClick={clearMask}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Xóa toàn bộ vùng chọn"
            >
                <Undo className="w-5 h-5" />
            </button>
        </div>

        {/* Bottom Row: Input & Action */}
        <div className="flex gap-3">
            <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập yêu cầu sửa (VD: Xóa người này, Thêm kính râm...)"
                className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-misa-blue outline-none placeholder:text-gray-500"
            />
            <button 
                onClick={handleGenerate}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isProcessing ? "Đang xử lý..." : "Thực hiện"}
            </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Để trống ô nhập liệu nếu bạn chỉ muốn xóa đối tượng trong vùng chọn.
        </p>
      </div>
    </div>
  );
};

export default InpaintModal;
