import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    //account id must be an integer above 0
    if (!Number.isInteger(accountId)) throw new InvalidPurchaseException("Account ID must be an integer");
    if (accountId <= 0) throw new InvalidPurchaseException("Account ID must be greater than 0");

    //total number of tickets in the ticket requests must be less than or equal to 25

    //if any non-adult tickets, there must also be at least 1 adult ticket

    //number of infant seats must be less than or equal to number of adult tickets

    //calculate correct payment amount
    //send payment request for that amount

    //calculate correct number of seats
    //send seat reservation request for that amount

    // throws InvalidPurchaseException
  }
}
