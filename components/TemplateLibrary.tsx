
import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Wand2, X, Loader2, Check } from 'lucide-react';
import { cleanBackground } from '../services/geminiService';

interface Props {
  onSelectBackground: (image: string) => void;
  selectedBackground?: string;
  aspectRatio: '16:9' | '3:4';
}

const TemplateLibrary: React.FC<Props> = ({ onSelectBackground, selectedBackground, aspectRatio }) => {
  const [cleaning, setCleaning] = useState(false);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Helper to create a 1x1 pixel colored image
  const createColorImage = (color: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 100; // Small size is sufficient for a background pattern reference
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 100, 100);
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const mockTemplates = Array.from({ length: 8 }).map((_, i) => {
    const hue = (i * 45) % 360;
    const color = `hsl(${hue}, 70%, 90%)`;
    return {
      id: `template-${i}`,
      color: color,
      // Pre-calculate the base64 for this color to identify selection state
      base64Identity: `color:${color}`, // We keep a simplified ID for selection matching logic only
      name: `Mẫu ${i + 1}`
    };
  });

  const handleSelectTemplate = (color: string) => {
      // Generate real image data
      const base64Image = createColorImage(color);
      onSelectBackground(base64Image);
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        setUploadedBg(reader.result as string);
        onSelectBackground(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCleanText = async (file: File) => {
    setCleaning(true);
    try {
        const cleanedImageBase64 = await cleanBackground(file);
        setUploadedBg(cleanedImageBase64);
        onSelectBackground(cleanedImageBase64);
    } catch (e) {
        alert("Lỗi khi xử lý nền: " + (e as Error).message);
    } finally {
        setCleaning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <ImageIcon className="w-6 h-6 text-misa-blue" />
        Thư viện Giao diện & Hình nền
      </h3>
      
      {/* 1. Upload & AI Clean Tool */}
      <div className="mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
        <h4 className="font-semibold text-gray-700 mb-3">Tự tải lên hình nền / Giao diện mẫu</h4>
        <div className="flex flex-wrap items-center gap-4">
             {uploadedBg ? (
                 <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-gray-300 shadow-sm cursor-pointer" onClick={() => setPreviewImage(uploadedBg)}>
                     <img src={uploadedBg} alt="Uploaded" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Xem</span>
                     </div>
                     {selectedBackground === uploadedBg && (
                         <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                             <Check className="w-3 h-3 text-white" />
                         </div>
                     )}
                 </div>
             ) : (
                <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <span className="text-xs">Chưa có ảnh</span>
                </div>
             )}

             <div className="flex flex-col gap-3">
                 <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer shadow-sm transition-colors text-sm font-medium">
                     <Upload className="w-4 h-4 text-gray-600" />
                     Tải ảnh lên
                     <input type="file" className="hidden" accept="image/*" onChange={handleUploadBackground} />
                 </label>

                 <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 cursor-pointer shadow-sm transition-colors text-sm font-bold">
                     {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                     {cleaning ? "Đang xử lý..." : "Lấy nền (Xóa text bằng AI)"}
                     <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        disabled={cleaning}
                        onChange={(e) => e.target.files?.[0] && handleCleanText(e.target.files[0])} 
                     />
                 </label>
                 <p className="text-xs text-gray-500 max-w-[200px]">
                    *Tính năng "Lấy nền" sẽ dùng AI để xóa chữ và logo khỏi ảnh bạn tải lên, chỉ giữ lại background.
                 </p>
             </div>
        </div>
      </div>

      {/* 2. Presets Grid */}
      <h4 className="font-semibold text-gray-700 mb-3">Giao diện mẫu ({aspectRatio})</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockTemplates.map((template) => {
            // Note: Since we are generating base64 on fly, strict equality match for 'selected' state might be tricky
            // We'll rely on visual selection for now or simple "last clicked" behavior if we stored ID. 
            // For this UI, we just show the grid.
            return (
            <div 
                key={template.id}
                className={`group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all border-transparent hover:border-gray-300`}
                onClick={() => handleSelectTemplate(template.color)}
            >
                <div 
                    className={`w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[3/4]'}`}
                    style={{ backgroundColor: template.color }}
                >
                    <div className="w-full h-full flex items-center justify-center opacity-30 font-black text-2xl text-black/10 select-none">
                        SAMPLE
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
        )})}
      </div>

      {/* Lightbox for Preview */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
        >
            <div className="relative max-w-4xl w-full max-h-[90vh]">
                <button 
                    onClick={() => setPreviewImage(null)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>
                <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-2xl" />
            </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
