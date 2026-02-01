/**
 * Image Utilities
 * Compression and processing utilities for uploaded images
 */

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Compress an image file to be under 2MB and max 1920px
 */
export async function compressImage(file: File): Promise<File> {
  // If already small enough and correct format, return as-is
  if (file.size <= MAX_SIZE && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    const img = await loadImage(file);
    if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
      return file;
    }
  }

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate new dimensions
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob with compression
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  // If still too large, reduce quality further
  if (blob.size > MAX_SIZE) {
    return compressWithQuality(canvas, 0.7);
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  });
}

/**
 * Compress with specific quality setting
 */
async function compressWithQuality(canvas: HTMLCanvasElement, quality: number): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      quality
    );
  });

  // If still too large and quality can be reduced, try again
  if (blob.size > MAX_SIZE && quality > 0.3) {
    return compressWithQuality(canvas, quality - 0.1);
  }

  return new File([blob], 'image.jpg', { type: 'image/jpeg' });
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert file to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type);
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.width, height: img.height };
}
