// Fetch weights from path
const fetchWeights = (urlPath) => {
  return new Promise((resolve, reject) => {
    const weightsCache = {};
    if (urlPath in weightsCache) {
      resolve(weightsCache[urlPath]);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', urlPath, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status !== 200) {
        reject(new Error('missing model'));
        return;
      }
      const buf = xhr.response;
      if (!buf) {
        reject(new Error('invalid arraybuffer'));
        return;
      }

      const parts = [];
      let offset = 0;
      while (offset < buf.byteLength) {
        const b = new Uint8Array(buf.slice(offset, offset + 4));
        offset += 4;
        const len = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3]; // eslint-disable-line no-bitwise
        parts.push(buf.slice(offset, offset + len));
        offset += len;
      }

      const shapes = JSON.parse((new TextDecoder('utf8')).decode(parts[0]));
      const index = new Float32Array(parts[1]);
      const encoded = new Uint8Array(parts[2]);

      // decode using index
      const arr = new Float32Array(encoded.length);
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = index[encoded[i]];
      }

      const weights = {};
      offset = 0;
      for (let i = 0; i < shapes.length; i += 1) {
        const { shape } = shapes[i];
        const size = shape.reduce((total, num) => total * num);
        const values = arr.slice(offset, offset + size);
        const tfarr = tf.tensor1d(values, 'float32');
        weights[shapes[i].name] = tfarr.reshape(shape);
        offset += size;
      }
      weightsCache[urlPath] = weights;
      resolve(weights);
    };
    xhr.send(null);
  });
}

// Converts a tf to DOM img element
const array3DToImage = (tensor) => {
  const [imgWidth, imgHeight] = tensor.shape;
  const data = tensor.dataSync();
  const canvas = document.createElement('canvas');
  canvas.width = imgWidth;
  canvas.height = imgHeight;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < imgWidth * imgHeight; i += 1) {
    const j = i * 4;
    const k = i * 3;
    imageData.data[j + 0] = Math.floor(256 * data[k + 0]);
    imageData.data[j + 1] = Math.floor(256 * data[k + 1]);
    imageData.data[j + 2] = Math.floor(256 * data[k + 2]);
    imageData.data[j + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  // Create img HTML element from canvas
  const dataUrl = canvas.toDataURL();
  const outputImg = document.createElement('img');
  outputImg.src = dataUrl;
  outputImg.style.width = imgWidth;
  outputImg.style.height = imgHeight;
  return outputImg;
};
