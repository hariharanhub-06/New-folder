// Pincode to region mapping
const pincodeRegions = {
    // Tamil Nadu
    tamilnadu: {
        rate: 40,
        pincodeRanges: [
            { start: 600000, end: 643253 }
        ]
    },
    // Pondicherry
    pondicherry: {
        rate: 40,
        pincodeRanges: [
            { start: 605001, end: 609609 }
        ]
    },
    // Kerala
    kerala: {
        rate: 70,
        pincodeRanges: [
            { start: 670001, end: 695615 }
        ]
    },
    // Andhra Pradesh
    andhra: {
        rate: 70,
        pincodeRanges: [
            { start: 500001, end: 535594 }
        ]
    },
    // Karnataka
    karnataka: {
        rate: 80,
        pincodeRanges: [
            { start: 560001, end: 591346 }
        ]
    }
};

// Constants
const KG_PER_QUANTITY = 0.15;
const DEFAULT_RATE = 200;

// Get region name for display
function getRegionName(pincode) {
    const pin = parseInt(pincode);

    // Check Tamil Nadu
    if (pin >= 600000 && pin <= 643253) {
        return 'Tamil Nadu';
    }

    // Check Pondicherry
    if (pin >= 605001 && pin <= 609609) {
        return 'Pondicherry';
    }

    // Check Kerala
    if (pin >= 670001 && pin <= 695615) {
        return 'Kerala';
    }

    // Check Andhra Pradesh
    if (pin >= 500001 && pin <= 535594) {
        return 'Andhra Pradesh';
    }

    // Check Karnataka
    if (pin >= 560001 && pin <= 591346) {
        return 'Karnataka';
    }

    return 'Other State';
}

// Get delivery rate based on pincode
function getDeliveryRate(pincode) {
    const pin = parseInt(pincode);

    // Check each region
    for (const [region, data] of Object.entries(pincodeRegions)) {
        for (const range of data.pincodeRanges) {
            if (pin >= range.start && pin <= range.end) {
                return data.rate;
            }
        }
    }

    // Default rate for other states
    return DEFAULT_RATE;
}

// Calculate billable weight (rounded up to nearest kg)
function calculateBillableWeight(actualWeight) {
    return Math.ceil(actualWeight);
}

// Calculate delivery charges
function calculateDeliveryCharges(pincode, quantity) {
    // Calculate actual weight
    const actualWeight = quantity * KG_PER_QUANTITY;

    // Calculate billable weight (rounded up)
    const billableWeight = calculateBillableWeight(actualWeight);

    // Get rate per kg based on pincode
    const ratePerKg = getDeliveryRate(pincode);

    // Get region name
    const region = getRegionName(pincode);

    // Calculate total charges
    const totalCharges = billableWeight * ratePerKg;

    return {
        region,
        actualWeight,
        billableWeight,
        ratePerKg,
        totalCharges
    };
}

// Format number with Indian currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Display results
function displayResults(results) {
    const resultDiv = document.getElementById('result');

    // Update result values
    document.getElementById('region').textContent = results.region;
    document.getElementById('weight').textContent = `${results.actualWeight.toFixed(2)} KG`;
    document.getElementById('billableWeight').textContent = `${results.billableWeight} KG`;
    document.getElementById('rate').textContent = formatCurrency(results.ratePerKg);
    document.getElementById('totalCharges').textContent = formatCurrency(results.totalCharges);

    // Show result with animation
    resultDiv.classList.remove('hidden');

    // Scroll to result smoothly
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Form validation
function validatePincode(pincode) {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
}

// Handle form submission
document.getElementById('deliveryForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const pincode = document.getElementById('pincode').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);

    // Validate inputs
    if (!validatePincode(pincode)) {
        alert('Please enter a valid 6-digit pincode');
        return;
    }

    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity (minimum 1)');
        return;
    }

    // Calculate and display results
    const results = calculateDeliveryCharges(pincode, quantity);
    displayResults(results);
});

// Input validation for pincode (only numbers)
document.getElementById('pincode').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Input validation for quantity (only positive numbers)
document.getElementById('quantity').addEventListener('input', function (e) {
    if (this.value < 0) {
        this.value = 1;
    }
});

// Add enter key support
document.getElementById('pincode').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('quantity').focus();
    }
});
