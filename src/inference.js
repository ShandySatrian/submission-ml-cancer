const tfjs = require('@tensorflow/tfjs-node');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'model-deploy-mlgc';
const fileName = 'model.json';

async function loadModel() {
  try {
    console.log('Mulai memuat model...');
    const [metadata] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getMetadata();

    const modelUrl = `https://storage.googleapis.com/${metadata.bucket}/${metadata.name}`;

    console.log('Loading model dari:', modelUrl);

    const model = await tfjs.loadLayersModel(modelUrl);
    console.log('Model berhasil dimuat!');
    return model;
  } catch (error) {
    console.error('Error saat me-load model:', error);
    throw error;
  }
}

async function predict(imageBuffer)  {
  try {
    const model = await loadModel();
    console.log('model loaded!');

    const tensor = tfjs.node.decodeJpeg(imageBuffer);
    const preprocessedTensor = tensor
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .div(tfjs.scalar(255))
      .toFloat();

    const predictionsTensor = model.predict(preprocessedTensor);
    const predictions = await predictionsTensor.data();

    const result = predictions[0] > 0.5 ? 'Cancer' : 'Non-cancer';
    return result;

  } catch (error) {
    console.error('Error saat melakukan prediksi:', error);

    if (error.code === 403) {
      console.error('Error: Tidak ada izin untuk mengakses model di Cloud Storage.');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('Error: Gagal mengambil model dari Cloud Storage. Periksa koneksi internet.');
    } else if (error.message.includes('Invalid argument')) {
      console.error('Error: Format gambar tidak valid.');
    } else {
      console.error('Error:', error.message);
    }

    throw error;
  }
}

module.exports = { loadModel, predict };