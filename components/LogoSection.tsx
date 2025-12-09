
import React from 'react';
import { Upload, X, Shield, Package, Users } from 'lucide-react';
import { EventFormData } from '../types';

interface Props {
  formData: EventFormData;
  onChange: (updates: Partial<EventFormData>) => void;
}

const LogoSection: React.FC<Props> = ({ formData, onChange }) => {
  const handleLogoUpload = (field: 'organizerLogo' | 'productLogo' | 'coOrganizerLogo', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({
        [field]: file,
        [`${field}Preview`]: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (field: 'organizerLogo' | 'productLogo' | 'coOrganizerLogo') => {
    onChange({
      [field]: null,
      [`${field}Preview`]: null
    });
  };

  const renderLogoInput = (
    label: string, 
    field: 'organizerLogo' | 'productLogo' | 'coOrganizerLogo', 
    preview: string | null,
    icon: React.ReactNode
  ) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="relative group w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-blue-50 transition-colors overflow-hidden shadow-sm">
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-contain p-2" />
            <button
              onClick={() => removeLogo(field)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-misa-blue transition-colors">
            <Upload className="w-6 h-6 mb-2" />
            <span className="text-xs text-center px-2">Tải lên logo<br/>(.jpg, .png)</span>
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(field, e.target.files[0])} 
            />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
           <span className="block text-sm font-bold text-gray-800">Sử dụng Logo thương hiệu khác</span>
           <span className="text-xs text-gray-500">Nếu tắt, hệ thống sẽ mặc định dùng Logo MISA</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.useBrandLogo}
            onChange={(e) => onChange({ useBrandLogo: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-misa-blue"></div>
        </label>
      </div>

      {/* Conditional Inputs */}
      {formData.useBrandLogo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
          {renderLogoInput("Đơn vị tổ chức", "organizerLogo", formData.organizerLogoPreview, <Shield className="w-4 h-4 text-misa-blue"/>)}
          {renderLogoInput("Sản phẩm đồng hành", "productLogo", formData.productLogoPreview, <Package className="w-4 h-4 text-green-600"/>)}
          {renderLogoInput("Đơn vị phối hợp", "coOrganizerLogo", formData.coOrganizerLogoPreview, <Users className="w-4 h-4 text-purple-600"/>)}
        </div>
      )}
    </div>
  );
};

export default LogoSection;
