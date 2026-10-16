const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    app: "PureSave",
    status: "online"
  });
});

app.listen(PORT, () => {
  console.log(`PureSave server running on port ${PORT}`);
});
