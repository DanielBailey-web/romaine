# romaine-components

Component library for use with <a href="https://www.npmjs.com/package/romaine">romaine</a>

# Installation

`$ npm i romaine-components`
OR
`$ yarn add romaine-components romaine`

# Example

```ts
import { useEffect, useState, useMemo } from "react";
import { RomaineExample } from "romaine-components/example";
import { Romaine } from "romaine";

function App() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const image = useMemo(
    () => `https://source.unsplash.com/random?unique=${Math.random()}`,
    []
  );
  useEffect(() => {
    if (blob !== null) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "image.png"); //or any other extension
      document.body.appendChild(link);
      link.click();
    }
  }, [blob]);

  return (
    <div className="App">
      <Romaine angle={90}>
        <RomaineExample
          imageExportOptions={{ type: "image/jpeg", quality: 0.92 }}
          setBlob={setBlob}
          image={image}
        />
      </Romaine>
    </div>
  );
}

export default App;
```

# Field Inputs

## Romaine

### Note:

Changing props triggers the Context Alternative, which causes an un-needed render when you can use the context alternative yourself.

| Parameter | Type     | Description                  | Default | Context Alternative |
| :-------- | :------- | :--------------------------- | :------ | :------------------ |
| `angle`   | `number` | Turn angle for rotation tool | `90`    | `setAngle(90)`      |

## Romaine Components

| Parameter            | Type       | Description                                              | Default     |
| :------------------- | :--------- | :------------------------------------------------------- | :---------- |
| `imageExportOptions` | `object`   | Object given to `RomaineRef.current?.getBlob()` function | `90`        |
| `setBlob`            | `function` | setter function give from useState hook                  | `undefined` |
| `image`              | `string`   | location (URL or File) of the image                      | `null`      |

### imageExportOptions

| Parameter            | Type     | Description                                                         | Default     |
| :------------------- | :------- | :------------------------------------------------------------------ | :---------- |
| `type: "image/jpeg"` | `string` | Object given to `RomaineRef.current?.getBlob()` function            | `image/png` |
| `quality`            | `number` | Quality settings for image when type = `image/webp` OR `image/jpeg` | `0.92`      |
