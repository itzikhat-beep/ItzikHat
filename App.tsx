
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus,
  Type, 
  Barcode as BarcodeIcon, 
  Trash2, 
  Printer, 
  ChevronRight,
  ChevronLeft, 
  AlignRight,
  AlignCenter,
  AlignLeft,
  Image as ImageIcon,
  Eye,
  X,
  Sparkles,
  Database,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  User,
  Hash,
  MapPin,
  Files,
  Check,
  Palette,
  Type as TypeIcon,
  Layout,
  Square,
  Circle,
  RectangleHorizontal,
  Shapes,
  QrCode as QrCodeIcon,
  LogOut,
  Save,
  Maximize2,
  ChevronDown,
  Moon,
  Sun,
  Languages,
  Accessibility,
  UserCircle,
  Upload,
  Layers,
  Minus as LineIcon,
  Calendar,
  RefreshCw,
  Code,
  Copy,
  Download,
  Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerElement, StickerConfig, ElementType } from './types';
import { Barcode } from './components/Barcode';
import { QRCode } from './components/QRCode';

const INITIAL_CONFIG: StickerConfig = {
  width: 400,
  height: 400,
  unit: 'px',
  padding: 20,
  borderRadius: 0,
  backgroundColor: '#ffffff'
};

const getTodayDate = () => new Date().toLocaleDateString('he-IL');

const AVAILABLE_PARAMETERS = [
  { label: 'שם לקוח', key: 'customerName', defaultTitle: 'שם לקוח: ', sampleValue: 'ישראל ישראלי', icon: User },
  { label: 'מספר הזמנה', key: 'orderNumber', defaultTitle: 'מספר הזמנה: ', sampleValue: 'ORD-2025-001', icon: Hash },
  { label: 'העתק / כמות', key: 'copyCount', defaultTitle: 'העתק ', sampleValue: '1 מתוך 10', icon: Files },
  { label: 'כתובת', key: 'address', defaultTitle: 'כתובת: ', sampleValue: 'רחוב הרצל 12, תל אביב', icon: MapPin },
];

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7'
];

type SizePreset = '10x10' | '10x15' | '15x15' | '5x10' | '20x15' | 'custom';

