import { SeatsPerTicketType, TicketPrices } from "./TicketStatistics.js";
import TicketTypeRequest from "./TicketTypeRequest.js";

/*
Responsible for calculations relating to tickets
All methods are static because there's no reason to have an instance of this class
*/
export default class TicketCalculator {
    static #getCountOfEachType(...ticketTypeRequests) {
        let adultTicketCount = 0;
        let childTicketCount = 0;
        let infantTicketCount = 0;

        ticketTypeRequests
            .flat(Infinity)
            .forEach((req) => {
                const ticketCount = req.getNoOfTickets();
                switch(req.getTicketType()) {
                    case "ADULT":
                        adultTicketCount += ticketCount;
                        break;
                    case "CHILD":
                        childTicketCount += ticketCount;
                        break;
                    case "INFANT":
                        infantTicketCount += ticketCount;
                        break;
                }
            }
        );

        return {
            "ADULT": adultTicketCount,
            "CHILD": childTicketCount,
            "INFANT": infantTicketCount
        };
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