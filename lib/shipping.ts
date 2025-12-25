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
    tamilnadu: { rate: 50, name: 'Tamil Nadu' }, // Updated from 40 to 50
    kerala: { rate: 80, name: 'Kerala' },
    tier2: { rate: 90, name: 'Andhra, Karnataka, Assam, Arunachal, Bihar' },
    others: { rate: 200, name: 'Other States' }
};

// ... existing code ...

/**
 * Get region and rate based on pincode
 */
function getRegionByPincode(pincode: string): { zone: string; rate: number } {
    const pin = parseInt(pincode);

    // Validate pincode format
    if (isNaN(pin) || pincode.length !== 6) {
        return { zone: REGIONAL_RATES.others.name, rate: REGIONAL_RATES.others.rate };
    }

    const prefix2 = Math.floor(pin / 10000); // First 2 digits
    const prefix3 = Math.floor(pin / 1000);  // First 3 digits

    // 1. Tamil Nadu (60-66) -> ₹50
    if (prefix2 >= 60 && prefix2 <= 66) {
        return { zone: REGIONAL_RATES.tamilnadu.name, rate: REGIONAL_RATES.tamilnadu.rate };
    }

    // 2. Kerala (67-69) -> ₹80
    if (prefix2 >= 67 && prefix2 <= 69) {
        return { zone: REGIONAL_RATES.kerala.name, rate: REGIONAL_RATES.kerala.rate };
    }

    // 3. Tier 2 (Andhra, Karnataka, Assam, Arunachal, Bihar) -> ₹90
    // Andhra: 51-53
    if (prefix2 >= 51 && prefix2 <= 53) {
        return { zone: 'Andhra Pradesh', rate: REGIONAL_RATES.tier2.rate };
    }
    // Karnataka: 56-59
    if (prefix2 >= 56 && prefix2 <= 59) {
        return { zone: 'Karnataka', rate: REGIONAL_RATES.tier2.rate };
    }
    // Assam: 78
    if (prefix2 === 78) {
        return { zone: 'Assam', rate: REGIONAL_RATES.tier2.rate };
    }
    // Bihar: 80-82
    if (prefix2 >= 80 && prefix2 <= 82) {
        return { zone: 'Bihar', rate: REGIONAL_RATES.tier2.rate };
    }
    // Arunachal Pradesh: 790-792
    if (prefix3 >= 790 && prefix3 <= 792) {
        return { zone: 'Arunachal Pradesh', rate: REGIONAL_RATES.tier2.rate };
    }

    // 4. All others -> ₹200
    return { zone: REGIONAL_RATES.others.name, rate: REGIONAL_RATES.others.rate };
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
