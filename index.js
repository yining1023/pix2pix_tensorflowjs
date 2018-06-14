const SIZE = 256;

function mlmodel(input, weights) {
  function preprocess(input) {
    return tf.sub(tf.mul(input, tf.scalar(2)), tf.scalar(1))
  }

  function deprocess(input) {
    return tf.div(tf.add(input, tf.scalar(1)), tf.scalar(2))
  }

  function batchnorm(input, scale, offset) {
    let moments = tf.moments(input, [0, 1])
    const varianceEpsilon = 1e-5
    return tf.batchNormalization(input, moments.mean, moments.variance, varianceEpsilon, scale, offset)
  }

  function conv2d(input, filter, bias) {
    return tf.conv2d(input, filter, [2, 2], "same")
  }

  function deconv2d(input, filter, bias) {
    let convolved = tf.conv2dTranspose(input, filter, [input.shape[0]*2, input.shape[1]*2, filter.shape[2]], [2, 2], "same")
    let biased = tf.add(convolved, bias)
    return biased
  }

  let preprocessed_input = preprocess(input)

  let layers = []

  let filter = weights["generator/encoder_1/conv2d/kernel"]
  let bias = weights["generator/encoder_1/conv2d/bias"]
  let convolved = conv2d(preprocessed_input, filter, bias)
  layers.push(convolved)

  for (let i = 2; i <= 8; i++) {
    let scope = "generator/encoder_" + i.toString()
    let filter = weights[scope + "/conv2d/kernel"]
    let bias = weights[scope + "/conv2d/bias"]
    let layer_input = layers[layers.length - 1]
    let rectified = tf.leakyRelu(layer_input, 0.2)
    let convolved = conv2d(rectified, filter, bias)
    let scale = weights[scope + "/batch_normalization/gamma"]
    let offset = weights[scope + "/batch_normalization/beta"]
    let normalized = batchnorm(convolved, scale, offset)
    layers.push(normalized)
  }

  for (let i = 8; i >= 2; i--) {
    let layer_input
    if (i == 8) {
      layer_input = layers[layers.length - 1]
    } else {
      let skip_layer = i - 1
      layer_input = tf.concat([layers[layers.length - 1], layers[skip_layer]], 2)
    }
    let rectified = tf.relu(layer_input)
    let scope = "generator/decoder_" + i.toString()
    let filter = weights[scope + "/conv2d_transpose/kernel"]
    let bias = weights[scope + "/conv2d_transpose/bias"]
    let convolved = deconv2d(rectified, filter, bias)
    let scale = weights[scope + "/batch_normalization/gamma"]
    let offset = weights[scope + "/batch_normalization/beta"]
    let normalized = batchnorm(convolved, scale, offset)
    layers.push(normalized)
  }

  let layer_input = tf.concat([layers[layers.length - 1], layers[0]], 2)
  rectified = tf.relu(layer_input)
  filter = weights["generator/decoder_1/conv2d_transpose/kernel"]
  bias = weights["generator/decoder_1/conv2d_transpose/bias"]
  convolved = deconv2d(rectified, filter, bias)
  rectified = tf.tanh(convolved)
  layers.push(rectified)

  let output = layers[layers.length - 1]
  let deprocessed_output = deprocess(output)

  return deprocessed_output
}

function setup() {
  fetch_weight('/models/edges2pikachu_AtoB.pict')
  .then(weights => {
    let imgElement = document.getElementById('input')
    let input = tf.fromPixels(imgElement)
    inputData = input.dataSync()
    const float_input = tf.tensor3d(inputData, input.shape)
    const normalized_input = tf.div(float_input, tf.scalar(255.))
    let output_rgb = mlmodel(normalized_input, weights)
    let outputImg = array3DToImage(output_rgb);
    createImg(outputImg.src).parent('output');
  })
}
