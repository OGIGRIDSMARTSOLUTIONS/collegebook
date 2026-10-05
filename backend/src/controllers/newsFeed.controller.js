const newsFeedService = require('../services/newsFeed.service');
const { ok } = require('../utils/apiResponse');

async function listCategories(req, res, next) {
  try {
    return ok(res, await newsFeedService.listCategories());
  } catch (error) {
    next(error);
  }
}

async function listFeeds(req, res, next) {
  try {
    const category = req.query.category || undefined;
    const forceRefresh = req.query.refresh === 'true';

    return ok(
      res,
      await newsFeedService.listFeeds({ category, forceRefresh })
    );
  } catch (error) {
    next(error);
  }
}

async function listNigeria(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    return ok(res, await newsFeedService.listNigeria({ forceRefresh }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories,
  listFeeds,
  listNigeria,
};
