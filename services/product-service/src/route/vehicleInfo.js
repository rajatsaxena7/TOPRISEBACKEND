const express=require("express");
const router=express.Router();
const vehicleInfoController=require("../controller/vehicleInfo");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");


router.get("/getInfo/:registrationNumber",vehicleInfoController.getVehicleDetails);

module.exports=router;