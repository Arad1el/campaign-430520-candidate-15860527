import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    //account id must be an integer above 0
    if (!Number.isInteger(accountId)) {
      throw new InvalidPurchaseException("Account ID must be an integer");
    }
    if (accountId <= 0) {
      throw new InvalidPurchaseException("Account ID must be greater than 0");
    }

    //total number of tickets in the ticket requests must be less than or equal to 25
    const ticketCount = this.#getTotalNumberOfTickets(ticketTypeRequests);
    if (ticketCount <= 0 || ticketCount > 25) {
      throw new InvalidPurchaseException("Total ticket count must be between 1 and 25");
    }

    const groupedRequests = this.#groupTicketRequestByType(ticketTypeRequests);
    //if any non-adult tickets, there must also be at least 1 adult ticket
    if (groupedRequests.CHILD + groupedRequests.INFANT > 0 && groupedRequests.ADULT === 0) {
      throw new InvalidPurchaseException("There must be at least 1 ADULT ticket if there are non-ADULT tickets");
    }

    //number of infant seats must be less than or equal to number of adult tickets
    if (groupedRequests.INFANT > groupedRequests.ADULT) {
      throw new InvalidPurchaseException(`Since INFANTS will sit on ADULT laps,
        there must be more ADULT (${groupedRequests.ADULT}) than INFANT (${groupedRequests.INFANT}) tickets`);
    }

    //calculate correct payment amount
    //send payment request for that amount
    const paymentService = new TicketPaymentService();
    paymentService.makePayment(1, 1);

    //calculate correct number of seats
    //send seat reservation request for that amount

    // throws InvalidPurchaseException
  }

  #getTotalNumberOfTickets(ticketTypeRequests) {
    let numberOfTickets = 0;
    ticketTypeRequests.map((req) => {
      numberOfTickets += req.getNoOfTickets();
      console.log("Total number of tickets:" + numberOfTickets)
    });

    return numberOfTickets;
  }

  #groupTicketRequestByType(ticketTypeRequests) {
    let adultTicketCount = 0;
    let childTicketCount = 0;
    let infantTicketCount = 0;

    ticketTypeRequests.map((req) => {
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
    });

    return {
      "ADULT": adultTicketCount,
      "CHILD": childTicketCount,
      "INFANT": infantTicketCount
    };
  }
}
