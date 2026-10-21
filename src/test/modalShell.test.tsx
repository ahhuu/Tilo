import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

/**
 * Regression tests for the unified dialog shell introduced in v1.5.0.
 *
 * These guard the three defects fixed in v1.5.1 — none of which `tsc` could
 * catch, and none of which had any test coverage before:
 *   1. focus escaped to <body> and Tab stopped being trapped,
 *   2. nested dialogs closed both layers on a single Escape,
 *   3. `dismissable={false}` dialogs swallowed the Android back button
 *      without doing anything (synthetic click hit an overlay with no handler).
 */

// JSDOM has no layout engine, so `offsetParent` is always null and Modal's
// "is this element visible" filter would drop every focusable node.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
});

const getOverlay = () => screen.getByRole('dialog').parentElement as HTMLElement;

/** Mirrors nativeService.dismissTopOverlay(): a synthetic click on the scrim. */
const pressHardwareBack = () => {
  getOverlay().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

describe('Modal shell', () => {
  it('exposes dialog semantics', () => {
    render(
      <Modal onClose={() => {}} ariaLabel="Test dialog">
        <button type="button">inside</button>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test dialog');
  });

  it('closes on Escape when dismissable', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape when dismissable is false', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabel="Test" dismissable={false}>
        <button type="button">inside</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the scrim itself is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    fireEvent.click(getOverlay());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the card', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    fireEvent.click(screen.getByText('inside'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('routes the hardware back button to onBack when not dismissable', () => {
    const onClose = vi.fn();
    const onBack = vi.fn();
    render(
      <Modal onClose={onClose} onBack={onBack} ariaLabel="Locked" dismissable={false}>
        <button type="button">inside</button>
      </Modal>
    );

    pressHardwareBack();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('swallows the hardware back button when not dismissable and no onBack', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabel="Locked" dismissable={false}>
        <button type="button">inside</button>
      </Modal>
    );

    // Nothing to do, but it must not close and must not throw.
    expect(() => pressHardwareBack()).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('only closes the topmost dialog when nested', () => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();

    render(
      <Modal onClose={outerClose} ariaLabel="Outer">
        <button type="button">outer body</button>
        <Modal onClose={innerClose} ariaLabel="Inner">
          <button type="button">inner body</button>
        </Modal>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
  });

  it('pulls focus back into the dialog when it escapes to the page', () => {
    render(
      <Modal onClose={() => {}} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    expect(dialog.contains(document.activeElement)).toBe(true);
    outside.remove();
  });

  it('wraps Tab from the last focusable element back to the first', () => {
    render(
      <Modal onClose={() => {}} ariaLabel="Test">
        <button type="button">first</button>
        <button type="button">last</button>
      </Modal>
    );

    const first = screen.getByText('first');
    const last = screen.getByText('last');

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('returns focus to the trigger after closing', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open dialog';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal onClose={() => {}} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    rerender(
      <Modal isOpen={false} onClose={() => {}} ariaLabel="Test">
        <button type="button">inside</button>
      </Modal>
    );

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
