const Pet = require('../models/pet');

module.exports = (app) => {

  /* GET home page. */
  app.get('/', (req, res) => {
    const limit = 6;
    const term = req.query.term ? req.query.term.trim() : '';
    const requestedPage = Number.parseInt(req.query.page, 10);
    const query = term
      ? {
          $or: [
            { name: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { species: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          ]
        }
      : {};

    Pet.countDocuments(query).exec((err, totalPets) => {
      const totalPages = Math.max(1, Math.ceil(totalPets / limit));
      const page = Math.min(Math.max(requestedPage || 1, 1), totalPages);

      Pet.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec((err, pets) => {
          res.render('pets-index', {
            pets: pets,
            term: term,
            page: page,
            totalPages: totalPages
          });
        });
    });
  });
}
