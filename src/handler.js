const { predict } = require('./inference');
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'submissionmlgc-shandysatria',
});

const addpredictions = async (request, h) => {
  try {
    const { image } = request.payload;

    if (!image) {
      return h.response({
        status: 'fail',
        message: 'Gambar tidak boleh kosong'
      }).code(400);
    }

    const imageBuffer = image._data;
    const predictionResult = await predict(imageBuffer);

    const data = {
      result: predictionResult,
      suggestion: predictionResult === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('predictions').add(data);
    const docId = docRef.id;
    const response = {
      status: 'success',
      message: 'Model is predicted successfully',
      data: {
        id: docId,
        ...data
      }
    };

    return h.response(response).code(200);
  } catch (error) {
    console.error(error);
    if (error.output && error.output.statusCode === 413) {
      return h.response({
        status: 'fail',
        message: 'Payload content length greater than maximum allowed: 1000000'
      }).code(413);
    }

    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi'
    }).code(400);
  }
};

const getpredictions = async (request, h) => {
  try {
    const predictionsCollection = db.collection('predictions');
    const snapshot = await predictionsCollection.get();
    const predictions = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      predictions.push({
        id: doc.id,
        ...data,
      });
    });

    const response = {
      status: 'success',
      data: predictions
    };

    return h.response(response).code(200);
  } catch (error) {
    console.error(error);
    return h.response({
      status: 'fail',
      message: 'Gagal mengambil riwayat prediksi'
    }).code(500);
  }
};


module.exports = { addpredictions, getpredictions };
