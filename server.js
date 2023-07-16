const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION!  Shutting down...");
  console.log(err.name, err.message);

  process.exit(1);
});

const mongoose = require("mongoose");
const app = require("./app");

const db = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log("DB connected successfully"));

const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}!`);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION!  Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
