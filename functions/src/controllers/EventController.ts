import firebase from "firebase";
import { Event } from "../models/event.class";
import * as express from "express";
import { SportLevel } from "../models/sportLevel.class";
import firestore from "../config/config";
import { Message } from "../models/Message.class";
import { Sport } from "../models/sport.enum";


export const createEvent = async (req: express.Request, res: express.Response) => {
    const event: Event = req.body;
    const userId = req.params.userId;

    event.createdBy = userId;
    event.users.push(userId);

    const users = await firestore.collection("users")
        .where("id", "in", event.users)
        .get();


    const participants = users.docs.map((user) => {
        const data = user.data();
        const userToAdd = {
            id: user.id,
            email: data.email,
            image: data.image ? data.image : "",
            firstName: data.firstName,
            lastName: data.lastName,
        };

        return userToAdd;
    });

    const date = new Date(event.dateTime);
    date.setSeconds(0);

    const eventToAdd = {
        sport: event.sport,
        level: event.level,
        location: event.location,
        locationFieldName: event.locationFieldName,
        locationId: event.locationId,
        locationFieldId: event.locationFieldId,
        locationLatitude: event.locationLatitude,
        locationLongitude: event.locationLongitude,
        createdBy: event.createdBy,
        maxNoPlayers: event.maxNoPlayers,
        isPublic: event.isPublic,
        dateTime: firebase.firestore.Timestamp.fromDate(new Date(date)),
        duration: event.duration,
        participants: participants,
        users: event.users,
    };
    console.log(event.users);

    const eventAdded = await firestore.collection("events")
        .add(eventToAdd)
        .then((docRef) => {
            const newEvent = new Event();
            newEvent.id = docRef.id;
            return docRef.get().then((doc) => {
                const data = doc.data();
                newEvent.sport = data.sport;
                newEvent.level = data.level;
                newEvent.location = data.location;
                newEvent.locationFieldName = data.locationFieldName;
                newEvent.locationId = data.locationId;
                newEvent.locationFieldId = data.locationFieldId;
                newEvent.locationLatitude = data.locationLatitude;
                newEvent.locationLongitude = data.locationLongitude;
                newEvent.dateTime = data.dateTime;
                newEvent.createdBy = data.createdBy;
                newEvent.maxNoPlayers = data.maxNoPlayers;
                newEvent.isPublic = data.isPublic;
                newEvent.participants = data.participants;
                newEvent.users = data.users;
                return newEvent;
            });
        })
        .catch(() => {
            res.status(400).json("Could not create the event!");
            return null;
        });

    if (eventAdded != null) {
        res.status(201).json(eventAdded);
    }

    return res;
};

export const getEventsForUser = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const filters = req.body;
    const sportList = [];

    if (filters != null && filters.sport != null) {
        filters.sport.forEach((element: string) => {
            sportList.push(element);
        });
    } else {
        await firestore.collection("users")
            .doc(userId)
            .collection("sports")
            .get()
            .then((docsRef) => {
                const sports = [];
                docsRef.forEach((data) => {
                    const sportLevel = new SportLevel();
                    sportLevel.level = data.data().level;
                    sportLevel.sport = data.data().sport;

                    sports.push(sportLevel);
                });
                sports.map((sportLevel) => sportLevel.sport)
                    .forEach((sport) => sportList.push(sport));
            });
    }

    if (sportList.length == 0) {
        const sport = Object.values(Sport);

        sport.forEach((value) => sportList.push(value));
    }

    await firestore.collection("events")
        .where("sport", "in", sportList)
        .where("dateTime", ">=", firebase.firestore.Timestamp.now())
        .orderBy("dateTime", "asc")
        .get()
        .then((docRef) => {
            const eventList = docRef.docs.map((ref) => {
                const event = new Event();
                event.id = ref.id;

                const data = ref.data();
                event.sport = data.sport;
                event.level = data.level;
                event.location = data.location;
                event.locationFieldName = data.locationFieldName;
                event.locationId = data.locationId;
                event.locationFieldId = data.locationFieldId;
                event.locationLatitude = data.locationLatitude;
                event.locationLongitude = data.locationLongitude;
                event.duration = data.duration;
                event.dateTime = data.dateTime.toDate();
                event.createdBy = data.createdBy;
                event.maxNoPlayers = data.maxNoPlayers;
                event.isPublic = data.isPublic;
                event.users = data.users;
                event.participants = data.participants;

                return event;
            }).filter((event) => event.participants.find((participant) => participant.id == userId) == null);

            res.status(200).json(eventList);
        })
        .catch((error) => {
            res.status(500).json("Could not load the user event list: " + error);
        });
};

export const getEvent = async (req: express.Request, res: express.Response) => {
    const eventId = req.params.eventId;

    await firestore.collection("events")
        .doc(eventId)
        .get()
        .then((docRef) => {
            const event = new Event();
            event.id = docRef.id;

            const data = docRef.data();
            event.sport = data.sport;
            event.level = data.level;
            event.location = data.location;
            event.dateTime = data.dateTime.toDate();
            event.createdBy = data.createdBy;
            event.maxNoPlayers = data.maxNoPlayers;
            event.isPublic = data.isPublic;
            event.users = data.users;

            return res.status(200).json(event);
        })
        .catch((error) => {
            return res.status(500).json("Could not load the user event list: " + error);
        });

    return res;
};

