import React, { useState } from 'react';
import { Key, Lock } from 'lucide-react';

interface Props {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInput: React.FC<Props> = ({ onKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length > 0) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-misa-blue/10 rounded-full">
            <Lock className="w-8 h-8 text-misa-blue" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Nhập Gemini API Key</h2>
        <p className="text-center text-gray-500 mb-6">
          Ứng dụng sử dụng model <strong>Gemini 3.0 Pro (Nano Banana Pro)</strong> để tạo ảnh chất lượng cao. Vui lòng nhập khóa API của bạn.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-misa-blue focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!key}
            className="w-full bg-misa-blue hover:bg-misa-dark text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-misa-blue/30"
          >
            Bắt đầu sử dụng
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-gray-400">
          Key được lưu tạm thời trong phiên làm việc.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;
