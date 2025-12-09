
import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
              MISA Event App
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide">
              ỨNG DỤNG TẠO THƯ MỜI TỰ ĐỘNG
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-100 mb-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-bold text-gray-700">
                    Created by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Tuấn Xoăn AI</span>
                </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
                © Bản quyền thuộc về Tuấn Xoăn AI & Tập đoàn MISA
            </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
