/**
 * Property is the top-level rental unit (one minpaku building / cottage).
 * Rooms and parking slots belong to a Property.
 */
export interface Property {
  id: string;
  name: string;
  address: string;
  description: string;
  amenities: string[];
  photos: string[];
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  capacity: number;
  basePrice: number;
  photos: string[];
  description: string;
}

export interface ParkingSlot {
  id: string;
  propertyId: string;
  label: string;
}
