const mogoose = require("mongoose");
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const Brand = require("../models/brand");
const Model = require("../models/model");
const Variant = require("../models/variantModel");


const parseCarDescription = (description) => {
    const cleaned = description.replace(/[().]/g, ' ').trim();
    const parts = cleaned.split(/\s+/);

    if (!parts.length) return {};

    const brand = parts[0];

    let engine = null;
    const enginePattern = /(\d+CC|\d+\.\d+L|\d+L|PETROL|DIESEL|ELECTRIC|HYBRID)/i;
    for (let i = 0; i < parts.length; i++) {
        if (enginePattern.test(parts[i])) {
            engine = parts[i];
            parts.splice(i, 1);
            break;
        }
    }

    const remaining = parts.slice(1);

    let model = null;
    let variant = null;

    if (remaining.length === 1) {
        model = remaining[0];
    } else if (remaining.length > 1) {
        model = remaining.slice(0, 2).join(' ');
        variant = remaining.slice(2).join(' ') || null;
    }

    return {
        Brand: brand,
        Model: model,
        Variant: variant || remaining[remaining.length - 1] || null,
        Engine: engine
    };
};

exports.getVehicleDetails = async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        const username = 'RAJAT7121'; // Replace with your API username

        const response = await axios.get(
            `http://www.carregistrationapi.com/api/reg.asmx/CheckIndia?RegistrationNumber=${registrationNumber}&username=${username}`
        );


//         const response = {
//             data: `<?xml version="1.0" encoding="utf-8"?>
// <Vehicle xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://regcheck.org.uk">
//     <vehicleJson>{
//   "Description": "MARUTI WAGON R VXI. (998CC)",
//   "RegistrationYear": "2012",
//   "CarMake": {
//     "CurrentTextValue": "MARUTI"
//   },
//   "CarModel": {
//     "CurrentTextValue": "WAGON R VXI. (998CC)"
//   },
//   "Variant": "",
//   "EngineSize": {
//     "CurrentTextValue": "998"
//   },
//   "MakeDescription": {
//     "CurrentTextValue": "MARUTI"
//   },
//   "ModelDescription": {
//     "CurrentTextValue": "WAGON R VXI. (998CC)"
//   },
//   "NumberOfSeats": {
//     "CurrentTextValue": ""
//   },
//   "VechileIdentificationNumber": "",
//   "EngineNumber": "",
//   "FuelType": {
//     "CurrentTextValue": ""
//   },
//   "RegistrationDate": "07/11/2012",
//   "Owner": "ABDUL HAMEED ANWAR ",
//   "Fitness": "",
//   "Insurance": "01/01/0001",
//   "PUCC": "",
//   "VehicleType": "",
//   "Location": "KARNATAKA-BANGALORE",
//   "ImageUrl": "http://www.carregistrationapi.in/image.aspx/@TUFSVVRJIFdBR09OIFIgVlhJLiAoOTk4Q0Mp"
// }</vehicleJson>
//     <vehicleData>
//         <Description>MARUTI WAGON R VXI. (998CC)</Description>
//         <RegistrationYear>2012</RegistrationYear>
//         <CarMake>
//             <CurrentTextValue>MARUTI</CurrentTextValue>
//         </CarMake>
//         <CarModel>WAGON R VXI. (998CC)</CarModel>
//     </vehicleData>
// </Vehicle>`,
//         }
        const parsedXml = await parseStringPromise(response.data);
        const vehicleJson = parsedXml.Vehicle.vehicleJson[0];

        const vehicleData = JSON.parse(vehicleJson);

        const formattedResponse = {
            description: vehicleData.Description,
            registrationYear: vehicleData.RegistrationYear,
            make: vehicleData.CarMake.CurrentTextValue,
            model: vehicleData.CarModel.CurrentTextValue,
            variant: vehicleData.Variant,
            engineSize: vehicleData.EngineSize.CurrentTextValue,
            fuelType: vehicleData.FuelType.CurrentTextValue,
            registrationDate: vehicleData.RegistrationDate,
            owner: vehicleData.Owner,
            fitnessExpiry: vehicleData.Fitness,
            insuranceExpiry: vehicleData.Insurance,
            vehicleType: vehicleData.VehicleType,
            location: vehicleData.Location,
            imageUrl: vehicleData.ImageUrl,
        };

        const parsedData = parseCarDescription(formattedResponse.description);

        const brand = await Brand.findOne({
            brand_name: { $regex: new RegExp(parsedData.Brand, 'i') }
        });
        if (!brand) {
            return res.status(200).json({
                success: false,
                data: {
                    apiData: formattedResponse,
                    dbMatches: null,
                    message: "Brand not found in database"
                }
            });
        }
        const model = await Model.findOne({
            brand_ref: brand._id,
            model_name: { $regex: new RegExp(parsedData.Model, 'i') }
        });
        if (!model) {
            return res.status(200).json({
                success: false,
                data: {
                    apiData: formattedResponse,
                    dbMatches: {
                        brand,
                        model: null,
                        message: "Model not found for this brand"
                    }
                }
            });
        }

        const variant = await Variant.findOne({
            model: model._id,
            variant_name: { $regex: new RegExp(parsedData.Variant, 'i') }
        });

        if (!variant) {
            return res.status(200).json({
                success: false,
                data: {
                    apiData: formattedResponse,
                    dbMatches: {
                        brand,
                        model,
                        variant: null,
                        message: "Variant not found for this model"
                    }
                }
            });
        }



        const dbMatches = {
            brand,
            model,
            variant
        };


        res.status(200).json({
            success: true,
            data: {
                apiData: formattedResponse,
                dbMatches,
                message: dbMatches
                    ? "Found matching records"
                    : "No matching variants found"
            }
        });

    } catch (error) {
        console.error('Error fetching vehicle details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle details',
            error: error.message,
        });
    }
};