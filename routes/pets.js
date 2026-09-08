// MODELS
const crypto = require('crypto');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const Pet = require('../models/pet');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  }
});

const uploadImage = async (file) => {
  if (!file) return null;
  if (!process.env.S3_BUCKET || !process.env.S3_REGION) {
    throw new Error('S3_BUCKET and S3_REGION must be configured before uploading images.');
  }

  const key = `pets/${crypto.randomUUID()}${path.extname(file.originalname)}`;
  const client = new S3Client({ region: process.env.S3_REGION });
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  if (process.env.S3_ACL === 'public-read') params.ACL = 'public-read';

  await new Upload({ client: client, params: params }).done();
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
};

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', upload.single('image'), async (req, res) => {
    try {
      const uploadedImageUrl = await uploadImage(req.file);
      const pet = new Pet({
        ...req.body,
        picUrl: uploadedImageUrl || req.body.picUrl,
        picUrlSq: uploadedImageUrl || req.body.picUrlSq
      });

      await pet.save();
      res.send({ pet: pet });
    } catch (err) {
      // STATUS OF 400 FOR VALIDATIONS
      res.status(400).send(err.errors || { message: err.message });
    }
  });

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-show', { pet: pet });
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  // UPDATE PET
  app.put('/pets/:id', upload.single('image'), async (req, res, next) => {
    try {
      const uploadedImageUrl = await uploadImage(req.file);
      const updates = {
        ...req.body,
        ...(uploadedImageUrl && { picUrl: uploadedImageUrl, picUrlSq: uploadedImageUrl })
      };
      const pet = await Pet.findByIdAndUpdate(req.params.id, updates);
      res.redirect(`/pets/${pet._id}`);
    } catch (err) {
      next(err);
    }
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      return res.redirect('/')
    });
  });
}
