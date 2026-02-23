import assert from 'node:assert/strict';
import { describe, it, before, mock, beforeEach } from 'node:test';

import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import TicketCalculator from '../src/pairtest/lib/TicketCalculator.js';

//Tests for the TicketService class
describe("TicketService", async () => {
    let paymentAmount;
    let paymentAccount;
    const paymentServiceMock = mock.fn(class {
        makePayment(accountId, totalAmountToPay) {
            paymentAmount = totalAmountToPay;
            paymentAccount = accountId;
        }
    });

    let seatAmount;
    let seatAccount;
    const seatBookingMock = mock.fn(class {
        reserveSeat(accountId, totalSeatsToAllocate) {
            seatAmount = totalSeatsToAllocate;
            seatAccount = accountId;
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
        //Reset variables for tracking the mocked services 
        paymentAmount = -1;
        paymentAccount = -1;
        seatAmount = -1;
        seatAccount = -1;
    });

    describe("Account IDs", () => {
        it("should NOT accept integer account ids less than 1", () => {
            assert.throws(() => ticketService.purchaseTickets(0, []),
                InvalidPurchaseException);
        });
        
        it("should NOT accept non-integer account ids", () => {
            assert.throws(() => ticketService.purchaseTickets(3.141592, []),
                InvalidPurchaseException);
        });

        it("should use correct Account ID for payment", () => {            
            const req = new TicketTypeRequest("ADULT", 2);
            const passedAccountId = 1;

            assert.doesNotThrow(() => ticketService.purchaseTickets(passedAccountId, req));
            assert.strict.equal(paymentAccount, passedAccountId);
        });

        it("should use correct Account ID for seat reservations", () => {            
            const req = new TicketTypeRequest("ADULT", 2);
            const passedAccountId = 1;

            assert.doesNotThrow(() => ticketService.purchaseTickets(passedAccountId, req));
            assert.strict.equal(seatAccount, passedAccountId);
        });
    });

    describe("Should NOT accept more than 25 tickets", () => {
        it("26 in a single request", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("ADULT", 26)),
                InvalidPurchaseException);
        });

        it("26 in a 2 requests", () => {
            assert.throws(() => ticketService.purchaseTickets(1, 
                    new TicketTypeRequest("ADULT", 13),
                    new TicketTypeRequest("ADULT", 13)),
                InvalidPurchaseException);
        });
    });

    describe("Adult supervision", () => {
        it("should NOT allow CHILD tickets without ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("CHILD", 1)),
                InvalidPurchaseException);
        });

        it("should NOT allow INFANT tickets without ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("INFANT", 1)),
                InvalidPurchaseException);
        });

        it("should NOT allow more INFANT tickets than ADULT tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("ADULT", 1),
                    new TicketTypeRequest("INFANT", 2)),
                InvalidPurchaseException);
        });

        it("should allow equal INFANT tickets and ADULT tickets", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1,
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("INFANT", 1)
            ));
        });

        it("should allow more ADULT tickets than INFANT tickets", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1, 
                new TicketTypeRequest("ADULT", 2),
                new TicketTypeRequest("INFANT", 1)
            ));
        });

        it("should allow CHILD tickets when at least one ADULT ticket", () => {
            assert.doesNotThrow(() => ticketService.purchaseTickets(1,
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("CHILD", 10)
            ));
        });
    });

    describe("Should NOT accept negative ticket values", () => {
        it("negative adult tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("ADULT", -1)),
                InvalidPurchaseException
            );
        });

        it("negative child tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("ADULT", 1),
                    new TicketTypeRequest("CHILD", -1)),
                InvalidPurchaseException
            );
        });

        it("negative infant tickets", () => {
            assert.throws(() => ticketService.purchaseTickets(1,
                    new TicketTypeRequest("ADULT", 1),
                    new TicketTypeRequest("INFANT", -1)),
                InvalidPurchaseException
            );
        });
    });

    describe("Should request correct number of seats", () => {
        it("adult tickets have correct seat requirement", () => {
            const req = new TicketTypeRequest("ADULT", 2);

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(seatAmount, TicketCalculator.getRequiredSeats(req));
        });

        it("child tickets have correct seat requirement", () => {
            const req = [
                new TicketTypeRequest("ADULT", 2),
                new TicketTypeRequest("CHILD", 1)
            ];

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(seatAmount, TicketCalculator.getRequiredSeats(req));
        });

        it("infant tickets have correct seat requirement", () => {
            const req = [
                new TicketTypeRequest("ADULT", 2),
                new TicketTypeRequest("INFANT", 1)
            ];

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(seatAmount, TicketCalculator.getRequiredSeats(req));
        });
    });

    describe("Should request correct payment amount", () => {
        it("adult tickets have correct cost", () => {
            const req = new TicketTypeRequest("ADULT", 1);

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(paymentAmount, TicketCalculator.getTotalPrice(req));
        });

        it("child tickets have correct cost", () => {
            const req = [
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("CHILD", 1)
            ];

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(paymentAmount, TicketCalculator.getTotalPrice(req));
        });

        it("infant tickets have correct cost", () => {
            const req = [
                new TicketTypeRequest("ADULT", 1),
                new TicketTypeRequest("INFANT", 1)
            ];

            assert.doesNotThrow(() => ticketService.purchaseTickets(1, req));
            assert.equal(paymentAmount, TicketCalculator.getTotalPrice(req));
        });
    });
});