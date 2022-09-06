onmessage = function (e) {
  console.log(Object.keys(this));
  fetch({
    url: "https://docs.opencv.org/3.4.13/opencv.js",
    mode: "cors",
  }).then(async function (response) {
    await response.text().then(function (text) {
      console.log(text);
    });
  });
  const result = e.data[0] * e.data[1];
  if (isNaN(result)) {
    postMessage("Please write two numbers");
  } else {
    const workerResult = "Result: " + result;
    console.log("Worker: Posting message back to main script");
    postMessage(workerResult);
  }
};
