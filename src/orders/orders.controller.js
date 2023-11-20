const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

// TODO: Implement the /orders handlers needed to make the tests pass

const list = (req, res) => {
  res.json({ data: orders });
};

const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((o) => o.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({ status: 404, message: `Order ID not found: ${orderId}` });
  }
};

const read = (req, res, next) => {
  res.json({ data: res.locals.order });
};

const hasData = (objParam) => {
  return (req, res, next) => {
    const { data = {} } = req.body;
    data[objParam] && data[objParam].length > 0
      ? next()
      : next({ status: 400, message: `Order must include a ${objParam}` });
  };
};

const isDishQuantityValid = (req, res, next) => {
  const { data: { dishes } = {} } = req.body;
  let i = 0;
  let isValid = true;
  for (; i < dishes.length; i++) {
    let dish = dishes[i];
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity <= 0
    ) {
      isValid = false;
      break;
    }
  }
  return isValid
    ? next()
    : next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
};

const isDishesValid = (req, res, next) => {
  const { data: { dishes } = {} } = req.body;
  if (dishes && Array.isArray(dishes) && dishes.length > 0) {
    next();
  } else if (dishes && (!Array.isArray(dishes) || dishes.length == 0)) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } else {
    next({ status: 400, message: `Order must include a dish` });
  }
};

const orderIdMatches = (req, res, next) => {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if ((id && orderId && id === orderId) || (!id && orderId)) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
};

const isStatusValid = (req, res, next) => {
  const order = res.locals.order;
  if (order.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  const { data: { status } = {} } = req.body;
  if (!status || (status && !validStatuses.includes(status))) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
};

const create = (req, res) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const id = nextId();
  const dishesWithNewId = dishes.map((dish) => ({
    ...dish,
    id: nextId(),
  }));
  const newOrder = {
    id,
    deliverTo,
    mobileNumber,
    status,
    dishes: dishesWithNewId,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

const update = (req, res) => {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
};

const isOrderInPendingState = (req, res, next) => {
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending. ",
    });
  } else next();
};

const remove = (req, res) => {
  const { orderId } = req.params;
  const index = orders.findIndex((o) => o.id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    hasData("deliverTo"),
    hasData("mobileNumber"),
    isDishesValid,
    isDishQuantityValid,
    create,
  ],
  update: [
    orderExists,
    orderIdMatches,
    hasData("deliverTo"),
    hasData("mobileNumber"),
    isStatusValid,
    isDishesValid,
    isDishQuantityValid,
    update,
  ],
  delete: [orderExists, isOrderInPendingState, remove],
  orderExists,
};
