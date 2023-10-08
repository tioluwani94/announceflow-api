const User = require("../models/user");
const Organization = require("../models/organization");

const authorize = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const orgId = req.header("organization_id");
      const user = await User.findById(userId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }

      const organization = await Organization.findById(orgId);

      if (!organization || !organization.members.includes(userId)) {
        return res
          .status(403)
          .json({ message: "User is not authorized for this organization" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = authorize;
