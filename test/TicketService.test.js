import assert from 'node:assert/strict';
import { describe, it, before, mock, beforeEach } from 'node:test';

import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';

describe("TicketService", async () => {
    let paymentsMade = false;
    const paymentServiceMock = mock.fn(class {
        makePayment(accountId, totalAmountToPay) {
            paymentsMade = true;
        }
    });

    let seatsReserved = false;
    const seatBookingMock = mock.fn(class {
        reserveSeat(accountId, totalSeatsToAllocate) {
            paymentsMade = true;
        }
    });
    let ticketService;

    before(async() => {
        //Mock the external services to prevent them being called, and to track them being invoked
        const paymentServiceNamedExports = await import("../src/thirdparty/paymentgateway/TicketPaymentService.js")
        .then(({ default: _, ...rest}) => rest);

        mock.module("../src/thirdparty/paymentgateway/TicketPaymentService.js", {
            defaultExport: paymentServiceMock,
            namedExports: paymentServiceNamedExports
        });

        const seatReservationServiceNamedExports = await import("../src/thirdparty/seatbooking/SeatReservationService.js")
        .then(({ default: _, ...rest}) => rest);

        mock.module("../src/thirdparty/seatbooking/SeatReservationService.js", {
            defaultExport: seatBookingMock,
            namedExports: seatReservationServiceNamedExports
        });

        const TicketServiceClass = (await import ("../src/pairtest/TicketService.js")).default;
        ticketService = new TicketServiceClass();
    });

    beforeEach(() => {
        paymentsMade = false;
        seatsReserved = false;
    });

    describe("Account IDs", () => {
        it("should NOT accept integer account ids less than 1", () => {
            assert.throws(() => ticketService.purchaseTickets(0, []));
        });
        
        it("should NOT accept non-integer account ids", () => {
            assert.throws(() => ticketService.purchaseTickets(3.141592, []));
        });

    });

    describe("should NOT accept more than 25 tickets", () => {
        it("26 in a single request", () => {
            assert.throws(() => ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 26)));
        });

        it("26 in a 2 requests", () => {
            assert.throws(() => ticketService.purchaseTickets(1, 
                new TicketTypeRequest("ADULT", 13),
                new TicketTypeRequest("ADULT", 13))
            );
        });
    });

    describe("adult supervision", () => {
        it("should NOT allow CHILD tickets without ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1, new TicketTypeRequest("CHILD", 1)));
        });

        it("should NOT allow INFANT tickets without ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1, new TicketTypeRequest("INFANT", 1)));
        });

        it("should NOT allow more INFANT tickets than ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("INFANT", 2))
            );
        });

        it("should allow equal INFANT tickets and ADULT tickets", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1,
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("INFANT", 1))
            );
        });

        it("should allow more ADULT tickets than INFANT tickets", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1, 
                new TicketTypeRequest("ADULT", 2),
                new TicketTypeRequest("INFANT", 1))
            );
        });

        it("should allow CHILD tickets when at least one ADULT ticket", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1,
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("CHILD", 10))
            );
        });
    });
});