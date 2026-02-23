import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import { SeatsPerTicketType, TicketPrices } from '../src/pairtest/lib/TicketStatistics.js';
import TicketCalculator from '../src/pairtest/lib/TicketCalculator.js';

//Tests for the TicketCalculator class
describe("TicketCalculator", async () => {
    //Multiple different data sets to ensure it's actually doing calculations correctly
    describe("Data Set 1", () => {
        const ticketRequests = [
            new TicketTypeRequest("ADULT", 1),
            new TicketTypeRequest("CHILD", 1),
            new TicketTypeRequest("INFANT", 1),
            new TicketTypeRequest("ADULT", 2),
            new TicketTypeRequest("CHILD", 3),
            new TicketTypeRequest("ADULT", 4),
            new TicketTypeRequest("CHILD", 5),
            new TicketTypeRequest("ADULT", 1),
            new TicketTypeRequest("CHILD", 1),
            new TicketTypeRequest("ADULT", 1)
        ];
        const expectedAdultCount = 9;
        const expectedChildCount = 10;
        const expectedInfantCount = 1;

        it("should group ticket requests correctly", () => {
            const groupedRequests = TicketCalculator.groupRequestsByType(ticketRequests);
            const adultTicketCount = groupedRequests.find((req) => req.getTicketType() === "ADULT").getNoOfTickets();
            const childTicketCount = groupedRequests.find((req) => req.getTicketType() === "CHILD").getNoOfTickets();
            const infantTicketCount = groupedRequests.find((req) => req.getTicketType() === "INFANT").getNoOfTickets();

            assert.strict.equal(adultTicketCount, expectedAdultCount);
            assert.strict.equal(childTicketCount, expectedChildCount);
            assert.strict.equal(infantTicketCount, expectedInfantCount);
        });

        it("should calculate total number of tickets correctly", () => {
            const totalNumberOfTickets = TicketCalculator.getTotalNumberOfTickets(ticketRequests);

            assert.strict.equal(totalNumberOfTickets, (expectedAdultCount + expectedChildCount + expectedInfantCount));
        });

        it("should calculate total number of seats correctly", () => {
            const totalNumberOfSeats = TicketCalculator.getRequiredSeats(ticketRequests);

            assert.strict.equal(totalNumberOfSeats,
                (expectedAdultCount * SeatsPerTicketType.ADULT)
                + (expectedChildCount * SeatsPerTicketType.CHILD)
                + (expectedInfantCount * SeatsPerTicketType.INFANT)    
            );
        });

        it("should calculate total cost correctly", () => {
            const returnedCost = TicketCalculator.getTotalPrice(ticketRequests);

            assert.strict.equal(returnedCost,
                (expectedAdultCount * TicketPrices.ADULT)
                + (expectedChildCount * TicketPrices.CHILD)
                + (expectedInfantCount * TicketPrices.INFANT)    
            );
        });
    });

    describe("Data Set 2", () => {
        const ticketRequests = [
            new TicketTypeRequest("ADULT", 10),
            new TicketTypeRequest("CHILD", 3),
            new TicketTypeRequest("INFANT", 5),
            new TicketTypeRequest("ADULT", 1),
            new TicketTypeRequest("CHILD", 1),
        ];
        const expectedAdultCount = 11;
        const expectedChildCount = 4;
        const expectedInfantCount = 5;

        it("should group ticket requests correctly", () => {
            const groupedRequests = TicketCalculator.groupRequestsByType(ticketRequests);
            const adultTicketCount = groupedRequests.find((req) => req.getTicketType() === "ADULT").getNoOfTickets();
            const childTicketCount = groupedRequests.find((req) => req.getTicketType() === "CHILD").getNoOfTickets();
            const infantTicketCount = groupedRequests.find((req) => req.getTicketType() === "INFANT").getNoOfTickets();

            assert.strict.equal(adultTicketCount, expectedAdultCount);
            assert.strict.equal(childTicketCount, expectedChildCount);
            assert.strict.equal(infantTicketCount, expectedInfantCount);
        });

        it("should calculate total number of tickets correctly", () => {
            const totalNumberOfTickets = TicketCalculator.getTotalNumberOfTickets(ticketRequests);

            assert.strict.equal(totalNumberOfTickets, (expectedAdultCount + expectedChildCount + expectedInfantCount));
        });

        it("should calculate total number of seats correctly", () => {
            const totalNumberOfSeats = TicketCalculator.getRequiredSeats(ticketRequests);

            assert.strict.equal(totalNumberOfSeats,
                (expectedAdultCount * SeatsPerTicketType.ADULT)
                + (expectedChildCount * SeatsPerTicketType.CHILD)
                + (expectedInfantCount * SeatsPerTicketType.INFANT)    
            );
        });

        it("should calculate total cost correctly", () => {
            const returnedCost = TicketCalculator.getTotalPrice(ticketRequests);

            assert.strict.equal(returnedCost,
                (expectedAdultCount * TicketPrices.ADULT)
                + (expectedChildCount * TicketPrices.CHILD)
                + (expectedInfantCount * TicketPrices.INFANT)    
            );
        });
    });
});