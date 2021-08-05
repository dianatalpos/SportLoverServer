import { Gender } from "./gender.enum";
import { SportLevel } from "./sportLevel.class";

export class Authentication {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthday: Date;
    gender: Gender;
    shortDescription: string;
    image: string;
    sports: SportLevel[];
    role: string;
}
