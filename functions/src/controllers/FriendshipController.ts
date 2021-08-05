import * as express from "express";
import firestore from "../config/config";
import Friend from "../models/friend.class";
import { Friendship } from "../models/friendship.enum";

export const sendFriendRequest = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const body = req.body;

    const friendTo = new Friend();
    friendTo.id = body.id;
    friendTo.image = body.image;
    friendTo.firstName = body.firstName;
    friendTo.lastName = body.lastName;

    const requestTo = { ...friendTo, type: Friendship.SENT };
    console.log(requestTo);

    const requestFrom = await firestore.collection("users")
        .doc(userId)
        .get()
        .then((doc) => {
            const friend = new Friend();
            const data = doc.data();
            friend.id = data.id;
            friend.lastName = data.lastName;
            friend.firstName = data.firstName;
            friend.image = data.image;

            return { ...friend, type: Friendship.RECEIVED };
        })
        .catch(() => null);
    console.log(requestFrom);

    if (requestFrom != null) {
        const result1 = await firestore.collection("requests_list/" + userId + "/list")
            .add(requestTo)
            .then(() => true)
            .catch(() => false);
        const result2 = await firestore.collection("requests_list/" + friendTo.id + "/list")
            .add(requestFrom)
            .then(() => true)
            .catch(() => false);

        if (result1 && result2) {
            return res.status(200).json("Friend Request sent!");
        } else {
            return res.status(500).json("Could not send friend Request!");
        }
    } else {
        return res.status(500).json("Could not send friend Request!");
    }
};

export const getFriends = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;

    await firestore.collection("friends/" + userId + "/list")
        .get()
        .then((docRef) => {
            const friendList = [];

            docRef.forEach((element) => {
                const data = element.data();

                const friend = new Friend();
                friend.firstName = data.firstName;
                friend.lastName = data.lastName;
                friend.id = data.id;
                friend.image = data.image;

                friendList.push(friend);
            });

            return res.status(200).json(friendList);
        })
        .catch((error) => {
            return res.status(500).json(error);
        });
};


export const getFriendsRequests = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;

    const friendList = [];

    const response = await firestore.collection("requests_list/" + userId + "/list")
        .where("type", "==", Friendship.RECEIVED)
        .get()
        .then((docRef) => {
            docRef.forEach((element) => {
                const data = element.data();

                const friend = new Friend();
                friend.firstName = data.firstName;
                friend.lastName = data.lastName;
                friend.id = data.id;
                friend.image = data.image;

                friendList.push(friend);
            });
            return true;
        })
        .catch((error) => {
            res.status(500).json(error);
            return false;
        });

    if (response) {
        res.status(200).json(friendList);
    }
    return res;
};


export const acceptFriendRequest = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const friend = req.body;

    const friend1 = await firestore.collection("requests_list/" + userId + "/list")
        .where("id", "==", friend.id)
        .get()
        .then((docRef) => {
            if (docRef.empty) {
                return res.status(404).json("Friend request not found!");
            }

            docRef.forEach((document) => {
                firestore.collection("friends").doc(userId).collection("list").add(friend);
                document.ref.delete().then(() => console.log("Successfully deleted")).catch((error) => console.log("error appeared", error));
            });

            return true;
        })
        .catch((error) => {
            res.status(500).json(error);
            return false;
        });

    const friend2 = await firestore.collection("requests_list/" + friend.id + "/list")
        .where("id", "==", userId)
        .get()
        .then((docRef) => {
            if (docRef.empty) {
                return res.status(404).json("Friend request not found!");
            }

            docRef.forEach((document) => {
                const data = document.data();

                const userFriend = new Friend();
                userFriend.id = data.id;
                userFriend.firstName = data.firstName;
                userFriend.lastName = data.lastName;
                userFriend.image = data.image;

                const frd = { ...userFriend };

                console.log(frd, "in friend rewuests!!");
                firestore.collection("friends").doc(friend.id).collection("list").add(frd);
                document.ref.delete().then(() => console.log("Successfully deleted")).catch((error) => console.log("error appeared", error));
            });

            return true;
        })
        .catch((error) => {
            console.log(error, "Error in accept friend request");
            res.status(500).json(error);
            return false;
        });

    console.log(userId, "UserId");
    console.log(friend, "Friend");

    if (friend1 && friend2) {
        res.status(200).json(friend).send();
    }

    return res;
};

export const declineFriendRequest = async (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const friend = req.body;

    const friend1 = await firestore.collection("requests_list/" + userId + "/list")
        .where("id", "==", friend.id)
        .get()
        .then((docRef) => {
            if (docRef.empty) {
                return res.status(404).json("Friend request not found!");
            }

            docRef.forEach((document) => {
                document.ref.delete();
            });

            return true;
        })
        .catch((error) => {
            res.status(500).json(error);
            return false;
        });

    const friend2 = await firestore.collection("requests_list/" + friend.id + "/list")
        .where("id", "==", userId)
        .get()
        .then((docRef) => {
            if (docRef.empty) {
                return res.status(404).json("Friend request not found!");
            }

            docRef.forEach((document) => {
                document.ref.delete();
            });

            return true;
        })
        .catch((error) => {
            console.log(error, "Error in accept friend request");
            res.status(500).json(error);
            return false;
        });

    if (friend1 && friend2) {
        res.status(200).json(friend).send();
    }

    return res;
};
