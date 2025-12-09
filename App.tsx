
import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_FORM_DATA, EventFormData, AppMode, AspectRatio, Speaker, HistoryItem } from './types';
import { generatePoster, extractEventInfo } from './services/geminiService';
import Header from './components/Header';
import SpeakerSection from './components/SpeakerSection';
import LogoSection from './components/LogoSection';
import AgendaSection from './components/AgendaSection';
import TemplateLibrary from './components/TemplateLibrary';
import { 
  Layout, Palette, CheckCircle2, Download, ZoomIn, Loader2, 
  FileText, UploadCloud, RefreshCw, Sparkles, ImagePlus, 
  QrCode, Trash2, CalendarClock, MapPin, Target, Upload, 
  Maximize2, X, ChevronRight, Wand2, History, ImageIcon, Play
} from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('manual');
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM_DATA);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false); // Track if extraction happened in Auto mode
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Ref for auto-scrolling to result
  const resultRef = useRef<HTMLDivElement>(null);

  const THEMES = [
    { value: 'Xanh công nghệ (MISA Blue)', label: 'Xanh công nghệ (MISA Blue)' },
    { value: 'Đen huyền bí (Black & Gold)', label: 'Đen huyền bí (Black & Gold)' },
    { value: 'Xanh Navy - Trắng (Corporate)', label: 'Xanh Navy - Trắng (Corporate)' },
    { value: 'Đỏ - Trắng - Đen (Energetic)', label: 'Đỏ - Trắng - Đen (Energetic)' },
    { value: 'Xanh - Trắng - Đen (Modern)', label: 'Xanh - Trắng - Đen (Modern)' },
    { value: 'Tùy chỉnh', label: 'Tùy chỉnh...' }
  ];

  const TOPICS = [
    'Tài chính - Kế toán', 'Công nghệ', 'AI', 'Bán hàng', 
    'Marketing', 'Nhân sự', 'Điều hành', 'Sản xuất', 'Tùy chỉnh'
  ];

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => {
      let newTopics = [...prev.themeTopics];
      
      if (topic === 'Tùy chỉnh') {
        if (newTopics.includes('Tùy chỉnh')) {
          newTopics = newTopics.filter(t => t !== 'Tùy chỉnh');
        } else {
           if (newTopics.length >= 2) newTopics.shift();
           newTopics.push('Tùy chỉnh');
        }
      } else {
        if (newTopics.includes(topic)) {
          newTopics = newTopics.filter(t => t !== topic);
        } else {
          if (newTopics.length >= 2) newTopics.shift();
          newTopics.push(topic);
        }
      }
      return { ...prev, themeTopics: newTopics };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview if image
    let previewUrl = undefined;
    if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
    }

    // Save file to state but DO NOT extract yet
    updateFormData({
        uploadedFileName: file.name,
        uploadedFileType: file.type,
        uploadedFilePreview: previewUrl,
        uploadedFile: file
    });
    setIsExtracted(false); // Reset extraction state on new file
  };

  const handleExtractInfo = async () => {
    if (!formData.uploadedFile) return;

    setIsExtracting(true);
    try {
      const extractedData = await extractEventInfo(formData.uploadedFile);
      updateFormData(extractedData);
      setIsExtracted(true); // Reveal fields
    } catch (error) {
      console.error(error);
      alert('Không thể trích xuất thông tin. Vui lòng thử lại hoặc nhập thủ công.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQrUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => updateFormData({ qrCodeImage: file, qrCodePreview: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePoster(formData);
      setGeneratedImage(result);
      
      // Add to history
      const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          image: result,
          createdAt: Date.now()
      };
      setHistory(prev => [newHistoryItem, ...prev]);

      // Auto switch view or scroll
      if (window.innerWidth < 1024) {
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const openHistoryItem = (img: string) => {
      setGeneratedImage(img);
      setPreviewOpen(true);
  };

  // --- RENDER HELPERS ---

  const renderSectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <div className="text-misa-blue">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
    </div>
  );

  const renderInputField = (
    label: string, 
    value: string, 
    field: keyof EventFormData, 
    placeholder: string,
    isTextArea = false
  ) => (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {isTextArea ? (
        <textarea
            value={value}
            onChange={(e) => updateFormData({ [field]: e.target.value })}
            className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-misa-blue/50 focus:border-misa-blue transition-all text-lg min-h-[100px] shadow-sm"
            placeholder={placeholder}
        />
      ) : (
        <input
            type="text"
            value={value}
            onChange={(e) => updateFormData({ [field]: e.target.value })}
            className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-misa-blue/50 focus:border-misa-blue transition-all text-lg shadow-sm"
            placeholder={placeholder}
        />
      )}
    </div>
  );

  // Condition to show General Info and Contact Info
  // Show always in Manual mode.
  // Show in Auto mode ONLY if extracted.
  const showInfoSections = mode === 'manual' || (mode === 'auto' && isExtracted);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-10">
      <Header />

      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR - CONTROLS */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-fit">
            
            {/* Mode Tabs */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex overflow-x-auto">
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  mode === 'manual' ? 'bg-misa-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" /> Thông tin sự kiện
              </button>
              
              <button
                onClick={() => setMode('history')}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  mode === 'history' ? 'bg-misa-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <History className="w-4 h-4" /> Lịch sử
              </button>
            </div>

            {/* Main Form Content */}
            {mode === 'library' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <TemplateLibrary 
                        onSelectBackground={(bg) => updateFormData({ selectedBackground: bg, useUploadedBackground: true })} 
                        selectedBackground={formData.selectedBackground}
                        aspectRatio={formData.aspectRatio}
                    />
                </div>
            ) : mode === 'history' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <History className="w-6 h-6 text-misa-blue" />
                        Lịch sử thiết kế
                    </h3>
                    {history.length === 0 ? (
                         <div className="text-center py-12 text-gray-400">
                             <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                             <p>Chưa có hình ảnh nào được tạo</p>
                         </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {history.map((item) => (
                                <div key={item.id} className="group relative rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                    <img src={item.image} alt="History" className="w-full aspect-[2/3] object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => openHistoryItem(item.image)}
                                            className="p-2 bg-white rounded-full text-gray-800 hover:bg-blue-50"
                                            title="Xem"
                                        >
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <a 
                                            href={item.image} 
                                            download={`MISA-History-${item.createdAt}.png`}
                                            className="p-2 bg-white rounded-full text-gray-800 hover:bg-green-50"
                                            title="Tải về"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                                        <p className="text-[10px] text-white text-center">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                
                {/* 1. AUTO UPLOAD SECTION (HIDDEN if mode != auto, which is now hidden from tabs) */}
                {mode === 'auto' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-6">
                    {renderSectionHeader(<Sparkles className="w-5 h-5" />, "Upload Tài liệu")}
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer group">
                                <div className="h-24 border-2 border-dashed border-blue-300 rounded-xl bg-white flex flex-col items-center justify-center gap-2 group-hover:bg-blue-50 transition-colors">
                                    <UploadCloud className="w-8 h-8 text-misa-blue" />
                                    <span className="text-xs font-medium text-blue-900 text-center">
                                        Chọn file (.doc, .docx, .odt, .pdf, .jpg)
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    accept=".doc,.docx,.odt,.pdf,.jpg,.jpeg,.png" 
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                        
                        {formData.uploadedFileName && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                        {formData.uploadedFileName}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleExtractInfo}
                                    disabled={isExtracting}
                                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isExtracting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                                    {isExtracting ? 'Đang đọc...' : 'Trích xuất'}
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
                )}

                {/* 2. GENERAL INFO SECTION */}
                {showInfoSections && (
                  <div className="animate-in fade-in slide-in-from-top-4">
                    {renderSectionHeader(<FileText className="w-5 h-5" />, "Thông tin chung")}
                    
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <button
                        onClick={() => updateFormData({ aspectRatio: '16:9' })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          formData.aspectRatio === '16:9'
                            ? 'border-misa-blue bg-blue-50 text-misa-blue font-bold shadow-md'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Layout className="w-6 h-6 mb-2" />
                        <span className="text-sm">Ngang (16:9)</span>
                      </button>
                      <button
                        onClick={() => updateFormData({ aspectRatio: '3:4' })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          formData.aspectRatio === '3:4'
                            ? 'border-misa-blue bg-blue-50 text-misa-blue font-bold shadow-md'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Layout className="w-6 h-6 mb-2 rotate-90" />
                        <span className="text-sm">Dọc (3:4)</span>
                      </button>
                    </div>

                    {renderInputField("Loại sự kiện", formData.eventType, "eventType", "VD: Hội thảo, Hội nghị, Lớp tập huấn...")}

                    {renderInputField("Tên sự kiện", formData.eventName, "eventName", "VD: Hội thảo Chuyển đổi số...", true)}
                    
                    <div className="grid grid-cols-2 gap-4">
                        {renderInputField("Ngày", formData.date, "date", "DD/MM/YYYY")}
                        {renderInputField("Giờ", formData.time, "time", "14:00 - 16:30")}
                    </div>

                    {renderInputField("Đối tượng tham gia", formData.targetAudience, "targetAudience", "VD: Giám đốc doanh nghiệp, Kế toán trưởng")}

                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hình thức tổ chức</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg bg-white w-full hover:bg-gray-50">
                                <input 
                                    type="radio" 
                                    name="onlineType" 
                                    checked={formData.isOnline} 
                                    onChange={() => updateFormData({ isOnline: true, locationOrPlatform: 'Zoom Online' })}
                                    className="text-misa-blue focus:ring-misa-blue"
                                />
                                <span className="text-base">Online (Zoom)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg bg-white w-full hover:bg-gray-50">
                                <input 
                                    type="radio" 
                                    name="onlineType" 
                                    checked={!formData.isOnline} 
                                    onChange={() => updateFormData({ isOnline: false, locationOrPlatform: '' })}
                                    className="text-misa-blue focus:ring-misa-blue"
                                />
                                <span className="text-base">Offline</span>
                            </label>
                        </div>
                    </div>

                    {!formData.isOnline && renderInputField("Địa điểm", formData.locationOrPlatform, "locationOrPlatform", "VD: Tầng 3, Khách sạn Melia Hà Nội")}
                  </div>
                )}
                
                {/* 3. AGENDA */}
                {showInfoSections && (
                    <div className="animate-in fade-in slide-in-from-top-4">
                        {renderSectionHeader(<CalendarClock className="w-5 h-5" />, "Chương trình (Agenda)")}
                        <AgendaSection 
                            agenda={formData.agenda}
                            onChange={(agenda) => updateFormData({ agenda })}
                        />
                    </div>
                )}

                {/* 4. SPEAKERS - Always visible or usually relevant */}
                <div className="animate-in fade-in slide-in-from-top-6">
                  <SpeakerSection 
                    speakers={formData.speakers}
                    onChange={(speakers) => updateFormData({ speakers })}
                  />
                </div>

                {/* 5. VISUALS */}
                <div className="animate-in fade-in slide-in-from-top-8">
                  {renderSectionHeader(<Palette className="w-5 h-5" />, "Giao diện & Hình ảnh")}
                  
                  {/* Theme Tone Dropdown */}
                  <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tone màu chủ đạo</label>
                      <select
                        value={formData.themeTone}
                        onChange={(e) => updateFormData({ themeTone: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-misa-blue/50 focus:border-misa-blue transition-all text-base appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                      >
                        {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      {formData.themeTone === 'Tùy chỉnh' && (
                          <input
                            type="text"
                            value={formData.customThemePrompt || ''}
                            onChange={(e) => updateFormData({ customThemePrompt: e.target.value })}
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Nhập màu sắc mong muốn..."
                          />
                      )}
                  </div>

                  {/* Topics (Multi-select) */}
                  <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ đề (Chọn tối đa 2)</label>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map(topic => (
                          <button
                            key={topic}
                            onClick={() => handleTopicToggle(topic)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              formData.themeTopics.includes(topic)
                                ? 'bg-misa-blue text-white border-misa-blue'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {topic}
                            {formData.themeTopics.includes(topic) && <CheckCircle2 className="w-3 h-3 inline ml-1"/>}
                          </button>
                        ))}
                      </div>
                      {formData.themeTopics.includes('Tùy chỉnh') && (
                          <input
                            type="text"
                            value={formData.customTopicPrompt || ''}
                            onChange={(e) => updateFormData({ customTopicPrompt: e.target.value })}
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Nhập chủ đề mong muốn..."
                          />
                      )}
                  </div>
                </div>

                {/* 6. LOGOS */}
                <div className="animate-in fade-in slide-in-from-top-10">
                    {renderSectionHeader(<Target className="w-5 h-5" />, "Logo Thương hiệu")}
                    <LogoSection 
                        formData={formData}
                        onChange={updateFormData}
                    />
                </div>

                {/* 7. QR CODE */}
                <div className="animate-in fade-in slide-in-from-top-10">
                   {renderSectionHeader(<QrCode className="w-5 h-5" />, "QR Code Đăng ký")}
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                          <input 
                            type="checkbox" 
                            id="useQr"
                            checked={formData.includeQrCode}
                            onChange={(e) => updateFormData({ includeQrCode: e.target.checked })}
                            className="w-5 h-5 text-misa-blue rounded focus:ring-misa-blue"
                          />
                          <label htmlFor="useQr" className="text-sm font-medium text-gray-800 cursor-pointer">
                              Chèn QR Code đăng ký
                          </label>
                      </div>

                      {formData.includeQrCode && (
                          <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                              <label className="flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors relative overflow-hidden">
                                  {formData.qrCodePreview ? (
                                      <>
                                        <img src={formData.qrCodePreview} alt="QR" className="w-full h-full object-contain p-2" />
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFormData({ qrCodeImage: null, qrCodePreview: null });
                                            }}
                                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500"
                                        >
                                            <X className="w-3 h-3"/>
                                        </button>
                                      </>
                                  ) : (
                                      <>
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-[10px] text-gray-500 text-center px-1">Upload ảnh QR</span>
                                      </>
                                  )}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])} />
                              </label>
                              <p className="text-xs text-gray-500 mt-2">
                                  *Nếu không upload, hệ thống sẽ chèn 1 ô trắng để bạn tự dán QR sau.
                              </p>
                          </div>
                      )}
                   </div>
                </div>

                {/* 8. CONTACT INFO */}
                {showInfoSections && (
                  <div className="animate-in fade-in slide-in-from-top-12">
                    {renderSectionHeader(<MapPin className="w-5 h-5" />, "Thông tin liên hệ")}
                    <div className="grid grid-cols-1 gap-4">
                        {renderInputField("Tên người liên hệ", formData.contactName, "contactName", "Nguyễn Văn A")}
                        <div className="grid grid-cols-2 gap-4">
                            {renderInputField("SĐT", formData.contactPhone, "contactPhone", "0909xxxxxx")}
                            {renderInputField("Email", formData.contactEmail, "contactEmail", "email@example.com")}
                        </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            )}
            
            {/* Generate Action Bar */}
            {(mode === 'manual' || mode === 'auto' || mode === 'library') && (
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200 sticky bottom-4 z-10">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isGenerating ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Đang thiết kế...
                    </>
                    ) : (
                    <>
                        <Wand2 className="w-6 h-6" />
                        TẠO THƯ MỜI NGAY
                    </>
                    )}
                </button>
                </div>
            )}
          </div>

          {/* RIGHT SIDE - PREVIEW */}
          <div className="lg:col-span-7 xl:col-span-8 h-fit lg:sticky lg:top-24" ref={resultRef}>
             <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-misa-blue" />
                        Kết quả thiết kế
                    </h3>
                    {generatedImage && (
                        <div className="flex gap-2">
                             <a 
                                href={generatedImage} 
                                download="MISA-Event-Poster.png"
                                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
                            >
                                <Download className="w-4 h-4" /> Tải về
                            </a>
                            <button 
                                onClick={() => setPreviewOpen(true)}
                                className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm"
                            >
                                <Maximize2 className="w-4 h-4" /> Xem lớn
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    {generatedImage ? (
                        <img 
                            src={generatedImage} 
                            alt="Generated Poster" 
                            className="max-h-[80vh] w-auto object-contain shadow-2xl rounded-sm ring-4 ring-white"
                        />
                    ) : (
                        <div className="text-center text-gray-400 max-w-md">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Sparkles className="w-12 h-12 text-blue-200" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-600 mb-2">Chưa có thiết kế nào</h4>
                            <p className="text-gray-500">
                                Điền thông tin sự kiện ở cột bên trái và bấm nút "Tạo thư mời ngay" để AI thiết kế cho bạn.
                            </p>
                        </div>
                    )}
                    
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <div className="w-20 h-20 border-4 border-blue-200 border-t-misa-blue rounded-full animate-spin mb-4"></div>
                            <h3 className="text-xl font-bold text-misa-blue animate-pulse">Đang vẽ thiết kế...</h3>
                            <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong giây lát</p>
                        </div>
                    )}
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Fullscreen Preview Modal */}
      {previewOpen && generatedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
             <button 
                onClick={() => setPreviewOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
            >
                <X className="w-8 h-8" />
            </button>
            <img 
                src={generatedImage} 
                alt="Full Preview" 
                className="max-h-[90vh] max-w-[95vw] object-contain shadow-2xl rounded"
            />
            <div className="mt-4 flex gap-4">
                <a 
                    href={generatedImage} 
                    download="MISA-Event-Poster.png"
                    className="flex items-center gap-2 bg-misa-blue text-white px-6 py-3 rounded-full font-bold hover:bg-misa-dark transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Download className="w-5 h-5" /> Tải về máy
                </a>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
