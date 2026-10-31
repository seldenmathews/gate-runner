import { ALLOWED_PIXEL_STORE, GL, isUnsafeTextureUpload } from '../glLimits';

describe('expo-gl limits', () => {
  it('allows only the pixelStorei parameters Expo GL implements', () => {
    expect(ALLOWED_PIXEL_STORE.has(GL.UNPACK_ALIGNMENT)).toBe(true);
    expect(ALLOWED_PIXEL_STORE.has(GL.UNPACK_FLIP_Y_WEBGL)).toBe(true);
    expect(ALLOWED_PIXEL_STORE.has(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(false);
    expect(ALLOWED_PIXEL_STORE.has(GL.UNPACK_COLORSPACE_CONVERSION_WEBGL)).toBe(false);
  });

  it('treats half-float and float uploads as unsafe', () => {
    expect(isUnsafeTextureUpload(GL.RGBA16F, GL.HALF_FLOAT)).toBe(true);
    expect(isUnsafeTextureUpload(GL.RG16F, GL.HALF_FLOAT)).toBe(true);
    expect(isUnsafeTextureUpload(GL.RGBA32F, GL.FLOAT)).toBe(true);
    expect(isUnsafeTextureUpload(GL.DEPTH_COMPONENT32F, undefined)).toBe(true);
    expect(isUnsafeTextureUpload(GL.RGBA8, GL.UNSIGNED_BYTE)).toBe(false);
    expect(isUnsafeTextureUpload(undefined, undefined)).toBe(false);
  });
});
