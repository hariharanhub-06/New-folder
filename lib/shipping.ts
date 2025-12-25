// Delivery charges calculator based on pincode and quantity
// 1 quantity = 0.75 KG

export interface ShippingByPincode {
    zone: string;
    actualWeight: number;
    billableWeight: number;
    ratePerKg: number;
    totalCharges: number;
}

// Regional pricing per KG
const REGIONAL_RATES = {
    tamilnadu: { rate: 40, name: 'Tamil Nadu' },
    kerala: { rate: 80, name: 'Kerala' },
    othersHigh: { rate: 90, name: 'Other States (>50)' },
    othersLow: { rate: 200, name: 'Other States (<=50)' }
};

// Pincode ranges for each region
const PINCODE_RANGES = {
    // Tamil Nadu: 600000-643253
    tamilnadu: [
        { start: 600000, end: 643253 }
    ],
    // Pondicherry: 605001-609609
    pondicherry: [
        { start: 605001, end: 609609 }
    ],
    // Kerala: 670001-695615
    kerala: [
        { start: 670001, end: 695615 }
    ],
    // Andhra Pradesh: 500001-535594
    andhra: [
        { start: 500001, end: 535594 }
    ],
    // Karnataka: 560001-591346
    karnataka: [
        { start: 560001, end: 591346 }
    ]
};

// Weight per quantity (in KG)
const KG_PER_QUANTITY = 0.75;

/**
 * Get region and rate based on pincode
 */
function getRegionByPincode(pincode: string): { zone: string; rate: number } {
    const pin = parseInt(pincode);

    // Validate pincode format
    if (isNaN(pin) || pincode.length !== 6) {
        return { zone: REGIONAL_RATES.othersLow.name, rate: REGIONAL_RATES.othersLow.rate };
    }

    // Check Tamil Nadu (Starts with 600-649)
    if (pin >= 600000 && pin <= 649999) {
        return { zone: REGIONAL_RATES.tamilnadu.name, rate: REGIONAL_RATES.tamilnadu.rate };
    }

    // Check Kerala (Starts with 670-699)
    if (pin >= 670000 && pin <= 699999) {
        return { zone: REGIONAL_RATES.kerala.name, rate: REGIONAL_RATES.kerala.rate };
    }

    // Others based on first two digits
    const prefix = Math.floor(pin / 10000);
    if (prefix > 50) {
        return { zone: REGIONAL_RATES.othersHigh.name, rate: REGIONAL_RATES.othersHigh.rate };
    } else {
        return { zone: REGIONAL_RATES.othersLow.name, rate: REGIONAL_RATES.othersLow.rate };
    }
}

/**
 * Calculate shipping charges by pincode and weight
 * @param totalWeightInKg - Total weight of items in KG
 * @param pincode - Delivery pincode
 * @returns Detailed shipping breakdown
 */
export function calculateShippingByPincode(totalWeightInKg: number, pincode: string): ShippingByPincode {
    // Actual weight is passed directly
    const actualWeight = totalWeightInKg;

    // Calculate billable units (rounded up based on 1.1 KG per unit)
    const billableWeightUnits = Math.ceil(actualWeight / 1.1);

    // Get region and rate
    const { zone, rate } = getRegionByPincode(pincode);

    // Calculate total charges
    const totalCharges = billableWeightUnits * rate;

    return {
        zone,
        actualWeight,
        billableWeight: billableWeightUnits,
        ratePerKg: rate,
        totalCharges
    };
}

/**
 * Calculate shipping cost (backward compatible version)
 * @param weight - Weight in kg
 * @param country - Country name (defaults to India)
 * @param pincode - Optional pincode for India deliveries
 * @returns Shipping cost in rupees
 */
export function calculateShipping(weight: number, country?: string, pincode?: string): number {
    const isInternational = country && country !== 'India';

    // International shipping
    if (isInternational) {
        return 500; // Flat international shipping
    }

    // If pincode provided, use new calculation
    if (pincode && pincode.length === 6) {
        const result = calculateShippingByPincode(weight, pincode); // Pass weight directly
        return result.totalCharges;
    }

    // Fallback to simple weight-based calculation
    const billableUnits = Math.ceil(weight / 1.1);
    if (billableUnits <= 1) return 40; // Default to TN rate for 1 unit
    return billableUnits * 40; // Default to TN rate per unit
}

/**
 * Calculate total weight for cart items
 */
export function calculateCartWeight(items: Array<{ weight?: number; quantity: number }>): number {
    return items.reduce((total, item) => {
        const itemWeight = item.weight || 750; // Default 750g if not specified
        return total + (itemWeight * item.quantity);
    }, 0);
}

/**
 * Calculate total weight in kg for display
 */
export function calculateTotalWeight(items: Array<{ weight?: number; quantity: number }>): number {
    const weightInGrams = calculateCartWeight(items);
    return Math.round((weightInGrams / 1000) * 100) / 100; // Convert to kg, round to 2 decimals
}

/**
 * Calculate total quantity from cart items
 */
export function calculateTotalQuantity(items: Array<{ quantity: number }>): number {
    return items.reduce((total, item) => total + item.quantity, 0);
}
