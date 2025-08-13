const express = require("express");
const router = express.Router();
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");
const permissionMatrixController = require("../controllers/PermissionMatrix");

router.post(
    '/modules',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.createModule
);
router.post(
    '/modules/add-roles',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.addrolesToModule
);
router.put(
    '/modules/remove-role',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.removeRoleFromModule
);
router.put(
    '/modules/update',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.updateModuleName
)
router.post(
    '/permissions',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.addUserPermission
);
router.put(
    '/permissions/update',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.updateUserPermission
);
router.delete(
    '/permissions/remove',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.removeUserPermission
);
router.get(
    '/permissions',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.getPermissions
);
router.get(
    '/check-permission',
    permissionMatrixController.checkPermission
);

router.get("/modules",
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.getAllModules
);
router.get(
    '/modulesRoles/:module',
    authenticate,
    authorizeRoles("Super-admin",),
    permissionMatrixController.getrolesByModule
);

module.exports = router;