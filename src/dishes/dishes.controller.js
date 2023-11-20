const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((d) => d.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  } else {
    next({ status: 404, message: `Dish id not found ${dishId}` });
  }
};

const dishIdMatches = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if ((id && dishId && id == dishId) || (!id && dishId)) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
};

const list = (req, res) => {
  res.json({ data: dishes });
};

const create = (req, res) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const id = nextId();
  const newDish = {
    id,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const read = (req, res) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res) => {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
};

const hasData = (objParam) => {
  return (req, res, next) => {
    const { data = {} } = req.body;
    data[objParam] && data[objParam].length > 0
      ? next()
      : next({ status: 400, message: `Dish must include a ${objParam}` });
  };
};
const isPriceValid = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  if (price && Number.isInteger(price) && price > 0) {
    next();
  } else if (price <= 0) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else {
    next({ status: 400, message: `Dish must include a price` });
  }
};

module.exports = {
  list,
  create: [
    hasData("name"),
    hasData("description"),
    hasData("image_url"),
    isPriceValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    hasData("name"),
    hasData("description"),
    hasData("image_url"),
    isPriceValid,
    dishIdMatches,
    update,
  ],
  dishExists,
};