export const joinEvent = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;

    const participant = await firestore.collection("users")
        .doc(userId)
        .get()
        .then((user) => {
            const data = user.data();
            const userToAdd = {
                id: user.id,
                email: data.email,
                image: data.image ? data.image : "",
                firstName: data.firstName,
                lastName: data.lastName,
            };
            return userToAdd;
        });

    const event = await firestore.collection("events").doc(eventId)
        .get()
        .then((doc) => {
            const data = doc.data();

            return {
                dateTime: data.dateTime.toDate(),
                duration: data.duration,
            };
        });

    console.log(event, "Event");

    console.log(participant, "Participant");

    const canUpdate = await firestore.collection("events")
        .where("users", "array-contains", userId)
        .where("dateTime", "==",
            firebase.firestore.Timestamp.fromDate(new Date(event.dateTime)))
        .get()
        .then((docsRef) => {
            if (docsRef.empty) {
                return true;
            }
            return false;
        })
        .catch((error) => {
            console.log(error);
            return false;
        });

    console.log(canUpdate, "Can update ");
    if (!canUpdate) {
        return res.status(400).json("Can not join the event! You already have an event at that time!");
    }

    const updated = await firestore.collection("events")
        .doc(eventId)
        .update({
            participants: firebase.firestore.FieldValue.arrayUnion(participant),
            users: firebase.firestore.FieldValue.arrayUnion(participant.id),
        })
        .then(() => {
            return true;
        })
        .catch((error) => {
            res.status(404).json(error);
            return false;
        });

    if (updated) {
        await firestore.collection("events")
            .doc(eventId)
            .get()
            .then((docRef) => {
                const event = new Event();
                event.id = docRef.id;

                const data = docRef.data();
                event.sport = data.sport;
                event.level = data.level;
                event.location = data.location;
                event.locationFieldId = data.locationFieldId;
                event.locationFieldName = data.locationFieldName;
                event.locationLatitude = data.locationLatitude;
                event.locationLongitude = data.locationLongitude;
                event.dateTime = data.dateTime.toDate();
                event.createdBy = data.createdBy;
                event.maxNoPlayers = data.maxNoPlayers;
                event.isPublic = data.isPublic;
                event.users = data.users;
                event.participants = data.participants;

                return res.status(200).json(event);
            });
    }
    return res;
};

export const exitEvent = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;

    firestore.collection("events")
        .doc(eventId)
        .update({
            users: firebase.firestore.FieldValue.arrayRemove(userId),
        })
        .then(() => {
            return res.status(200).json("User successfuly removed!");
        })
        .catch((error) => {
            return res.status(404).json(error);
        });
};


export const getMyNextEvents = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;

    await firestore.collection("events")
        .where("users", "array-contains", userId)
        .where("dateTime", ">=", firebase.firestore.Timestamp.now())
        .get()
        .then((docRef) => {
            const events = [];

            docRef.forEach((ref) => {
                const event = new Event();
                event.id = ref.id;

                const data = ref.data();
                event.sport = data.sport;
                event.level = data.level;
                event.location = data.location;
                event.locationFieldId = data.locationFieldId;
                event.locationFieldName = data.locationFieldName;
                event.locationLatitude = data.locationLatitude;
                event.locationLongitude = data.locationLongitude;
                event.dateTime = data.dateTime.toDate();
                event.createdBy = data.createdBy;
                event.maxNoPlayers = data.maxNoPlayers;
                event.isPublic = data.isPublic;
                event.users = data.users;
                event.participants = data.participants;


                events.push(event);
            });
            return res.status(200).json(events);
        })
        .catch((error) => {
            return res.status(500).json("Could not load the user event list: " + error);
        });

    return res;
};

export const getMyPastEvents = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;

    await firestore.collection("events")
        .where("users", "array-contains", userId)
        .where("dateTime", "<=", firebase.firestore.Timestamp.now())
        .get()
        .then((docRef) => {
            const events = [];

            docRef.forEach((ref) => {
                const event = new Event();
                event.id = ref.id;

                const data = ref.data();
                event.sport = data.sport;
                event.level = data.level;
                event.location = data.location;
                event.locationFieldId = data.locationFieldId;
                event.locationFieldName = data.locationFieldName;
                event.locationLatitude = data.locationLatitude;
                event.locationLongitude = data.locationLongitude;
                event.dateTime = data.dateTime.toDate();
                event.createdBy = data.createdBy;
                event.maxNoPlayers = data.maxNoPlayers;
                event.isPublic = data.isPublic;
                event.users = data.users;
                event.participants = data.participants;

                events.push(event);
            });

            return res.status(200).json(events);
        })
        .catch((error) => {
            return res.status(500).json("Could not load the user event list: " + error);
        });

    return res;
};

export const sendMessage = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;
    const message: Message = req.body;
    message.userId = userId;
    message.createdAt = new Date();

    const messageToBeSaved = {
        message: message.message,
        userId: message.userId,
        createdAt: firebase.firestore.Timestamp.fromDate(new Date(message.createdAt)),
    };


    await firestore.collection("events/" + eventId + "/messages")
        .add(messageToBeSaved)
        .then(() => {
            return res.status(200).json("Message sent succesfully!");
        })
        .catch((error) => {
            return res.status(500).json("Could not send message: " + error);
        });

    return res;
};

export const getMessages = async (req: express.Request, res: express.Response) => {
    // const userId = firebase.auth().currentUser.uid

    const eventId = req.params.eventId;
    const numberOfMessages: number = req.body.page * 25;


    await firestore.collection("events/" + eventId + "/messages")
        .orderBy("createdAt", "desc")
        .limit(numberOfMessages)
        .get()
        .then((docRef) => {
            const messages = [];


            for (let index = numberOfMessages - 25; index < docRef.docs.length; index++) {
                const messageData = docRef.docs[index].data();

                const message = new Message();
                message.createdAt = messageData.createdAt.toDate();
                message.message = messageData.message;
                message.userId = messageData.userId;

                messages.push(message);
            }
            return res.status(200).json(messages);
        })
        .catch((error) => {
            return res.status(500).json("Could not get messages: " + error);
        });

    return res;
};


