import firebase from "firebase";
import "firebase/storage";

export const config={
};

firebase.initializeApp(config);

const firestore = firebase.firestore();

export const storage = firebase.storage();

export default firestore;
