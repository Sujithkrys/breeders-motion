// gifenc 1.0.3 ships no type declarations; this covers the part of its API the GIF exporter uses.
declare module "gifenc" {
  export type GifPalette = number[][];
  export type GifColorFormat = "rgb565" | "rgb444" | "rgba4444";

  export interface GifFrameOptions {
    palette?: GifPalette;
    delay?: number; // milliseconds; stored in GIF centiseconds
    repeat?: number; // -1 once, 0 forever, n times
    transparent?: boolean;
    transparentIndex?: number;
    colorDepth?: number;
    dispose?: number;
    first?: boolean;
  }

  export interface GifEncoderInstance {
    writeHeader(): void;
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifFrameOptions): void;
    finish(): void;
    reset(): void;
    bytes(): Uint8Array<ArrayBuffer>;
    bytesView(): Uint8Array<ArrayBuffer>;
    readonly buffer: ArrayBuffer;
  }

  export interface QuantizeOptions {
    format?: GifColorFormat;
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GifEncoderInstance;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: QuantizeOptions): GifPalette;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: GifPalette, format?: GifColorFormat): Uint8Array;

  export default GIFEncoder;
}
