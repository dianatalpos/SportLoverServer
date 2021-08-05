import * as express from "express";
import firestore from "../config/config";
import { Field } from "../models/Field.class";
import { Location } from "../models/Location.class";
import firebase from "firebase";
import { Duration } from "../models/Duration.class";

export const getLocations = async (req: express.Request, res: express.Response) => {
    const locations = [];
    const sport = req.query.sport;

    await firestore.collection("locations")
        .where("sports", "array-contains", sport)
        .get()
        .then((locRef) => {
            locRef.forEach((docRef) => {
                const data = docRef.data();

                const loc = new Location();
                loc.id = data.id;
                loc.name = data.name;
                loc.sports = data.sports;
                loc.latitude = data.latitude;
                loc.longitude = data.longitude;
                loc.endTime = data.endTime;
                loc.startTime = data.startTime;

                locations.push(loc);
            });

            return res.status(200).json(locations);
        })
        .catch((error) => {
            return res.status(404).json("Could not take the locations! " + error);
        });

    return res;
};

export const getLocationsByUser = async (req: express.Request, res: express.Response) => {
    const locations = [];
    const userId = req.params.userId;

    await firestore.collection("locations")
        .where("userId", "==", userId)
        .get()
        .then((locRef) => {
            locRef.forEach((docRef) => {
                const data = docRef.data();

                const loc = new Location();
                loc.id = docRef.id;
                loc.name = data.name;
                loc.sports = data.sports;
                loc.latitude = data.latitude;
                loc.longitude = data.longitude;
                loc.endTime = data.endTime;
                loc.startTime = data.startTime;

                locations.push(loc);
            });

            return res.status(200).json(locations);
        })
        .catch((error) => {
            console.log(error);
            return res.status(404).json("Could not take the locations! " + error);
        });

    return res;
};

export const getFields = async (req: express.Request, res: express.Response) => {
    const fields = [];
    const locationId = req.params.locationId;
    const sport = req.query.sport;


    if (sport) {
        await firestore.collection("locations/" + locationId + "/fields")
            .where("sport", "==", sport)
            .get()
            .then((locRef) => {
                locRef.forEach((docRef) => {
                    const data = docRef.data();

                    const field = new Field();
                    field.id = docRef.id;
                    field.name = data.name;
                    field.sport = data.sport;

                    fields.push(field);
                });

                return res.status(200).json(fields);
            })
            .catch((error) => {
                return res.status(404).json("Could not take the locations! " + error);
            });
    } else {
        await firestore.collection("locations/" + locationId + "/fields")
            .get()
            .then((locRef) => {
                locRef.forEach((docRef) => {
                    const data = docRef.data();

                    const field = new Field();
                    field.id = docRef.id;
                    field.name = data.name;
                    field.sport = data.sport;

                    fields.push(field);
                });

                return res.status(200).json(fields);
            })
            .catch((error) => {
                return res.status(404).json("Could not take the locations! " + error);
            });
    }
    return res;
};


export const getOcuppiedHours = async (req: express.Request, res: express.Response) => {
    const locationId = req.params.locationId;
    const fieldId = req.params.fieldId;

    const date = new Date(req.body.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const dateToCompareGrater = firebase.firestore.Timestamp.fromDate(date);
    const dateToCompareLess = firebase.firestore.Timestamp.fromDate(nextDay);


    const durations = [];

    await firestore.collection("events")
        .where("locationId", "==", locationId)
        .where("locationFieldId", "==", fieldId)
        .where("dateTime", ">=", dateToCompareGrater)
        .where("dateTime", "<", dateToCompareLess)
        .get()
        .then((docRefs) => {
            docRefs.forEach((eventRef) => {
                const data = eventRef.data();

                const duration = new Duration();
                duration.date = data.dateTime.toDate();
                duration.duration = data.duration;

                durations.push(duration);
            });

            return res.status(200).json(durations);
        })
        .catch((error) => {
            return res.status(500).json("Could not retrieve occupied hours! " + error);
        });
};

export const createLocation = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const location = req.body as Location;
    location.userId = userId;

    const locationId = await firestore.collection("locations")
        .add(location)
        .then((locRef) => {
            return locRef.id;
        })
        .catch(() => {
            res.status(500).json("Could not add location!");
            return null;
        });

    if (locationId != null) {
        await firestore.collection("locations").doc(locationId).get().then((doc) => {
            const loc = new Location();
            loc.id = doc.id;

            const data = doc.data();
            loc.name = data.name;
            loc.sports = data.sports;
            loc.latitude = data.latitude;
            loc.longitude = data.longitude;
            loc.endTime = data.endTime;
            loc.startTime = data.startTime;

            return res.status(200).json(loc);
        });
    }
};

export const editLocation = async (req: express.Request, res: express.Response) => {
    const locationId = req.params.locationId;
    const location = req.body as Location;

    const result = await firestore.collection("locations")
        .doc(locationId)
        .set(location, { merge: true })
        .then(() => {
            return true;
        })
        .catch(() => {
            res.status(500).json("Could not add location!");
            return null;
        });

    if (result) {
        await firestore.collection("locations").doc(locationId).get().then((doc) => {
            const loc = new Location();
            loc.id = doc.id;

            const data = doc.data();
            loc.name = data.name;
            loc.sports = data.sports;
            loc.latitude = data.latitude;
            loc.longitude = data.longitude;
            loc.endTime = data.endTime;
            loc.startTime = data.startTime;

            return res.status(200).json(loc);
        });
    }
};

export const addField = async (req: express.Request, res: express.Response) => {
    const field = req.body as Field;
    const locationId = req.params.locationId;

    const fieldId = await firestore.collection("locations/" + locationId + "/fields")
        .add(field)
        .then((docRef) => {
            return docRef.id;
        })
        .catch(() => {
            res.status(500).json("Could not add location!");
            return null;
        });

    if (fieldId != null) {
        await firestore.collection("locations/" + locationId + "/fields")
            .doc(fieldId)
            .get()
            .then((ref) => {
                const newField = new Field();

                const data = ref.data();
                newField.id = ref.id;
                newField.name = data.name;
                newField.sport = data.sport;

                return res.status(200).json(newField);
            });
    }
};
