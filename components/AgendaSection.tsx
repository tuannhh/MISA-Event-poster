
import React from 'react';
import { AgendaItem } from '../types';
import { Plus, Trash2, Clock, AlignLeft } from 'lucide-react';

interface Props {
  agenda: AgendaItem[];
  onChange: (agenda: AgendaItem[]) => void;
}

const AgendaSection: React.FC<Props> = ({ agenda, onChange }) => {
  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: crypto.randomUUID(),
      time: '',
      activity: ''
    };
    onChange([...agenda, newItem]);
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    onChange(agenda.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeAgendaItem = (id: string) => {
    onChange(agenda.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
         <p className="text-sm text-gray-500 italic">Nhập mốc thời gian và nội dung hoạt động</p>
         <button
            type="button"
            onClick={addAgendaItem}
            className="text-sm font-medium text-white bg-misa-blue hover:bg-misa-dark px-3 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Thêm hoạt động
          </button>
      </div>

      <div className="space-y-3">
        {agenda.map((item, index) => (
          <div key={item.id} className="flex gap-3 items-start group">
            <div className="w-1/3">
                <div className="relative">
                    <Clock className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={item.time}
                        onChange={(e) => updateAgendaItem(item.id, { time: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-misa-blue/50 focus:border-misa-blue transition-all text-base shadow-sm placeholder:text-gray-400"
                        placeholder="VD: 08:00 - 08:30"
                    />
                </div>
            </div>
            <div className="flex-1">
                <div className="relative">
                    <AlignLeft className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={item.activity}
                        onChange={(e) => updateAgendaItem(item.id, { activity: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-misa-blue/50 focus:border-misa-blue transition-all text-base shadow-sm placeholder:text-gray-400"
                        placeholder="VD: Đón tiếp khách mời & Check-in"
                    />
                </div>
            </div>
            <button
                onClick={() => removeAgendaItem(item.id)}
                className="mt-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa dòng này"
            >
                <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {agenda.length === 0 && (
            <div className="text-center py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <p className="text-sm">Chưa có nội dung chương trình</p>
                <button onClick={addAgendaItem} className="mt-2 text-sm text-misa-blue font-semibold hover:underline">
                    + Thêm dòng đầu tiên
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AgendaSection;
