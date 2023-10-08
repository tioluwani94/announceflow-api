const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const blogpostRoutes = require("./routes/blogpost");
const collectionRoutes = require("./routes/collection");
const invitationRoutes = require("./routes/invitation");
const organizationRoutes = require("./routes/organization");

const app = express();

// Connect to MongoDB
mongoose.connect(
  `mongodb+srv://kolawole8tiolu:${process.env.MONGO_DB_USER_PASSWORD}@cluster0.7vq6zco.mongodb.net/?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Middlewares
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 requests per 15 minutes

// Routes
app.use("/user", userRoutes);
app.use("/organization", organizationRoutes);
app.use("/invite", invitationRoutes);
app.use("/profile", profileRoutes);
app.use("/blogpost", blogpostRoutes);
app.use("/api/collections", collectionRoutes);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
