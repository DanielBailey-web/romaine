/**
 * Decodes a PNG blob into ImageData.
 * For mask blobs from segmentForeground, the alpha channel holds the mask values.
 */
export async function extractMaskFromBlob(
  maskBlob: Blob
): Promise<ImageData> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(maskBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      URL.revokeObjectURL(url);
      resolve(imageData);
    };
    img.src = url;
  });
}

/**
 * Applies the mask's alpha channel onto the original image and returns a result Blob.
 * Pure pixel manipulation — no ML model inference.
 */
export async function compositeWithMask(
  originalBlob: Blob,
  maskImageData: ImageData
): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(originalBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels = imgData.data;
      const maskPixels = maskImageData.data;
      for (let i = 0; i < img.width * img.height; i++) {
        pixels[i * 4 + 3] = maskPixels[i * 4 + 3];
      }
      ctx.putImageData(imgData, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    };
    img.src = url;
  });
}
