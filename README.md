# romaine

React OpenCV Manipulation and Image Narration & Editing

# Example

See <a href="https://www.npmjs.com/package/romaine-components">romaine-components</a>

# Under Construction

This package is very much a work in progress with new minor versions (with potentially breaking changes with every update).

# Versioning

Currently minor changes will be breaking until a stable 1.0.0 release. Semantic versioning will be used post stable release.

# Quick Features

- Image Cropping
- Perspective Cropping
- Image Rotation
- Image Quality
- More coming soon...

# todo

## Meta

1. Create a minified production build
2. Create a code sandbox demo
3. Basic use case (completed, see <a href="https://www.npmjs.com/package/romaine-components">romaine-components</a>)
4. History
   1. Reinitialize (completed)
   2. Undo (completed)
   3. Redo
5. Layers

## OpenCV Implementations

1. Cropping
   1. Perspective (completed)
   2. Regular
      1. Crop the image (completed)
      2. Lock aspect ratio
      3. Basic border recognition (completed)
2. Filters
   1. Grey scale
   2. Brightness
   3. Hue
   4. Retro
   5. Pop-art
3. Rotation
   1. Allow for image roration (currently working with 90 degree increments)
   2. Change angle of rotation
      1. Update Function from useRomaine (completed)
      2. Prop for Romaine (completed)
         `<Romaine angle={90}>`
4. Zooming
   1. Zoom in and out of the image (creating transparent padding around the image)

## Usability

1. Make cropper be able to be moved via drag

## Field Inputs

#### Romaine

| Parameter | Type     | Description                  | Default |
| :-------- | :------- | :--------------------------- | :------ |
| `angle`   | `number` | Turn angle for rotation tool | `90`    |
