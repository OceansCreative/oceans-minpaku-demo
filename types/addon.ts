export interface BookingAddon {
  id: string;
  /** i18n key, e.g. "addons.bbq" */
  name: string;
  /** JPY, added once per reservation regardless of nights */
  pricePerStay: number;
  /** Emoji or icon name for display */
  icon: string;
  available: boolean;
}

export interface SelectedAddon {
  addonId: string;
  /** Typically 1, but could be more (e.g. extra breakfast servings) */
  quantity: number;
}
