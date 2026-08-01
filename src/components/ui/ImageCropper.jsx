import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { X, Check } from 'lucide-react';

export function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      setIsCropping(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-[18px] text-gray-900 font-sans tracking-tight">Adjust Image</h3>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full h-[350px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-6 bg-white space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Zoom</label>
              <span className="text-[12px] font-medium text-gray-500 font-sans">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-[#5D8B66]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel} 
              disabled={isCropping}
              className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl font-bold font-sans text-[14px] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleCrop} 
              disabled={isCropping}
              className="flex-1 py-3.5 bg-[#5D8B66] hover:bg-[#43674F] text-white rounded-2xl font-bold font-sans text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isCropping ? "Cropping..." : <><Check className="w-4 h-4" /> Confirm Crop</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
