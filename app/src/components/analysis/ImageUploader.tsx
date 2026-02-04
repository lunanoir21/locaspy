import { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ImageUploaderProps {
  onImageSelect: (imageBase64: string) => void;
  isAnalyzing: boolean;
}

export const ImageUploader = ({ onImageSelect, isAnalyzing }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      // Extract base64 without data URL prefix
      const base64 = result.split(',')[1];
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImage(files[0]);
    }
  }, [onImageSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        const base64 = result.split(',')[1];
        onImageSelect(base64);
        setShowDialog(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert('Failed to load image from URL');
    }
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (previewImage) {
    return (
      <div className="relative w-full h-full min-h-[200px] rounded-xl overflow-hidden">
        <img 
          src={previewImage} 
          alt="Preview" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button
            onClick={clearPreview}
            variant="destructive"
            className="bg-red-500/80 hover:bg-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">Analyzing...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full h-full min-h-[200px] rounded-xl border-2 border-dashed 
          cursor-pointer transition-all duration-300 overflow-hidden
          flex flex-col items-center justify-center gap-4
          ${isDragging 
            ? 'border-white/60 bg-white/10' 
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/[0.07]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-white/60" />
        </div>

        <div className="text-center">
          <p className="text-white font-medium mb-1">
            Drop your image here, or click to browse
          </p>
          <p className="text-white/40 text-sm">
            Supports JPG, PNG, WEBP up to 10MB
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/15 transition-colors text-sm"
          >
            <LinkIcon className="w-4 h-4" />
            URL
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Camera capture would go here
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/15 transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
        </div>
      </div>

      {/* URL Input Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-950 border border-white/15">
          <DialogHeader>
            <DialogTitle className="text-white">Enter Image URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDialog(false)}
                variant="outline"
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUrlSubmit}
                className="flex-1 bg-white text-black hover:bg-gray-100"
              >
                Load Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUploader;
