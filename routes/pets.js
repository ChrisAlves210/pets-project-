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

const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

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
  app.post('/pets', uploadFields, async (req, res) => {
    try {
      const uploadedFiles = req.files && (req.files.avatar || req.files.image);
      const uploadedImageUrl = await uploadImage(uploadedFiles && uploadedFiles[0]);
      const pet = new Pet({
        ...req.body,
        avatarUrl: uploadedImageUrl,
        picUrl: req.body.picUrl,
        picUrlSq: req.body.picUrlSq
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

  // PURCHASE PET
  app.post('/pets/:id/purchase', async (req, res) => {
    try {
      if (!process.env.PRIVATE_STRIPE_API_KEY) {
        throw new Error('PRIVATE_STRIPE_API_KEY is not configured.');
      }
      if (!req.body.stripeToken) {
        return res.status(400).send('A Stripe payment token is required.');
      }

      const pet = await Pet.findById(req.body.petId || req.params.id).exec();
      if (!pet) return res.status(404).send('Pet not found.');

      const stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);
      await stripe.charges.create({
        amount: Math.round(pet.price * 100),
        currency: 'usd',
        description: `Purchased ${pet.name}, ${pet.species}`,
        source: req.body.stripeToken
      });

      res.redirect(`/pets/${pet._id}`);
    } catch (err) {
      console.error('Stripe purchase failed:', err.message);
      res.status(400).send('Unable to process the purchase.');
    }
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  // UPDATE PET
  app.put('/pets/:id', uploadFields, async (req, res, next) => {
    try {
      const uploadedFiles = req.files && (req.files.avatar || req.files.image);
      const uploadedImageUrl = await uploadImage(uploadedFiles && uploadedFiles[0]);
      const updates = {
        ...req.body,
        ...(uploadedImageUrl && { avatarUrl: uploadedImageUrl })
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
