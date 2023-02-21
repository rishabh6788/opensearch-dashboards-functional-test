/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  delayTime,
  setTimeFilter,
  SPAN_ID,
  TRACE_ID,
} from '../../../utils/constants';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';

dayjs.extend(customParseFormat);

describe('Testing traces table empty state', () => {
  beforeEach(() => {
    cy.visit('app/observability-dashboards#/trace_analytics/traces', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    cy.wait(delayTime * 3);
  });

  it('Renders empty state', () => {
    cy.contains(' (0)').should('exist');
    cy.contains('No matches').should('exist');
  });
});

describe('Testing traces table', () => {
  beforeEach(() => {
    cy.visit('app/observability-dashboards#/trace_analytics/traces', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
  });

  it('Renders the traces table', () => {
    cy.contains(' (108)').should('exist');
    cy.get('.euiTableCellContent')
      .eq(17)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD/YYYY HH:mm:ss', true).isValid()).to.be.true;
      });
    cy.contains('03f9c770db5ee2f1caac0...').should('exist');
    cy.contains('224.99').should('exist');

    // test data contains output from data-prepper 0.8, which doesn't have fields denormalized
    // Trace Analytics should be able to handle the discrepancy if some fields cannot be parsed
    cy.contains('Invalid date').should('exist');
    cy.contains('-').should('exist');
  });

  it('Sorts the traces table', () => {
    cy.get('.euiTableRow').first().contains('-').should('exist');
    cy.get('.euiTableCellContent').contains('Trace group').click();
    cy.get('.euiTableRow').first().contains('/%2A%2A').should('exist');
  });

  it('Searches correctly', () => {
    cy.get('input[type="search"]').focus().type(`${TRACE_ID}{enter}`);
    cy.get('.euiButton__text').contains('Refresh').click();
    cy.contains(' (1)').should('exist');
    cy.get('.euiTableCellContent')
      .eq(11)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD/YYYY HH:mm:ss', true).isValid()).to.be.true;
      });
  });
});

describe('Testing trace view', () => {
  beforeEach(() => {
    cy.visit(
      `app/observability-dashboards#/trace_analytics/traces/${TRACE_ID}`,
      {
        onBeforeLoad: (win) => {
          win.sessionStorage.clear();
        },
      }
    );
  });

  it('Renders the trace view', () => {
    cy.contains('43.75%').should('exist');
    cy.contains('42.58%').should('exist');
    cy.get('.euiFlexItem--flexGrowZero')
      .eq(5)
      .children()
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD/YYYY HH:mm:ss', true).isValid()).to.be.true;
      });
    cy.contains(TRACE_ID).should('exist');

    cy.get('div.js-plotly-plot').should('have.length.gte', 2);
    cy.get('text[data-unformatted="database <br>mysql.APM "]').should('exist');
    cy.contains(`"${SPAN_ID}"`).should('exist');
  });

  it('Has working breadcrumbs', () => {
    cy.get(
      `.euiBreadcrumb[href="#/trace_analytics/traces/${TRACE_ID}"]`
    ).click();
    cy.wait(delayTime);
    cy.get('h2.euiTitle').contains(TRACE_ID).should('exist');
    cy.get('.euiBreadcrumb[href="#/trace_analytics/traces"]').click();
    cy.wait(delayTime);
    cy.get('.euiTitle').contains('Traces').should('exist');
    cy.get('.euiBreadcrumb[href="#/trace_analytics/home"]').click();
    cy.wait(delayTime);
    cy.get('.euiTitle').contains('Dashboard').should('exist');
    cy.get('.euiBreadcrumb[href="observability-dashboards#/"]').click();
    cy.wait(delayTime);
    cy.get('.euiTitle').contains('Event analytics').should('exist');
  });

  it('Renders data grid, flyout and filters', () => {
    cy.get('.euiButton__text[title="Span list"]').click({ force: true });
    cy.contains('2 columns hidden').should('exist');

    cy.wait(delayTime);
    cy.get('.euiLink').contains(SPAN_ID).trigger('mouseover', { force: true });
    cy.get('button[data-datagrid-interactable="true"]')
      .eq(0)
      .click({ force: true });
    cy.get('button[data-datagrid-interactable="true"]')
      .eq(0)
      .click({ force: true }); // first click doesn't go through eui data grid
    cy.wait(delayTime);
    cy.contains('Span detail').should('exist');
    cy.contains('Span attributes').should('exist');
    cy.get('.euiTextColor').contains('Span ID').trigger('mouseover');
    cy.get('.euiButtonIcon[aria-label="span-flyout-filter-icon"').click({
      force: true,
    });
    cy.wait(delayTime);

    cy.get('.euiBadge__text').contains('spanId: ').should('exist');
    cy.contains('Spans (1)').should('exist');
  });
});
