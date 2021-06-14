interface CalculatedDimensions {
  width: number;
  height: number;
  ratio: number;
}
type CalcDims = (
  width: number,
  height: number,
  externalMaxWidth: number,
  externalMaxHeight: number
) => CalculatedDimensions;

const calcDims: CalcDims = (
  width,
  height,
  externalMaxWidth,
  externalMaxHeight
) => {
  const ratio = width / height;

  const maxWidth = externalMaxWidth || window.innerWidth;
  const maxHeight = externalMaxHeight || window.innerHeight;
  const calculated = {
    width: maxWidth,
    height: Math.round(maxWidth / ratio),
    ratio: ratio,
  };

  if (calculated.height > maxHeight) {
    calculated.height = maxHeight;
    calculated.width = Math.round(maxHeight * ratio);
  }
  return calculated;
};

export { CalculatedDimensions, calcDims };
