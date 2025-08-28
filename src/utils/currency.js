module.exports = {
  rates: {
    // 🌍 Major World Currencies
    USD: 1, // US Dollar
    EUR: 0.92, // Euro
    GBP: 0.78, // British Pound
    JPY: 146.5, // Japanese Yen
    AUD: 1.48, // Australian Dollar
    CAD: 1.36, // Canadian Dollar
    CHF: 0.88, // Swiss Franc
    CNY: 7.25, // Chinese Yuan
    HKD: 7.82, // Hong Kong Dollar
    SGD: 1.34, // Singapore Dollar
    NZD: 1.62, // New Zealand Dollar
    SEK: 10.55, // Swedish Krona
    NOK: 10.7, // Norwegian Krone
    DKK: 6.85, // Danish Krone
    RUB: 93.2, // Russian Ruble
    BRL: 5.25, // Brazilian Real
    MXN: 17.2, // Mexican Peso
    ARS: 935.0, // Argentine Peso
    CLP: 920.0, // Chilean Peso
    COP: 4030.0, // Colombian Peso
    ZAR: 18.2, // South African Rand
    INR: 83.1, // Indian Rupee
    IDR: 15400.0, // Indonesian Rupiah
    KRW: 1320.0, // South Korean Won
    THB: 34.7, // Thai Baht
    MYR: 4.6, // Malaysian Ringgit
    PHP: 56.2, // Philippine Peso
    VND: 24700.0, // Vietnamese Dong
    NGN: 1575.0, // Nigerian Naira
    KES: 130.0, // Kenyan Shilling

    // 🌙 Middle East & Nearby
    AED: 3.67, // UAE Dirham
    SAR: 3.75, // Saudi Riyal
    QAR: 3.64, // Qatari Riyal
    KWD: 0.31, // Kuwaiti Dinar
    OMR: 0.38, // Omani Rial
    BHD: 0.38, // Bahraini Dinar
    EGP: 48.5, // Egyptian Pound
    TRY: 32.4, // Turkish Lira
    ILS: 3.75, // Israeli Shekel
    JOD: 0.71, // Jordanian Dinar
    LBP: 89500.0, // Lebanese Pound (highly volatile)
    IRR: 42000.0, // Iranian Rial (official rate)
    PKR: 278.5, // Pakistani Rupee
    AFN: 72.5, // Afghan Afghani
  },

  defaultCurrency: process.env.BASE_CURRENCY || "GBP",

  convertPrice: function(rates, price, fromCurrency, toCurrency = "GBP") {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (fromRate && toRate && price) {
      return Number(((price / fromRate) * toRate).toFixed(2));
    }
    return price;
  },
};
