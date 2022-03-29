/// <reference types="react" />
import type { ImageExportOptions } from "romaine";
interface RomaineExampleProps {
    setBlob?: (blob: Blob | null) => void;
    image: string | null;
    imageExportOptions?: Partial<ImageExportOptions>;
}
/**
 * @todo 1) move the get blob button into its own file
 */
export declare const RomaineExample: ({ setBlob, image, imageExportOptions, }: RomaineExampleProps) => JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map