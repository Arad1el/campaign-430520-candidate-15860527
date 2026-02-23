import { SeatsPerTicketType, TicketPrices } from "./TicketStatistics.js";
import TicketTypeRequest from "./TicketTypeRequest.js";

/*
Responsible for calculations relating to tickets
All methods are static because there's no reason to have an instance of this class
*/
export default class TicketCalculator {
    static #getCountOfEachType(...ticketTypeRequests) {
        const groupedCounts = {
            "ADULT": 0,
            "CHILD": 0,
            "INFANT": 0
        };

        ticketTypeRequests
            .flat(Infinity)
            .forEach((req) => {
                groupedCounts[req.getTicketType()] += req.getNoOfTickets();
            }
        );

        return groupedCounts;
    }

    static groupRequestsByType(...ticketTypeRequests) {
        const counts = this.#getCountOfEachType(ticketTypeRequests);

        return [
            new TicketTypeRequest("ADULT", counts.ADULT),
            new TicketTypeRequest("CHILD", counts.CHILD),
            new TicketTypeRequest("INFANT", counts.INFANT)
        ];
    }

    static getTotalNumberOfTickets(...ticketTypeRequests) {
        let ticketCount = 0;
        ticketTypeRequests
            .flat(Infinity)
            .forEach((req) => {
                ticketCount += req.getNoOfTickets();
            }
        );

        return ticketCount;
    }

    static getTotalPrice(...ticketTypeRequests) {
        const counts = this.#getCountOfEachType(ticketTypeRequests);

        return (counts.ADULT * TicketPrices.ADULT)
            + (counts.CHILD * TicketPrices.CHILD)
            + (counts.INFANT * TicketPrices.INFANT);
    }

    static getRequiredSeats(...ticketTypeRequests) {
        const counts = this.#getCountOfEachType(ticketTypeRequests);

        return (counts.ADULT * SeatsPerTicketType.ADULT)
            + (counts.CHILD * SeatsPerTicketType.CHILD)
            + (counts.INFANT * SeatsPerTicketType.INFANT);
    }
}