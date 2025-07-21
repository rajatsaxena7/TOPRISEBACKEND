const express = require("express");
const router = express.Router();
const actionController = require("../controller/action");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");


router.post(
  "/",
  authenticate,
//   authorizeRoles("Super-admin"),
  actionController.createAction
);

router.get(
  "/",
  authenticate,
//   authorizeRoles("Super-admin"),
  actionController.getAllActions
);

router.get(
  "/:id",
  authenticate,
//   authorizeRoles("Super-admin"),
  actionController.getActionById
);

router.put(
  "/:id",
  authenticate,
//   authorizeRoles("Super-admin"),
  actionController.updateActionById
);

router.delete(
  "/:id",
  authenticate,
//   authorizeRoles("Super-admin"),
  actionController.deleteActionById
);


module.exports = router;
