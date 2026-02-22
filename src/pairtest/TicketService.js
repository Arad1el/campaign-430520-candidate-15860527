import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import TicketCalculator from './lib/TicketCalculator.js';

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
    const ticketCount = TicketCalculator.getTotalNumberOfTickets(ticketTypeRequests);
    if (ticketCount <= 0 || ticketCount > 25) {
      throw new InvalidPurchaseException("Total ticket count must be between 1 and 25");
    }

    const groupedRequests = TicketCalculator.groupRequestsByType(ticketTypeRequests);
    const adultTicketCount = groupedRequests.find((req) => req.getTicketType() === "ADULT").getNoOfTickets();
    const childTicketCount = groupedRequests.find((req) => req.getTicketType() === "CHILD").getNoOfTickets();
    const infantTicketCount = groupedRequests.find((req) => req.getTicketType() === "INFANT").getNoOfTickets();

    //if any non-adult tickets, there must also be at least 1 adult ticket
    if ((childTicketCount + infantTicketCount) > 0 && adultTicketCount === 0) {
      throw new InvalidPurchaseException("There must be at least 1 ADULT ticket if there are non-ADULT tickets");
    }

    //number of infant seats must be less than or equal to number of adult tickets
    if (infantTicketCount > adultTicketCount) {
      throw new InvalidPurchaseException(`Since INFANTS will sit on ADULT laps,
        there must be more ADULT (${adultTicketCount}) than INFANT (${infantTicketCount}) tickets`);
    }

    //minimum count for each ticket type must be 0
    if (adultTicketCount < 0 || childTicketCount < 0 || infantTicketCount < 0) {
      throw new InvalidPurchaseException("Total number for each ticket type must be at least 0");
    }

    //Request seats first - hypothetically, might not be enough in the theatre
    const requiredSeats = TicketCalculator.getRequiredSeats(groupedRequests);
    //send seat reservation request for that amount
    const seatReservationService = new SeatReservationService();
    seatReservationService.reserveSeat(accountId, requiredSeats);

    //calculate correct payment amount
    const totalCost = TicketCalculator.getTotalPrice(groupedRequests);
    //send payment request for that amount
    const paymentService = new TicketPaymentService();
    paymentService.makePayment(accountId, totalCost);
  }
}
