const express = require("express");
const router = express.Router();
const config = require("../config/config");

router.get("/", (req, res) => {
  res.json(config.genres);
});

module.exports = router;