const App: React.FC = () => {
  const [elements, setElements] = useState<StickerElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<StickerConfig>(INITIAL_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [sizePreset, setSizePreset] = useState<SizePreset>('10x10');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: -40 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingElement = useMemo(() => elements.find(el => el.id === selectedId), [elements, selectedId]);

  // Mouse wheel zoom and pan logic
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      // If Ctrl is pressed, zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(4.0, Math.max(0.1, prev + delta)));
      } 
      // If Shift is pressed, pan horizontally
      else if (e.shiftKey) {
        e.preventDefault();
        setPanOffset(prev => ({ ...prev, x: prev.x - e.deltaY }));
      }
      // Otherwise, pan vertically
      else {
        e.preventDefault();
        setPanOffset(prev => ({ ...prev, y: prev.y - e.deltaY }));
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  // Close profile on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const deleteElement = useCallback((id: string) => {
    setElements(elements => elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const resetSticker = useCallback(() => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את המדבקה? כל האלמנטים יימחקו.')) {
      setElements([]);
      setSelectedId(null);
      setConfig(INITIAL_CONFIG);
      setSizePreset('10x10');
      setZoom(1.0);
      setPanOffset({ x: 0, y: -40 });
    }
  }, []);

  const generateHTML = useCallback(() => {
    const stickerStyles = `
      position: relative;
      width: ${config.width}px;
      height: ${config.height}px;
      background-color: ${config.backgroundColor};
      overflow: hidden;
      border: 1px solid #ddd;
      font-family: 'Assistant', sans-serif;
      direction: rtl;
    `;

    const elementsHTML = elements.map(el => {
      const commonStyles = `
        position: absolute;
        left: ${el.x}px;
        top: ${el.y}px;
        width: ${el.width}px;
        height: ${el.height}px;
        color: ${el.color};
        text-align: ${el.textAlign};
        font-size: ${el.fontSize}px;
        font-weight: ${el.fontWeight};
        display: flex;
        align-items: center;
        justify-content: ${el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-start' : 'flex-end'};
        ${el.backgroundColor ? `background-color: ${el.backgroundColor};` : ''}
        ${el.borderWidth ? `border: ${el.borderWidth}px solid ${el.borderColor};` : ''}
        ${el.type === 'shape' && el.shapeType === 'circle' ? 'border-radius: 50%;' : ''}
      `;

      let content = '';
      if (el.type === 'text' || el.type === 'dynamic') {
        const text = el.type === 'dynamic' ? `${el.content}${el.sampleValue || ''}` : el.content;
        content = `<div style="width: 100%; padding: 0 4px; overflow: hidden; white-space: nowrap;">${text}</div>`;
      } else if (el.type === 'barcode') {
        content = `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="flex: 1; width: 100%; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);"></div>
          ${!el.hideBarcodeText ? `<div style="font-size: 10px; margin-top: 2px; font-family: monospace;">${el.content}</div>` : ''}
        </div>`;
      } else if (el.type === 'qr') {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(el.content)}`;
        content = `<img src="${qrUrl}" style="width: 100%; height: 100%; object-fit: contain;" />`;
      } else if (el.type === 'image') {
        content = `<img src="${el.content}" style="width: 100%; height: 100%; object-fit: contain;" />`;
      } else if (el.type === 'shape' && el.shapeType === 'line') {
        content = `<div style="width: 100%; height: 100%; background-color: ${el.borderColor};"></div>`;
      }

      return `  <div style="${commonStyles.replace(/\s+/g, ' ').trim()}">\n    ${content}\n  </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #f0f0f0; }
    .sticker-container { ${stickerStyles.replace(/\s+/g, ' ').trim()} }
  </style>
</head>
<body>
<div class="sticker-container">
${elementsHTML}
</div>
</body>
</html>`;
  }, [config, elements]);

  const downloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comax-label.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html);
    alert('הקוד הועתק לקליפבורד!');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isTyping) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteElement]);

  const addElement = (type: ElementType, x: number, y: number, initialContent?: string, fieldKey?: string, shapeType: 'rect' | 'circle' | 'line' = 'rect') => {
    const width = type === 'barcode' ? 180 : type === 'image' ? 120 : type === 'qr' ? 80 : type === 'shape' ? (shapeType === 'line' ? 200 : 80) : 250;
    const height = type === 'barcode' ? 80 : type === 'image' ? 120 : type === 'qr' ? 80 : type === 'shape' ? (shapeType === 'line' ? 2 : 80) : 50;
    
    const defaultParams = fieldKey ? AVAILABLE_PARAMETERS.find(p => p.key === fieldKey) : null;
    
    let sampleValue = defaultParams?.sampleValue || '';
    if (fieldKey === 'currentDate' && !sampleValue) {
      sampleValue = getTodayDate();
    }

    const newElement: StickerElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      shapeType: type === 'shape' ? shapeType : undefined,
      fieldKey,
      x: x - (width / 2),
      y: y - (height / 2),
      width,
      height,
      content: initialContent || (type === 'barcode' ? '7290000000000' : type === 'qr' ? 'https://comax.co.il' : 'טקסט חדש'),
      sampleValue,
      fontSize: 18,
      fontFamily: 'Assistant',
      color: '#000000',
      backgroundColor: type === 'shape' && shapeType !== 'line' ? 'transparent' : 'transparent',
      borderColor: type === 'shape' ? '#000000' : 'transparent',
      borderWidth: type === 'shape' ? (shapeType === 'line' ? 0 : 2) : 0,
      fontWeight: 'normal',
      textAlign: 'right',
      rotation: 0,
      barcodeStyle: type === 'barcode' ? 'standard' : undefined
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const content = readerEvent.target?.result as string;
        addElement('image', config.width / 2, config.height / 2, content);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id: string, updates: Partial<StickerElement> | ((el: StickerElement) => Partial<StickerElement>)) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const u = typeof updates === 'function' ? updates(el) : updates;
        return { ...el, ...u };
      }
      return el;
    }));
  };

  const handleResize = (e: React.MouseEvent, el: StickerElement, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.width;
    const startH = el.height;
    const startPosX = el.x;
    const startPosY = el.y;
    const ratio = startW / startH;
    const isAspectLocked = el.type === 'barcode' || el.type === 'qr' || el.type === 'image';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (handle.includes('e')) newW = Math.max(1, startW + dx);
      if (handle.includes('w')) {
        newW = Math.max(1, startW - dx);
        newX = startPosX + (startW - newW);
      }
      if (handle.includes('s')) newH = Math.max(1, startH + dy);
      if (handle.includes('n')) {
        newH = Math.max(1, startH - dy);
        newY = startPosY + (startH - newH);
      }

      if (isAspectLocked && (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
         if (Math.abs(dx) > Math.abs(dy)) {
            newH = newW / ratio;
         } else {
            newW = newH * ratio;
         }
      }

      updateElement(el.id, { width: newW, height: newH, x: newX, y: newY });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDrag = (e: React.MouseEvent, el: StickerElement) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = el.x;
    const startPosY = el.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      updateElement(el.id, { x: startPosX + dx, y: startPosY + dy });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const fitToScreen = useCallback(() => {
    if (!viewportRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth - 100;
    const viewportHeight = viewportRef.current.clientHeight - 150;
    const scaleX = viewportWidth / config.width;
    const scaleY = viewportHeight / config.height;
    setZoom(Math.min(scaleX, scaleY, 2.0));
    setPanOffset({ x: 0, y: -40 });
  }, [config.width, config.height]);

  const handlePresetChange = (preset: SizePreset) => {
    setSizePreset(preset);
    if (preset === '10x10') setConfig(prev => ({ ...prev, width: 400, height: 400 }));
    else if (preset === '10x15') setConfig(prev => ({ ...prev, width: 400, height: 600 }));
    else if (preset === '15x15') setConfig(prev => ({ ...prev, width: 600, height: 600 }));
    else if (preset === '5x10') setConfig(prev => ({ ...prev, width: 400, height: 200 }));
    else if (preset === '20x15') setConfig(prev => ({ ...prev, width: 800, height: 600 }));
    setTimeout(fitToScreen, 50);
  };

  const getDisplayContent = (el: StickerElement) => {
    if (el.type === 'barcode' || el.type === 'image' || el.type === 'shape' || el.type === 'qr') return el.content;
    if (el.type === 'dynamic') {
      const displayValue = el.sampleValue || '';
      return `${el.content}${displayValue}`;
    }
    return el.content;
  };

  const renderStickerContent = (isPreview: boolean) => (
    <div
      className={`relative bg-white transition-all shadow-2xl ${isPreview ? 'print-area' : ''}`}
      style={{
        width: config.width,
        height: config.height,
        transform: isPreview ? 'none' : `scale(${zoom})`,
        transformOrigin: 'center center',
      }}
    >
      {elements.map((el) => {
        const isSelected = !isPreview && selectedId === el.id;
        return (
          <div
            key={el.id}
            onMouseDown={(e) => { if(!isPreview) { setSelectedId(el.id); handleDrag(e, el); } }}
            className={`absolute select-none cursor-move ${isSelected ? 'ring-2 ring-green-500 z-50' : 'z-10'}`}
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              color: el.color,
              backgroundColor: el.backgroundColor,
              borderColor: el.borderColor,
              borderWidth: el.borderWidth,
              borderStyle: el.borderWidth ? 'solid' : 'none',
              borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : '0px',
              textAlign: el.textAlign,
              fontSize: `${el.fontSize}px`,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-start' : 'flex-end',
            }}
          >
            {el.type === 'barcode' ? (
              <Barcode value={el.content} width={el.width} height={el.height} hideText={el.hideBarcodeText} style={el.barcodeStyle} />
            ) : el.type === 'qr' ? (
              <QRCode value={el.content} width={el.width} height={el.height} />
            ) : el.type === 'image' ? (
              <img src={el.content} className="w-full h-full object-contain pointer-events-none" alt="" />
            ) : el.type === 'shape' ? (
               el.shapeType === 'line' ? <div className="w-full h-full bg-current" style={{ color: el.borderColor }} /> : null
            ) : (
              <div className="w-full px-1 overflow-hidden" style={{ direction: 'rtl' }}>{getDisplayContent(el)}</div>
            )}

            {isSelected && (
              <>
                {['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].map((h) => (
                  <div
                    key={h}
                    onMouseDown={(e) => handleResize(e, el, h)}
                    className={`absolute w-2.5 h-2.5 bg-white border border-green-500 z-[60] hover:scale-125 transition-transform
                      ${h === 'n' ? 'top-0 left-1/2 -translate-x-1/2 cursor-ns-resize' : ''}
                      ${h === 's' ? 'bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize' : ''}
                      ${h === 'e' ? 'top-1/2 right-0 -translate-y-1/2 cursor-ew-resize' : ''}
                      ${h === 'w' ? 'top-1/2 left-0 -translate-y-1/2 cursor-ew-resize' : ''}
                      ${h === 'nw' ? 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' : ''}
                      ${h === 'ne' ? 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' : ''}
                      ${h === 'sw' ? 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' : ''}
                      ${h === 'se' ? 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' : ''}
                    `}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden font-['Assistant'] transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f1f5f9] text-slate-900'}`} dir="rtl">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      <aside className={`bg-white border-l border-slate-200 flex flex-col transition-all duration-300 no-print shadow-xl z-20 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'} dark:bg-slate-900 dark:border-slate-800`}>
        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-600 p-2 rounded-xl shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
            <h1 className="text-lg font-black tracking-tight dark:text-white">Comax SmartLabel</h1>
          </div>
          <div className="space-y-6">
            <section>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">גודל מדבקה</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['5x10', '10x10', '10x15', '15x15', '20x15', 'custom'].map((id) => (
                  <button key={id} onClick={() => handlePresetChange(id as SizePreset)} className={`p-3 rounded-xl transition-all border text-xs font-bold ${sizePreset === id ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-green-400 text-slate-600 dark:bg-slate-800 dark:border-slate-700'}`}>
                    {id === 'custom' ? 'מותאם אישית' : id.replace('x', ' × ')}
                  </button>
                ))}
              </div>
              {sizePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">רוחב (PX)</label>
                    <input type="number" value={config.width} onChange={(e) => setConfig(prev => ({...prev, width: Number(e.target.value)}))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-bold outline-none focus:border-green-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">גובה (PX)</label>
                    <input type="number" value={config.height} onChange={(e) => setConfig(prev => ({...prev, height: Number(e.target.value)}))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-bold outline-none focus:border-green-500" />
                  </div>
                </div>
              )}
            </section>
            <section>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">הוספה מהירה</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'text', icon: Type, label: 'טקסט' },
                  { id: 'barcode', icon: BarcodeIcon, label: 'ברקוד' },
                  { id: 'qr', icon: QrCodeIcon, label: 'QR' },
                  { id: 'image', icon: ImageIcon, label: 'לוגו' },
                  { id: 'shape', icon: Shapes, label: 'צורות' },
                  { id: 'date', icon: Calendar, label: 'תאריך' }
                ].map((item) => (
                  <button key={item.id} onClick={() => {
                    if (item.id === 'image') {
                      fileInputRef.current?.click();
                    } else if (item.id === 'date') {
                      addElement('dynamic', config.width/2, config.height/2, 'תאריך: ', 'currentDate');
                    } else {
                      addElement(item.id as any, config.width/2, config.height/2, undefined, undefined, item.id === 'shape' ? 'rect' : 'rect');
                    }
                  }} className="flex flex-col items-center p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <item.icon className="w-5 h-5 text-slate-400 group-hover:text-green-600 mb-1" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">פרמטרים</h2>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PARAMETERS.map(p => (
                  <button key={p.key} onClick={() => addElement('dynamic', config.width/2, config.height/2, p.defaultTitle, p.key)} className="flex flex-col items-center p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <p.icon className="w-5 h-5 text-slate-400 group-hover:text-green-600 mb-1" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">{p.label}</span>
                  </button>
                ))}
              </div>
            </section>
            
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

            <section>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">פעולות</h2>
              <button 
                onClick={resetSticker} 
                className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl transition-all font-bold text-xs"
              >
                <Trash2 className="w-4 h-4" />
                איפוס וניקוי המדבקה
              </button>
              <p className="mt-2 text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                רמז: Ctrl + גלגלת העכבר לשינוי זום <br />
                Shift + גלגלת להזזה אופקית
              </p>
            </section>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-40 no-print shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 dark:hover:bg-slate-800">
              {isSidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-white">COMAX SmartLabel Editor</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <button onClick={() => setIsPreviewOpen(true)} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="תצוגה מקדימה"><Eye className="w-5 h-5" /></button>
              <button onClick={() => setIsCodeModalOpen(true)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm" title="צפה בקוד HTML"><Code className="w-5 h-5" /></button>
              <button onClick={() => window.print()} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="הדפסה"><Printer className="w-5 h-5" /></button>
              <button onClick={resetSticker} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm" title="איפוס מדבקה"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={() => alert('נשמר!')} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="שמירה"><Save className="w-5 h-5" /></button>
            </div>

            <div className="relative" ref={profileRef}>
               <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs border border-green-100">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
               </button>
               <AnimatePresence>
                 {isProfileOpen && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] dark:bg-slate-900 dark:border-slate-800">
                     <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <span className="block font-bold text-slate-800 dark:text-white">משתמש קומקס</span>
                        <span className="text-[10px] text-slate-400">ניהול מערכת</span>
                     </div>
                     <div className="p-2">
                        <button onClick={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-600 dark:text-slate-300">
                           <div className="flex items-center gap-3">{isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} מצב כהה</div>
                           <div className={`w-8 h-4 rounded-full transition-all relative ${isDarkMode ? 'bg-green-600' : 'bg-slate-200'}`} />
                        </button>
                        <button onClick={() => setLanguage(l => l === 'he' ? 'en' : 'he')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-600 dark:text-slate-300"><Languages className="w-4 h-4" /> שפה ({language === 'he' ? 'HEB' : 'ENG'})</button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-all text-sm font-bold text-rose-500"><LogOut className="w-4 h-4" /> התנתקות</button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </header>

        <div ref={viewportRef} className={`flex-1 relative pattern-dots overflow-hidden cursor-default transition-colors duration-300 ${isDarkMode ? 'dark-pattern' : ''}`}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
              {renderStickerContent(false)}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 no-print w-full max-w-[95%] px-4 z-50 pointer-events-none">
          <AnimatePresence mode="wait">
            {!editingElement ? (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white shadow-xl border border-slate-200 px-10 py-5 rounded-full flex items-center justify-between pointer-events-auto dark:bg-slate-900 dark:border-slate-800">
                <div className="flex gap-10">
                  <div className="text-center"><span className="block text-[10px] text-slate-300 font-bold uppercase">גובה</span><span className="font-bold text-slate-800 dark:text-white">{Math.round(config.height)}px</span></div>
                  <div className="text-center"><span className="block text-[10px] text-slate-300 font-bold uppercase">רוחב</span><span className="font-bold text-slate-800 dark:text-white">{Math.round(config.width)}px</span></div>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-full dark:bg-slate-800 dark:border-slate-700">
                   <button onClick={fitToScreen} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-green-600" title="התאם למסך"><Maximize className="w-4 h-4" /></button>
                   <button onClick={() => {setZoom(1.0); setPanOffset({ x: 0, y: -40 });}} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-green-600" title="איפוס מבט"><RotateCcw className="w-4 h-4" /></button>
                   <div className="w-px h-5 bg-slate-200 mx-1" />
                   <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><ZoomOut className="w-4 h-4" /></button>
                   <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 min-w-[40px] text-center" title="Ctrl+גלגלת לזום">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><ZoomIn className="w-4 h-4" /></button>
                </div>
                <div className="text-[10px] font-black text-green-600 uppercase tracking-widest">{sizePreset === 'custom' ? 'CUSTOM' : sizePreset}</div>
              </motion.div>
            ) : (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white shadow-2xl border border-slate-200 px-6 py-4 rounded-full flex items-center justify-between gap-6 pointer-events-auto text-slate-800 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex-1 flex gap-3 items-center">
                   {(editingElement.type === 'text' || editingElement.type === 'qr') && (
                     <input 
                      type="text" 
                      value={editingElement.content} 
                      onChange={(e) => updateElement(editingElement.id, { content: e.target.value })} 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-2 text-sm font-bold text-slate-700 outline-none focus:bg-white dark:bg-slate-800 dark:text-white" 
                      placeholder="ערוך תוכן..."
                    />
                   )}
                   {editingElement.type === 'dynamic' && (
                     <div className="flex-1 flex gap-2 items-center">
                        <div className="flex-1">
                          <span className="block text-[8px] text-slate-400 font-bold mb-0.5 px-3">כותרת השדה:</span>
                          <input 
                            type="text" 
                            value={editingElement.content} 
                            onChange={(e) => updateElement(editingElement.id, { content: e.target.value })} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:bg-white dark:bg-slate-800 dark:text-white" 
                            placeholder="כותרת (למשל: שם לקוח:)"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="block text-[8px] text-slate-400 font-bold mb-0.5 px-3">ערך לדוגמה:</span>
                          <input 
                            type="text" 
                            value={editingElement.sampleValue} 
                            onChange={(e) => updateElement(editingElement.id, { sampleValue: e.target.value })} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:bg-white dark:bg-slate-800 dark:text-white" 
                            placeholder="דוגמה (למשל: ישראל ישראלי)"
                          />
                        </div>
                     </div>
                   )}
                   {editingElement.type === 'barcode' && (
                     <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap ml-2">בחר עיצוב ברקוד:</span>
                        {[
                          { id: 'standard', label: 'סטנדרטי' },
                          { id: 'dense', label: 'דחוס' },
                          { id: 'wide', label: 'רחב' },
                          { id: 'minimal', label: 'ללא טקסט' }
                        ].map((s) => (
                          <button 
                            key={s.id} 
                            onClick={() => updateElement(editingElement.id, { barcodeStyle: s.id as any })}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${editingElement.barcodeStyle === s.id ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                     </div>
                   )}
                   {editingElement.type === 'shape' && (
                     <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800">
                           <button onClick={() => updateElement(editingElement.id, { shapeType: 'rect', borderWidth: 2, height: Math.max(80, editingElement.height) })} className={`p-2 rounded-full ${editingElement.shapeType === 'rect' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`} title="מלבן"><Square className="w-4 h-4" /></button>
                           <button onClick={() => updateElement(editingElement.id, { shapeType: 'circle', borderWidth: 2, height: Math.max(80, editingElement.height) })} className={`p-2 rounded-full ${editingElement.shapeType === 'circle' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`} title="עיגול"><Circle className="w-4 h-4" /></button>
                           <button onClick={() => updateElement(editingElement.id, { shapeType: 'line', borderWidth: 0, height: 2 })} className={`p-2 rounded-full ${editingElement.shapeType === 'line' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`} title="קו"><LineIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">מסגרת:</span>
                          <Minus 
                            className="w-3 h-3 text-slate-400 cursor-pointer" 
                            onClick={() => {
                              if (editingElement.shapeType === 'line') {
                                updateElement(editingElement.id, { height: Math.max(1, (editingElement.height || 0) - 1) });
                              } else {
                                updateElement(editingElement.id, { borderWidth: Math.max(0, (editingElement.borderWidth || 0) - 1) });
                              }
                            }} 
                          />
                          <span className="text-xs font-bold min-w-[15px] text-center dark:text-white">
                            {editingElement.shapeType === 'line' ? Math.round(editingElement.height) : editingElement.borderWidth}
                          </span>
                          <Plus 
                            className="w-3 h-3 text-slate-400 cursor-pointer" 
                            onClick={() => {
                              if (editingElement.shapeType === 'line') {
                                updateElement(editingElement.id, { height: (editingElement.height || 0) + 1 });
                              } else {
                                updateElement(editingElement.id, { borderWidth: (editingElement.borderWidth || 0) + 1 });
                              }
                            }} 
                          />
                        </div>
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800 overflow-x-auto max-w-[180px]">
                           <Palette className="w-4 h-4 text-slate-400 mr-1" />
                           {COLORS.map(c => (
                             <button key={c} onClick={() => updateElement(editingElement.id, { borderColor: c })} className={`w-5 h-5 rounded-full border border-white/20 flex-shrink-0 transition-transform hover:scale-110 ${editingElement.borderColor === c ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-slate-50' : ''}`} style={{ backgroundColor: c }} />
                           ))}
                        </div>
                     </div>
                   )}
                   {(editingElement.type === 'text' || editingElement.type === 'dynamic') && (
                     <>
                      <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800">
                          <button onClick={() => updateElement(editingElement.id, { textAlign: 'right' })} className={`p-2 rounded-full ${editingElement.textAlign === 'right' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}><AlignRight className="w-4 h-4" /></button>
                          <button onClick={() => updateElement(editingElement.id, { textAlign: 'center' })} className={`p-2 rounded-full ${editingElement.textAlign === 'center' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}><AlignCenter className="w-4 h-4" /></button>
                          <button onClick={() => updateElement(editingElement.id, { textAlign: 'left' })} className={`p-2 rounded-full ${editingElement.textAlign === 'left' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}><AlignLeft className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800">
                          <Minus className="w-3 h-3 text-slate-400 cursor-pointer hover:text-green-600" onClick={() => updateElement(editingElement.id, { fontSize: Math.max(8, editingElement.fontSize - 1) })} />
                          <span className="text-xs font-bold min-w-[20px] text-center dark:text-white">{editingElement.fontSize}</span>
                          <Plus className="w-3 h-3 text-slate-400 cursor-pointer hover:text-green-600" onClick={() => updateElement(editingElement.id, { fontSize: editingElement.fontSize + 1 })} />
                      </div>
                     </>
                   )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteElement(editingElement.id)} className="p-3 text-slate-400 hover:text-rose-500 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                  <button onClick={() => setSelectedId(null)} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-all shadow-lg pointer-events-auto"><Check className="w-5 h-5" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isPreviewOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md no-print" onClick={() => setIsPreviewOpen(false)}>
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">תצוגה מקדימה</h2>
                  <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-16 flex items-center justify-center">
                   {renderStickerContent(true)}
                </div>
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                  <button onClick={() => setIsPreviewOpen(false)} className="px-8 py-3 text-sm font-bold text-slate-400">חזור</button>
                  <button onClick={() => { setIsPreviewOpen(false); window.print(); }} className="px-12 py-4 bg-green-600 text-white rounded-full font-black shadow-xl hover:bg-green-700 transition-all flex items-center gap-3">
                    <Printer className="w-5 h-5" /> הדפס מדבקה
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCodeModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md no-print" onClick={() => setIsCodeModalOpen(false)}>
              <div className="bg-[#1e1e1e] rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#252525]">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg"><Code className="w-5 h-5 text-white" /></div>
                    <h2 className="text-xl font-black text-white">ייצוא קוד HTML</h2>
                  </div>
                  <button onClick={() => setIsCodeModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-auto p-0 relative group">
                  <pre className="p-8 text-indigo-300 font-mono text-sm leading-relaxed selection:bg-indigo-500/30">
                    <code>{generateHTML()}</code>
                  </pre>
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-xs font-bold border border-white/10 shadow-lg">
                      <Copy className="w-3.5 h-3.5" /> העתק קוד
                    </button>
                    <button onClick={downloadHTML} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-indigo-500/20">
                      <Download className="w-3.5 h-3.5" /> הורד קובץ
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-[#252525] border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/30 font-medium">הקוד כולל עיצוב Inline תואם למרבית המדפסות והמערכות הדיגיטליות.</span>
                  <button onClick={() => setIsCodeModalOpen(false)} className="px-8 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all border border-white/10">סגור</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .pattern-dots { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; }
        .dark-pattern { background-image: radial-gradient(#1e293b 1px, transparent 1px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        pre { white-space: pre-wrap; word-wrap: break-word; }
      `}</style>
    </div>
  );
};

export default App;
