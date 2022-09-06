const interv = setInterval(function () {
  console.log(
    Object.keys(globalThis.cv).filter((name) => /^(im|copy)/.test(name))
  );
  const workingCanvas = document?.getElementById?.("preview-canvas");
  if (workingCanvas && globalThis.cv) {
    console.log("reading");
    const src = globalThis.cv.imread("preview-canvas");
    const top = 100,
      left = 100,
      bottom = 200,
      right = 200;
    console.log("altering");
    cv.copyMakeBorder(src, src, top, bottom, left, right, cv.BORDER_CONSTANT);
    console.log("showing");
    globalThis.cv.imshow("preview-canvas", src);
    console.log("deleteing");
    src.delete();
    clearInterval(interv);
  }
}, 20000);
