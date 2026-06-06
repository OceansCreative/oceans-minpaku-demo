/**
 * Add-on service. Pure functions — no store access, no I/O.
 *
 * Calculates the total cost and enriched details for a set of selected add-ons.
 */
import type { BookingAddon, SelectedAddon } from '@/types/addon';

/**
 * Returns total JPY for all selected add-ons (pricePerStay * quantity, summed).
 * Unknown addonIds (not found in allAddons) are silently skipped.
 */
export function calculateAddonTotal(
  selectedAddons: SelectedAddon[],
  allAddons: BookingAddon[],
): number {
  return selectedAddons.reduce((sum, sel) => {
    const addon = allAddons.find((a) => a.id === sel.addonId);
    if (!addon) return sum;
    return sum + addon.pricePerStay * sel.quantity;
  }, 0);
}

/**
 * Returns an enriched list of selected add-ons for display.
 * Unknown addonIds (not found in allAddons) are silently skipped.
 */
export function getSelectedAddonDetails(
  selectedAddons: SelectedAddon[],
  allAddons: BookingAddon[],
): Array<{ addon: BookingAddon; quantity: number; subtotal: number }> {
  const result: Array<{ addon: BookingAddon; quantity: number; subtotal: number }> = [];
  for (const sel of selectedAddons) {
    const addon = allAddons.find((a) => a.id === sel.addonId);
    if (!addon) continue;
    result.push({
      addon,
      quantity: sel.quantity,
      subtotal: addon.pricePerStay * sel.quantity,
    });
  }
  return result;
}
