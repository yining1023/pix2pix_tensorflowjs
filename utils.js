// Fetch weights from path
async function fetch_weight(path) {
  return new Promise(function(resolve, reject) {
    let weights_cache = {}
    if (path in weights_cache) {
      resolve(weights_cache[path])
      return
    }

    let xhr = new XMLHttpRequest()
    xhr.open("GET", path, true)
    xhr.responseType = "arraybuffer"

    xhr.onload = function(e) {
      if (xhr.status != 200) {
        reject("missing model")
        return
      }
      let buf = xhr.response
      if (!buf) {
        reject("invalid arraybuffer")
        return
      }

      let parts = []
      let offset = 0
      while (offset < buf.byteLength) {
        let b = new Uint8Array(buf.slice(offset, offset+4))
        offset += 4
        let len = (b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3]
        parts.push(buf.slice(offset, offset + len))
        offset += len
      }

      let shapes = JSON.parse((new TextDecoder("utf8")).decode(parts[0]))
      let index = new Float32Array(parts[1])
      let encoded = new Uint8Array(parts[2])

      // decode using index
      let arr = new Float32Array(encoded.length)
      for (let i = 0; i < arr.length; i++) {
        arr[i] = index[encoded[i]]
      }

      let weights = {}
      offset = 0
      for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i].shape
        let size = shape.reduce((total, num) => total * num)
        let values = arr.slice(offset, offset+size)
        let tfarr = tf.tensor1d(values, "float32")
        weights[shapes[i].name] = tfarr.reshape(shape)
        offset += size
      }
      weights_cache[path] = weights
      resolve(weights)
    }
    xhr.send(null)
  })
}

// Converts a tf to DOM img
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
