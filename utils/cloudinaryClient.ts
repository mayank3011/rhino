// utils/cloudinaryClient.ts
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

export function cloudinaryImageUrl(publicId: string, width?: number, options: { crop?: string } = {}) {
  const base = `https://res.cloudinary.com/${CLOUD}/image/upload`;
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  const t = transforms.length ? `${transforms.join(",")}/` : "";
  return `${base}/${t}${publicId}`;
}

export function cloudinarySrcSet(publicId: string, widths = [320, 640, 1024, 1600]) {
  return widths.map(w => `${cloudinaryImageUrl(publicId, w)} ${w}w`).join(", ");
}
