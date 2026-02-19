import assert from 'node:assert/strict';
import { describe, it, before, mock } from 'node:test';

import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';

import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js';

describe("TicketService", async () => {
    const paymentServiceMock = mock.fn();
    const seatBookingMock = mock.fn();
    let ticketService;

    before(async() => {
        //Mpck the external services to prevent them being called, and to track them being invoked
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

        ({ticketService} = await import ("../src/pairtest/TicketService.js"));
    });

    describe("Account IDs", () => {
        it("should NOT accept integer account ids less than 1", () => {
            assert.throws(() => ticketService.purchaseTickets(0, []));
        });
        
        it("should NOT accept non-integer account ids", () => {
            assert.throws(() => ticketService.purchaseTickets(3.141592, []));
        });
    });


})