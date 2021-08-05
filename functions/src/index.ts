import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import appRoutes from "./routes";
import * as admin from "firebase-admin";
import * as serviceAccount from "./config/sportapp-aa560-firebase-adminsdk-uiihi-a5890bec4b.json";
import { ServiceAccount } from "firebase-admin";

const app = express();

const configuration = { credential: admin.credential.cert(serviceAccount as ServiceAccount) };

admin.initializeApp(configuration);

app.use(cors());
app.use(bodyParser.json());

app.use("/", appRoutes);

exports.app = functions.https.onRequest(app);
