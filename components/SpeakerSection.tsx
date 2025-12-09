
import React from 'react';
import { Speaker } from '../types';
import { User, Upload, X, Wand2, Building2 } from 'lucide-react';

interface Props {
  speakers: Speaker[];
  onChange: (speakers: Speaker[]) => void;
}

const SpeakerSection: React.FC<Props> = ({ speakers, onChange }) => {
  
  const addSpeaker = () => {
    if (speakers.length >= 3) return;
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      name: '',
      title: '',
      company: '',
      image: null,
      imagePreview: null,
      editPrompt: '',
      removeBackground: true
    };
    onChange([...speakers, newSpeaker]);
  };

  const updateSpeaker = (id: string, updates: Partial<Speaker>) => {
    onChange(speakers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSpeaker = (id: string) => {
    onChange(speakers.filter(s => s.id !== id));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateSpeaker(id, { 
        image: file, 
        imagePreview: reader.result as string 
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-misa-blue" />
          Diễn giả ({speakers.length}/3)
        </h3>
        {speakers.length < 3 && (
          <button
            type="button"
            onClick={addSpeaker}
            className="text-sm font-medium text-white bg-misa-blue hover:bg-misa-dark px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            + Thêm diễn giả
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {speakers.map((speaker, index) => (
          <div key={speaker.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
            <button
              onClick={() => removeSpeaker(speaker.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-colors z-10"
              title="Xóa diễn giả"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-40 h-40 mb-3 group/image">
                {speaker.imagePreview ? (
                  <img src={speaker.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-full border-4 border-misa-blue/20 shadow-inner" />
                ) : (
                  <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                        <User className="w-10 h-10 text-gray-300 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">Chưa có ảnh</span>
                    </div>
                  </div>
                )}
                <label className="absolute bottom-1 right-3 bg-white border border-gray-200 rounded-full p-2 cursor-pointer shadow-md hover:bg-blue-50 transition-transform hover:scale-105">
                  <Upload className="w-4 h-4 text-misa-blue" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(speaker.id, e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg focus:ring-misa-blue focus:border-misa-blue py-2"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chức danh</label>
                <input
                  type="text"
                  value={speaker.title}
                  onChange={(e) => updateSpeaker(speaker.id, { title: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg focus:ring-misa-blue focus:border-misa-blue py-2"
                  placeholder="Giám đốc kinh doanh"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3"/> Tên công ty
                </label>
                <input
                  type="text"
                  value={speaker.company}
                  onChange={(e) => updateSpeaker(speaker.id, { company: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg focus:ring-misa-blue focus:border-misa-blue py-2"
                  placeholder="Công ty CP MISA"
                />
              </div>
              
              {/* Image Editing Prompts */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 mt-2">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="bg-purple-100 p-1 rounded-full">
                        <Wand2 className="w-3 h-3 text-purple-600" />
                    </div>
                    <label className="text-xs font-bold text-purple-900">AI Chỉnh sửa ảnh</label>
                </div>
                <textarea
                  value={speaker.editPrompt}
                  onChange={(e) => updateSpeaker(speaker.id, { editPrompt: e.target.value })}
                  className="w-full text-xs border-blue-200 rounded-md focus:ring-purple-500 focus:border-purple-500 min-h-[60px] bg-white/50 resize-none"
                  placeholder="VD: Mặc vest đen, khoanh tay, cười tươi..."
                />
                <div className="mt-2 flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id={`remove-bg-${speaker.id}`}
                        checked={speaker.removeBackground}
                        onChange={(e) => updateSpeaker(speaker.id, { removeBackground: e.target.checked })}
                        className="rounded text-misa-blue focus:ring-misa-blue border-gray-300 w-4 h-4"
                    />
                    <label htmlFor={`remove-bg-${speaker.id}`} className="text-xs font-medium text-gray-700 cursor-pointer">Tách nền tự động</label>
                </div>
              </div>
            </div>
          </div>
        ))}
        {speakers.length === 0 && (
           <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
               <User className="w-12 h-12 mb-3 text-gray-300" />
               <p className="font-medium">Chưa có diễn giả nào</p>
               <button onClick={addSpeaker} className="mt-2 text-sm text-misa-blue hover:underline">Thêm diễn giả ngay</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerSection;
