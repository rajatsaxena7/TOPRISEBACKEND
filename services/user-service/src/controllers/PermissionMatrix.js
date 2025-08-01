const { listeners } = require('../models/appSetting');
const PermissionMatrix = require('../models/PermissionMatrix');
const User = require('../models/user');
exports.createModule = async (req, res) => {
    try {
        const { module, roles, updatedBy } = req.body;


        if (!module || !roles || !Array.isArray(roles)) {
            return res.status(400).json({ message: 'Module name and roles array are required' });
        }

        // Check if module already exists
        const existingModule = await PermissionMatrix.findOne({ module });
        if (existingModule) {
            return res.status(400).json({ message: 'Module already exists' });
        }

        // Create the module with initial roles
        const newModule = new PermissionMatrix({
            module,
            AccessPermissions: roles.map(role => ({ role, permissions: [] })),
            updatedBy: updatedBy ? updatedBy : null
        });

        await newModule.save();

        res.status(201).json({
            message: 'Module created successfully',
            data: newModule
        });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.addrolesToModule = async (req, res) => {
    try {
        const { module, roles, updatedBy } = req.body;
        if (!module || !roles || !Array.isArray(roles)) {
            return res.status(400).json({ message: 'Module name and roles array are required' });
        }

        const updatedModule = await PermissionMatrix.findOneAndUpdate(
            { module: module },
            {
                $push: {
                    AccessPermissions: {
                        $each: roles.map(role => ({ role, permissions: [] }))
                    }
                },
                updatedBy: updatedBy ? updatedBy : null
            },
            { new: true }
        );

        if (!updatedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.status(200).json({
            message: 'Roles added to module successfully',
            data: updatedModule
        });
    } catch (error) {
        console.error('Error adding roles to module:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.removeRoleFromModule = async (req, res) => {
    try {
        const { module, role, updatedBy } = req.body;
        if (!module || !role) {
            return res.status(400).json({ message: 'Module name and role are required' });
        }

        const updatedModule = await PermissionMatrix.findOneAndUpdate(
            { module: module },
            {
                $pull: {
                    AccessPermissions: { role }
                },
                updatedBy: updatedBy ? updatedBy : null
            },
            { new: true }
        );

        if (!updatedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.status(200).json({
            message: 'Role removed from module successfully',
            data: updatedModule
        });
    } catch (error) {
        console.error('Error removing role from module:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.updateModuleName = async (req, res) => {
    try {
        const { module, newModuleName, updatedBy } = req.body;
        if (!module || !newModuleName) {
            return res.status(400).json({ message: 'Module name and new module name are required' });
        }
        // Check if the new module name already exists
        const existingModule = await PermissionMatrix.findOne({ module: newModuleName });
        if (existingModule) {
            return res.status(400).json({ message: 'New module name already exists' });
        }
        const roles = await PermissionMatrix.findOne({ module: module });
        if (!roles) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const updatedModule = await PermissionMatrix.findOneAndUpdate(
            { _id: roles._id },
            {
                module: newModuleName,
                updatedBy: updatedBy ? updatedBy : null
            },
            { new: true }
        );

        if (!updatedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.status(200).json({
            message: 'Module updated successfully',
            data: updatedModule
        });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addUserPermission = async (req, res) => {
    try {
        const { module, role, userIds, permissions } = req.body;
        const updatedBy = req.user._id;

        // Validate input
        if (!module || !role || !userIds || !Array.isArray(userIds) || userIds.length === 0 || !permissions) {
            return res.status(400).json({ message: 'Module, role, userIds array and permissions are required' });
        }

        // Find the module
        const permissionModule = await PermissionMatrix.findOne({ module });
        if (!permissionModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Find or create the role entry
        let roleIndex = permissionModule.AccessPermissions.findIndex(ap => ap.role === role);
        if (roleIndex === -1) {
            permissionModule.AccessPermissions.push({ role, permissions: [] });
            roleIndex = permissionModule.AccessPermissions.length - 1;
        }

        // Process each user ID
        const results = {
            added: 0,
            skipped: 0,
            errors: 0
        };

        for (const userId of userIds) {
            try {
                // Check if user already has permissions in this role
                const existingPermission = permissionModule.AccessPermissions[roleIndex].permissions.find(
                    p => p.userId.toString() === userId
                );

                if (existingPermission) {
                    results.skipped++;
                    continue;
                }

                // Add new permission
                permissionModule.AccessPermissions[roleIndex].permissions.push({
                    userId,
                    allowedFields: permissions.allowedFields || [],
                    read: permissions.read || false,
                    write: permissions.write || false,
                    update: permissions.update || false,
                    delete: permissions.delete || false
                });
                results.added++;
            } catch (error) {
                console.error(`Error processing user ${userId}:`, error);
                results.errors++;
            }
        }

        // Only save if we made changes
        if (results.added > 0) {
            permissionModule.updatedAt = new Date();
            permissionModule.updatedBy = updatedBy;
            await permissionModule.save();
        }

        res.status(200).json({
            message: 'User permissions processed',
            data: {
                module: permissionModule,
                results: results
            }
        });
    } catch (error) {
        console.error('Error adding user permission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserPermission = async (req, res) => {
    try {
        const { module, role, userId, permissions, updatedBy } = req.body;

        if (!module || !role || !userId || !permissions) {
            return res.status(400).json({ message: 'Module, role, userId and permissions are required' });
        }

        // Find the module
        const permissionModule = await PermissionMatrix.findOne({ module });
        if (!permissionModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Find the role in the module
        const roleIndex = permissionModule.AccessPermissions.findIndex(ap => ap.role === role);
        if (roleIndex === -1) {
            return res.status(404).json({ message: 'Role not found in the module' });
        }

        // Find the user permission
        const userPermissionIndex = permissionModule.AccessPermissions[roleIndex].permissions.findIndex(
            p => p.userId.toString() === userId
        );

        if (userPermissionIndex === -1) {
            return res.status(404).json({ message: 'User permission not found for this role in the module' });
        }

        // Update the permission
        const userPermission = permissionModule.AccessPermissions[roleIndex].permissions[userPermissionIndex];

        if (permissions.allowedFields !== undefined) {
            userPermission.allowedFields = permissions.allowedFields;
        }
        if (permissions.read !== undefined) {
            userPermission.read = permissions.read;
        }
        if (permissions.write !== undefined) {
            userPermission.write = permissions.write;
        }
        if (permissions.update !== undefined) {
            userPermission.update = permissions.update;
        }
        if (permissions.delete !== undefined) {
            userPermission.delete = permissions.delete;
        }

        permissionModule.updatedAt = new Date();
        permissionModule.updatedBy = updatedBy;

        await permissionModule.save();

        res.status(200).json({
            message: 'User permission updated successfully',
            data: permissionModule
        });
    } catch (error) {
        console.error('Error updating user permission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.removeUserPermission = async (req, res) => {
    try {
        const { module, role, userId, updatedBy } = req.body;

        if (!module || !role || !userId) {
            return res.status(400).json({ message: 'Module, role and userId are required' });
        }

        // Find the module
        const permissionModule = await PermissionMatrix.findOne({ module });
        if (!permissionModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Find the role in the module
        const roleIndex = permissionModule.AccessPermissions.findIndex(ap => ap.role === role);
        if (roleIndex === -1) {
            return res.status(404).json({ message: 'Role not found in the module' });
        }

        // Find the user permission index
        const userPermissionIndex = permissionModule.AccessPermissions[roleIndex].permissions.findIndex(
            p => p.userId.toString() === userId
        );

        if (userPermissionIndex === -1) {
            return res.status(404).json({ message: 'User permission not found for this role in the module' });
        }

        // Remove the permission
        permissionModule.AccessPermissions[roleIndex].permissions.splice(userPermissionIndex, 1);

        // If no more permissions for this role, remove the role entry
        if (permissionModule.AccessPermissions[roleIndex].permissions.length === 0) {
            permissionModule.AccessPermissions.splice(roleIndex, 1);
        }

        permissionModule.updatedAt = new Date();
        permissionModule.updatedBy = updatedBy;

        await permissionModule.save();

        res.status(200).json({
            message: 'User permission removed successfully',
            data: permissionModule
        });
    } catch (error) {
        console.error('Error removing user permission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getPermissions = async (req, res) => {
    try {
        const { module, role, userId } = req.query;

        let query = {};

        // Build dynamic query based on provided filters
        if (module) {
            query = {
                module: module
            }
        }

        // Projection to narrow down the result
        let projection = {};

        if (module && role && userId) {
            // Match both role and userId
            projection = {
                AccessPermissions: {
                    $elemMatch: {
                        role: role,
                        permissions: {
                            $elemMatch: { userId: userId }
                        }
                    }
                }
            };
        } else if (module && role) {
            // Match role only
            projection = {
                AccessPermissions: {
                    $elemMatch: { role: role }
                }
            };
        } else if ((role || userId) && !module) {
            return res.status(400).json({ message: 'Module is required' });
        }
        if (!module && !role && !userId) {
            const result = await PermissionMatrix.find({}, { module: 1, AccessPermissions: 1, updatedAt: 1, updatedBy: 1 })
            return res.json({
                message: 'Permissions fetched successfully',
                data: result
            });
        }

        const result = await PermissionMatrix.findOne(query, projection)
            .populate('AccessPermissions.permissions.userId',)
            .populate('updatedBy')
            .sort({ updatedAt: -1 })
            .lean();

        if (!result) {
            return res.status(404).json({ message: 'No permission matrix found for the given filters' });
        }

        return res.json({
            message: 'Permissions fetched successfully',
            data: result
        });
    } catch (err) {
        console.error('Error fetching permissions:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

exports.checkPermission = async (req, res) => {
    try {
        const { module, userId } = req.query;

        if (!module || !userId) {
            return res.status(400).json({ message: 'Module and userId are required' });
        }

        const permissionModule = await PermissionMatrix.findOne({ module })


        if (!permissionModule) {
            return res.status(404).json({
                message: 'Module not found',
                hasPermission: false
            });
        }
        const user = await User.findById(userId);
        console.log('User found:', user, "userId:", userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                hasPermission: false
            });
        }
        let userPermissions;
        const role = permissionModule.AccessPermissions.find(ap => ap.role === user.role);
        if (role === undefined) {
            return res.status(200).json({
                message: 'No permissions found for this user in the module',
                hasPermission: false,
                data: null
            });
        }

        role.permissions.forEach(permission => {
            if (permission.userId.toString() === userId) {
                userPermissions = {
                    allowedFields: permission.allowedFields,
                    read: permission.read,
                    write: permission.write,
                    update: permission.update,
                    delete: permission.delete
                };
            }
        });


        if (userPermissions === undefined) {
            return res.status(200).json({
                message: 'No permissions found for this user in the module',
                hasPermission: false,
                data: null
            });
        }

        res.status(200).json({
            message: 'Permissions retrieved successfully',
            hasPermission: true,
            data: { permissionModule: permissionModule.module, role: user.role, userPermissions }
        });
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
