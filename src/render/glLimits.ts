/**
 * WebGL constants Expo GL actually accepts, and the float formats it must never see.
 * Values match the WebGL 2 / OpenGL ES enums expo-gl publishes.
 */

export const GL = {
  FLOAT: 0x1406,
  HALF_FLOAT: 0x140b,
  UNSIGNED_BYTE: 0x1401,
  RGBA: 0x1908,
  RGBA8: 0x8058,
  RGBA16F: 0x881a,
  RGBA32F: 0x8814,
  RG16F: 0x822f,
  RG32F: 0x8230,
  R16F: 0x822d,
  R32F: 0x822e,
  R11F_G11F_B10F: 0x8c3a,
  DEPTH_COMPONENT32F: 0x8cac,
  DEPTH32F_STENCIL8: 0x8cad,
  UNPACK_ALIGNMENT: 0x0cf5,
  UNPACK_FLIP_Y_WEBGL: 0x9240,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
  UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
} as const;

/** expo-gl implements these two pixelStorei parameters and logs (then skips) every other one. */
export const ALLOWED_PIXEL_STORE = new Set<number>([GL.UNPACK_ALIGNMENT, GL.UNPACK_FLIP_Y_WEBGL]);

const FLOAT_TYPES = new Set<number>([GL.FLOAT, GL.HALF_FLOAT]);

const FLOAT_INTERNAL = new Set<number>([
  GL.RGBA16F,
  GL.RGBA32F,
  GL.RG16F,
  GL.RG32F,
  GL.R16F,
  GL.R32F,
  GL.R11F_G11F_B10F,
  GL.DEPTH_COMPONENT32F,
  GL.DEPTH32F_STENCIL8,
]);

export function isFloatTexelType(type: number | undefined): boolean {
  return type !== undefined && FLOAT_TYPES.has(type);
}

export function isFloatInternalFormat(format: number | undefined): boolean {
  return format !== undefined && FLOAT_INTERNAL.has(format);
}

/** A texImage2D / texStorage / renderbuffer call three would use for HDR or the DFG LUT. */
export function isUnsafeTextureUpload(
  internalFormat: number | undefined,
  type: number | undefined,
): boolean {
  return (
    isFloatTexelType(type) || isFloatInternalFormat(internalFormat) || isFloatInternalFormat(type)
  );
}
