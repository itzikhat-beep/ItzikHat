
export type ElementType = 'text' | 'barcode' | 'image' | 'dynamic' | 'shape' | 'qr';

export interface StickerElement {
  id: string;
  type: ElementType;
  shapeType?: 'rect' | 'circle' | 'line';
  fieldKey?: string; // e.g., 'customerName', 'orderNumber', 'address'
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // The static text or placeholder
  sampleValue?: string; // The example text for dynamic elements
  prefix?: string; // Text before the dynamic value
  suffix?: string; // Text after the dynamic value
  fontSize: number;
  fontFamily: string;
  color: string; // Used for text color OR border color for shapes
  backgroundColor?: string; // Individual element background or fill color
  borderColor?: string;
  borderWidth?: number;
  hideBarcodeText?: boolean; // Specific for barcode display
  barcodeStyle?: 'standard' | 'dense' | 'wide' | 'minimal'; // Different visual styles
  fontWeight: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign: 'right' | 'center' | 'left' | 'justify';
  rotation: number;
  lineIndex?: number; // For line-based formatting
}

export interface StickerConfig {
  width: number;
  height: number;
  unit: 'mm' | 'px';
  padding: number;
  borderRadius: number;
  backgroundColor: string;
}
