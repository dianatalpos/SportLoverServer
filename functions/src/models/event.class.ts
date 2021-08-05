import { Level } from "./level.enum";
import { Participant } from "./Participant.class";
import { Sport } from "./sport.enum";

export class Event {
    id: string;
    sport: Sport;
    level: Level;
    location: string;
    locationFieldName: string;
    locationLatitude: number;
    locationLongitude: number;
    locationId: string;
    locationFieldId: string;
    dateTime: Date;
    duration: Long;
    createdBy: string;
    maxNoPlayers: Long;
    isPublic: boolean;
    users: string[];
    participants: Participant[];
}
