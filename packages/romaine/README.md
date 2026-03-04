# romaine

React OpenCV Manipulation and Image Narration / Editing

## Installation

```bash
npm i romaine
# or
yarn add romaine
```

## Quick Features

- Image Cropping (regular & perspective)
- Image Rotation
- Image Flipping (horizontal & vertical)
- Image Scaling
- Background Removal (GrabCut via OpenCV.js)
- Brush-based background refinement
- Undo / Full Reset history
- PNG & JPEG export with alpha-to-white blending
- Plugin architecture for extensible commands (e.g. `@romaine-plugins/bg-remover`)

## Example

See [romaine-components](https://www.npmjs.com/package/romaine-components) for a ready-made toolbar, or build your own UI using the hooks and canvas API.

```tsx
import { Romaine } from "romaine";
import { Canvas, useRomaine } from "romaine";

function App() {
  return (
    <Romaine>
      <MyEditor />
    </Romaine>
  );
}

function MyEditor() {
  const { setMode, loaded } = useRomaine();
  return loaded ? (
    <Canvas image="/photo.jpg" maxWidth={800} maxHeight={600} />
  ) : null;
}
```

## Romaine Props

| Parameter | Type     | Description                  | Default | Context Alternative |
| :-------- | :------- | :--------------------------- | :------ | :------------------ |
| `angle`   | `number` | Turn angle for rotation tool | `90`    | `setAngle(90)`      |

## Canvas Props

| Parameter   | Type                    | Description                       | Default     |
| :---------- | :---------------------- | :-------------------------------- | :---------- |
| `image`     | `string \| File \| null` | Image source (URL, File, or null) | `null`      |
| `maxWidth`  | `number`                | Max preview width in pixels       | —           |
| `maxHeight` | `number`                | Max preview height in pixels      | —           |
| `pointSize` | `number`                | Crop point handle size            | `5`         |
| `lineWidth` | `number`                | Crop border line width            | `1`         |

## Exporting

Use a ref on `<Canvas>` to access export methods:

```tsx
const ref = useRef<RomaineRef>(null);

// Export as blob
const blob = await ref.current?.getBlob({
  type: "image/jpeg",
  quality: 0.85,
  maxSize: { width: 1920, height: 1080 },
  jpeg: { transparentToWhite: true },
});

// Export as data URL
const dataURL = await ref.current?.getDataURL({
  type: "image/png",
  maxSize: { width: 1920, height: 1080 },
});
```

### ImageExportOptions

| Parameter  | Type                                                 | Description                                                                                                  |
| :--------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `type`     | `"image/png" \| "image/jpeg" \| "image/webp" \| "keep-same"` | Output format. `"keep-same"` preserves the original file type.                                      |
| `quality`  | `number`                                             | 0–1 quality for lossy formats (JPEG default 0.92, WebP default 0.80).                                       |
| `maxSize`  | `{ width: number; height: number }`                  | Maximum export dimensions. If the image exceeds either dimension, it is downscaled proportionally to fit.    |

`getBlob` also accepts a `jpeg.transparentToWhite` option to alpha-blend transparent pixels against white before JPEG export.

> **Note:** `maxSize` only affects the exported output — it does not modify the working image. Use the `scale` mode for permanent resizing.

## Plugin Architecture

Romaine supports extensible commands via the `(string & {})` union on `RomaineCommands`. Plugins can:

- Use `canvasApi` ref on the context to read/write the preview canvas
- Call `pushHistory(customPayload?)` to integrate with undo
- Register custom modes that are handled by plugin overlay components rendered as children of `<Canvas>`

See [`@romaine-plugins/bg-remover`](https://www.npmjs.com/package/@romaine-plugins/bg-remover) for a reference plugin implementation.

## Versioning

Currently minor changes may be breaking until a stable 1.0.0 release. Semantic versioning will be used post stable release.

## Special Thanks

@Giacomocerquone publisher of react-perspective-cropper (MIT)

@opencv creators of computer vision software this package relies on (3-clause BSD)
