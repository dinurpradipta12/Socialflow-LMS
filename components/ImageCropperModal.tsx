
import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio: number; // e.g., 16/9 or 1
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  title?: string;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ 
  imageSrc, 
  aspectRatio, 
  onCropComplete, 
  onCancel,
  title = "Sesuaikan Gambar"
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const contW = container.offsetWidth;
      const contH = container.offsetHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const contAspect = contW / contH;

      let dW, dH;
      if (imgAspect > contAspect) {
        dW = contW;
        dH = contW / imgAspect;
      } else {
        dH = contH;
        dW = contH * imgAspect;
      }

      setImgNaturalSize({ 
        width: img.naturalWidth, 
        height: img.naturalHeight,
        displayWidth: dW,
        displayHeight: dH
      });
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageSrc, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container || !imgNaturalSize.width) return;

    const targetWidth = aspectRatio > 1 ? 1280 : 800;
    const targetHeight = targetWidth / aspectRatio;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale mapping display to canvas
    const scale = targetWidth / container.offsetWidth;

    // Calculate image dimensions on canvas
    const drawWidth = imgNaturalSize.displayWidth * zoom * scale;
    const drawHeight = imgNaturalSize.displayHeight * zoom * scale;

    // Calculate center-based coordinates
    const drawX = (canvas.width / 2) - (drawWidth / 2) + (position.x * scale);
    const drawY = (canvas.height / 2) - (drawHeight / 2) + (position.y * scale);

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    onCropComplete(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl animate-in zoom-in-95 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Geser untuk memposisikan foto</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div 
          className="relative w-full overflow-hidden cursor-move touch-none mb-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 shadow-inner group"
          ref={containerRef}
          style={{ aspectRatio: `${aspectRatio}` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Mask Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none ring-[1px] ring-white/20">
             <div className="w-full h-full border-[2px] border-violet-500/30 flex items-center justify-center">
                <div className="w-full h-[0.5px] bg-white/20 absolute top-1/3"></div>
                <div className="w-full h-[0.5px] bg-white/20 absolute top-2/3"></div>
                <div className="h-full w-[0.5px] bg-white/20 absolute left-1/3"></div>
                <div className="h-full w-[0.5px] bg-white/20 absolute left-2/3"></div>
             </div>
          </div>

          <img 
            ref={imageRef}
            src={imageSrc} 
            className="absolute pointer-events-none select-none max-w-none origin-center"
            style={{
              width: `${imgNaturalSize.displayWidth}px`,
              height: `${imgNaturalSize.displayHeight}px`,
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              left: '50%',
              top: '50%',
              marginLeft: `-${imgNaturalSize.displayWidth / 2}px`,
              marginTop: `-${imgNaturalSize.displayHeight / 2}px`,
              visibility: imgNaturalSize.width ? 'visible' : 'hidden'
            }}
            alt="Crop content"
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 md:gap-6 bg-slate-50 p-4 rounded-2xl">
            <svg className="w-5 h-5 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            <input 
              type="range" min="0.5" max="4" step="0.01" value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-violet-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[11px] font-black text-violet-600 w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={onCancel} className="flex-1 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all">Batal</button>
            <button onClick={handleSave} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-[0.98] transition-all uppercase tracking-widest">Terapkan Foto</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
