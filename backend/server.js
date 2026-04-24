const express = require("express");
const cors = require("cors");
const { processEdges } = require("./logic");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Identity constants
const USER_ID = "shivamkumarjha_22092003";
const EMAIL_ID = "sj5873@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA23110260101678";

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        user_id: USER_ID,
        email_id: EMAIL_ID,
        college_roll_number: COLLEGE_ROLL_NUMBER,
        error: "Invalid input: 'data' must be an array of strings in 'X->Y' format.",
      });
    }

    const result = processEdges(data);

    return res.status(200).json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      ...result,
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      error: "Internal server error.",
    });
  }
});

app.get("/bfhl", (req, res) => {
  res.json({ operation_code: 1 });
});

app.listen(PORT, () => {
  console.log(`BFHL Backend running on http://localhost:${PORT}`);
});
