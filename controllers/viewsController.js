const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // get tour data from our collection
  const tours = await Tour.find();
  // build templet

  // render templet
  res.status(200).render("overview", {
    title: "All Tours",
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user"
  });
  res.status(200).render("tour", {
    title: tour.name,
    tour
  });
});

exports.getLogin = catchAsync(async (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account"
  });
});
