import { Authentication } from "../models/authentication.class";
import firebase from "firebase";
import * as admin from "firebase-admin";
import { User } from "../models/user.class";
import * as express from "express";
import firestore, { config } from "../config/config";
import * as BusBoy from "busboy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 } from "uuid";

// const db = admin.firestore();
// TODO: see how to add pictures


export const register = async (req: express.Request, res: express.Response) => {
    const authentication = req.body;
    const isOwner = authentication.isOwner as string;

    const role = isOwner ? "owner" : "user";


    await firebase.auth().createUserWithEmailAndPassword(authentication.email, authentication.password)
        .then((record) => {
            const id = record.user.uid;
            const email = record.user.email;

            const user = {
                id: id,
                email: email,
            };
            admin.auth().setCustomUserClaims(record.user.uid, { role });

            firestore.collection("users")
                .doc(user.id)
                .set(user);

            login(req, res);
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json(error);
        });
};


export const login = async (req: express.Request, res: express.Response) => {
    const authentication: Authentication = req.body;

    const userResult = await firebase.auth().signInWithEmailAndPassword(authentication.email, authentication.password)
        .then((result) => {
            return result.user;
        })
        .catch(() => {
            res.status(401).json("Invalid credentials!");
            return null;
        });

    if (userResult != null) {
        const user = await admin.auth().getUser(userResult.uid);
        const token = await userResult.getIdToken();

        const response = {
            token: token,
            role: user.customClaims.role,
            id: user.uid,
        };

        res.status(200).json(response);
    }
};


export const updateUser = async (req: express.Request, res: express.Response) => {
    console.log("update user called.");

    const user = req.body;
    const userId = req.params.id;

    user.id = userId;


    console.log("Profile info", user);
    const userDoc = firestore.collection("users")
        .doc(userId);

    try {
        await userDoc.set(user, { merge: true })
            .then(() => {
                const promises = [];
                const sports = user.sports;
                if (sports != null) {
                    for (const sportLevel in sports) {
                        promises.push(firestore.collection("users").doc(userId).collection("sports").add(sports[sportLevel]));
                    }
                    Promise.all(promises);
                }
            })
            .catch((error) => {
                console.log("Error when setting user", error);
            });

        await firestore.collection("users")
            .doc(userId).get()
            .then((doc) => {
                const updatedUser = new User();
                const data = doc.data();
                updatedUser.id = data.id;
                updatedUser.lastName = data.lastName;
                updatedUser.firstName = data.firstName;
                updatedUser.email = data.email;
                updatedUser.gender = data.gender;
                updatedUser.shortDescription = data.shortDescription;
                updatedUser.birthday = data.birthday;
                updatedUser.activities = data.activities;

                return res.status(200).json(updatedUser);
            })
            .catch((error) => {
                console.log("Error when getting user info", error);
            });
    } catch (error) {
        console.log(error);
        res.status(400).json("Could not update the user!");
    }
    return res;
};

export const getProfile = async (req: express.Request, res: express.Response) => {
    const userId = req.params.id;

    await firestore.collection("users")
        .doc(userId)
        .get()
        .then((doc) => {
            const user = new User();
            const data = doc.data();
            user.id = data.id;
            user.lastName = data.lastName;
            user.firstName = data.firstName;
            user.email = data.email;
            user.gender = data.gender;
            user.shortDescription = data.shortDescription;
            user.birthday = data.birthday;
            user.image = data.image;
            if (data.sports != null) {
                user.activities = data.sports.map((sport) => sport.sport);
            } else {
                user.activities = [];
            }
            data.activities.forEach((element) => {
                user.activities.push(element);
            });
            return res.status(200).json(user);
        })
        .catch(() => {
            return res.status(404).json("Profile not found!");
        });

    return res;
};


export const getProfileByEmail = async (req: express.Request, res: express.Response) => {
    const email = req.query.email;
    const id = req.query.id;

    const user = await firestore.collection("users")
        .where("email", "==", email)
        .get()
        .then((doc) => {
            if (doc.size != 1) {
                res.status(404).json("Profile not found!");
                return null;
            } else {
                const docs = doc.docs;
                const user = new User();
                const data = docs[0].data();
                user.id = data.id;
                user.lastName = data.lastName;
                user.firstName = data.firstName;
                user.email = data.email;
                user.gender = data.gender;
                user.shortDescription = data.shortDescription;
                user.image = data.image;
                if (data.sports != null) {
                    user.activities = data.sports.map((sport) => sport.sport);
                } else {
                    user.activities = [];
                }
                data.activities.forEach((element) => {
                    user.activities.push(element);
                });
                return user;
            }
        });

    if (user) {
        await firestore.collection("friends/" + id + "/list")
            .where("id", "==", user.id)
            .get()
            .then((response) => {
                console.log(response.size, "Response");
                if (response.size != 0) {
                    res.status(400).json("Already in your friend list!").send();
                } else {
                    res.status(200).json(user);
                }
            })
            .catch(() => true);
    }
};

export const uploadImage = async (req: any, res: express.Response) => {
    const headers = { headers: req.headers };

    const busboy = new BusBoy(headers);

    let imageToBeUploaded: any = {};
    let imageFileName;

    await busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
            res.status(400).json({ error: "Wrong file type submitted" });
        }
        const imageExtension = filename.split(".")[filename.split(".").length - 1];
        imageFileName = "profileImage" + new Date().valueOf() + "." + imageExtension;
        const filePath = path.join(os.tmpdir(), imageFileName);

        console.log(imageFileName);

        imageToBeUploaded = { filePath, mimetype };
        file.pipe(fs.createWriteStream(filePath));
    });

    const uid = req.params.id;

    await busboy.on("finish", async () => {
        const image = await admin
            .storage()
            .bucket(config.storageBucket)
            .upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        firebaseStorageDownloadTokens: v4(),
                        contentType: imageToBeUploaded.mimetype,
                    },
                },
            })
            .then(() => {
                return admin.storage().bucket(config.storageBucket).file(imageFileName).getSignedUrl({
                    action: "read",
                    expires: "03-09-2491",
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ error: err + "ss" });
                return null;
            });


        console.log(image, "HEreee");

        await firestore.collection("users")
            .doc(uid)
            .set({ image: image[0] }, { merge: true })
            .then(() => {
                res.status(200).json("Image updated successfully!");
            })
            .catch(() => {
                res.status(400).json("Could not update the picture!");
            });
    });
    await busboy.end(req.rawBody);
};

