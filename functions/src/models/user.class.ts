import {Gender} from "./gender.enum";
import {SportLevel} from "./sportLevel.class";

export class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    birthday: Date;
    gender: Gender;
    shortDescription: string;
    image: string;
    sports: SportLevel[];
    activities: string[];
}
