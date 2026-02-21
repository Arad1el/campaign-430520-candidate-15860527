import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import { TicketPrices } from './lib/TicketPricing.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

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

    this.#groupTicketRequestByType(ticketTypeRequests);
    //if any non-adult tickets, there must also be at least 1 adult ticket
    if (this.#groupedRequests.CHILD + this.#groupedRequests.INFANT > 0 && this.#groupedRequests.ADULT === 0) {
      throw new InvalidPurchaseException("There must be at least 1 ADULT ticket if there are non-ADULT tickets");
    }

    //number of infant seats must be less than or equal to number of adult tickets
    if (this.#groupedRequests.INFANT > this.#groupedRequests.ADULT) {
      throw new InvalidPurchaseException(`Since INFANTS will sit on ADULT laps,
        there must be more ADULT (${this.#groupedRequests.ADULT}) than INFANT (${this.#groupedRequests.INFANT}) tickets`);
    }

    //minimum count for each ticket type must be 0
    if(this.#groupedRequests.ADULT < 0 || this.#groupedRequests.CHILD < 0 || this.#groupedRequests.INFANT < 0) {
      throw new InvalidPurchaseException("Total number for each ticket type must be at least 0");
    }

    //Request seats first - hypothetically, might not be enough in the theatre
    //calculate correct number of seats - Infants don't require a seat
    const requiredSeats = this.#groupedRequests.ADULT + this.#groupedRequests.CHILD;
    //send seat reservation request for that amount
    const seatReservationService = new SeatReservationService();
    seatReservationService.reserveSeat(accountId, requiredSeats);

    //calculate correct payment amount
    const totalCost = this.#getTotalCost();
    //send payment request for that amount
    const paymentService = new TicketPaymentService();
    paymentService.makePayment(accountId, totalCost);
  }

  #getTotalNumberOfTickets(ticketTypeRequests) {
    let numberOfTickets = 0;
    ticketTypeRequests.map((req) => {
      numberOfTickets += req.getNoOfTickets();
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

    this.#groupedRequests.ADULT = adultTicketCount;
    this.#groupedRequests.CHILD = childTicketCount;
    this.#groupedRequests.INFANT = infantTicketCount;
  }

  #getTotalCost() {
    let runningTotal = 0;
    runningTotal += this.#groupedRequests.ADULT * TicketPrices.ADULT;
    runningTotal += this.#groupedRequests.CHILD * TicketPrices.CHILD;
    runningTotal += this.#groupedRequests.INFANT * TicketPrices.INFANT;

    return runningTotal;
  }

  //Defined here so a consistent 'shape'
  #groupedRequests = {
      "ADULT": 0,
      "CHILD": 0,
      "INFANT": 0
  };
}
