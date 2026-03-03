# romaine-components

Component library for use with [romaine](https://www.npmjs.com/package/romaine)

## Installation

```bash
npm i romaine romaine-components
# or
yarn add romaine romaine-components
```

## Available Components

| Component               | Description                                    | Shortcut         |
| :---------------------- | :--------------------------------------------- | :--------------- |
| `CropperIcon`           | Enter regular crop mode                        | —                |
| `PerspectiveIcon`       | Enter perspective crop mode                    | —                |
| `RotateLeft`            | Rotate image counter-clockwise                 | —                |
| `RotateRight`           | Rotate image clockwise                         | —                |
| `FlipHorizontalIcon`    | Flip image horizontally                        | —                |
| `FlipVerticalIcon`      | Flip image vertically                          | —                |
| `RemoveBackgroundIcon`  | Remove background via GrabCut (OpenCV)         | Ctrl + Shift + B |
| `RefineBackgroundIcon`  | Brush refinement for GrabCut result            | Ctrl + Shift + R |
| `UndoIcon`              | Undo last action                               | —                |
| `FullReset`             | Reset to original image                        | —                |
| `FolderSelection`       | File/URL input for loading images              | —                |

## Example

```tsx
import { Romaine, Canvas, useRomaine } from "romaine";
import {
  CropperIcon,
  PerspectiveIcon,
  RotateLeft,
  RotateRight,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  RemoveBackgroundIcon,
  RefineBackgroundIcon,
  UndoIcon,
  FullReset,
  FolderSelection,
} from "romaine-components";

function App() {
  const [blob, setBlob] = useState<Blob | null>(null);

  return (
    <Romaine>
      <Editor setBlob={setBlob} />
    </Romaine>
  );
}

function Editor({ setBlob }) {
  const { loaded } = useRomaine();

  return loaded ? (
    <div>
      <Canvas image="/photo.jpg" maxWidth={800} maxHeight={600} />
      <div>
        <CropperIcon />
        <PerspectiveIcon />
        <RotateLeft />
        <RotateRight />
        <FlipHorizontalIcon />
        <FlipVerticalIcon />
        <RemoveBackgroundIcon />
        <RefineBackgroundIcon />
        <UndoIcon />
        <FullReset />
      </div>
    </div>
  ) : null;
}
```

## Export Options

```tsx
const blob = await romaineRef.current?.getBlob({
  type: "image/jpeg",       // "image/png" (default) or "image/jpeg"
  quality: 0.92,            // JPEG quality (0-1)
  jpeg: {
    transparentToWhite: true // blend transparent pixels to white for JPEG
  }
});
```
