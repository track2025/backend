const Currency = require('../models/Currencies');

const getAdminCurrencies = async (request, response) => {
  try {
    const { page: pageQuery, limit: limitQuery } = request.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;
    const skip = limit * (page - 1);

    const currencies = await Currency.find()
      .skip(skip)
      .limit(limit)
      .select('name code rate country status createdAt')
      .lean();

    response.status(200).json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    response.status(400).json({ success: false, message: error.message });
  }
};


const getCurrency = async (request, response) => {
  try {
    const currency = await Currency.findById(request.params.cid);

    response.status(200).json({
      success: true,
      data: currency,
      message: 'Currency created!',
    });
  } catch (error) {
    response.status(400).json({ success: false, message: error.message });
  }
};
const createCurrency = async (request, response) => {
  try {
    const currency = await Currency.create({ ...request.body });

    response.status(200).json({
      success: true,
      data: currency,
      message: 'Currency created!',
    });
  } catch (error) {
    response.status(400).json({ success: false, message: error.message });
  }
};
const updateCurrency = async (request, response) => {
  try {
    const currency = await Currency.findByIdAndUpdate(request.params.cid, {
      ...request.body,
    });

    response.status(200).json({
      success: true,
      data: currency,
      message: 'Currency updated!',
    });
  } catch (error) {
    response.status(400).json({ success: false, message: error.message });
  }
};
const deleteCurrency = async (request, response) => {
  try {
    const currency = await Currency.findByIdAndDelete(request.params.cid, {
      ...request.body,
    });

    response.status(200).json({
      success: true,
      data: currency,
      message: 'Currency deleted!',
    });
  } catch (error) {
    response.status(400).json({ success: false, message: error.message });
  }
};
// const getUserCurrencies = async (request, response) => {
//   try {
//     const currencies = await Currency.aggregate([
//       {
//         $sort: {
//           available: -1,
//         },
//       },

//       {
//         $project: {
//           name: 1,
//           code: 1,
//           rate: 1,
//           country: 1,
//         },
//       },
//     ]);

//     const data = await fetch(
//       'https://api.exchangerate-api.com/v4/latest/AED'
//     ).then((res) => res.json());
//     const mapped = currencies.map((v) => {
//       return { ...v, rate: v.rate || data.rates[v.code] };
//     });
//     response.status(200).json({
//       success: true,
//       data: mapped,
//     });
//   } catch (error) {
//     response.status(400).json({ success: false, message: error.message });
//   }
// };

const getUserCurrencies = async (request, response) => {
  try {
    // Fetch currencies and exchange rates in parallel
    const [currencies, exchangeRates] = await Promise.all([
      Currency.find()
        .sort({ available: -1 })
        .select('name code rate country')
        .lean(),
      fetch('https://api.exchangerate-api.com/v4/latest/AED')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch exchange rates');
          return res.json();
        })
    ]);

    // Map currencies with fallback rates
  const mappedCurrencies = currencies.map(currency => ({
      name: currency.name,
      code: currency.code,
      country: currency.country,
      rate: currency.rate || exchangeRates.rates[currency.code] || null
    }));

    response.status(200).json({
      success: true,
      data: mappedCurrencies
    });

  } catch (error) {
    console.error('Currency fetch error:', error);
    response.status(error instanceof Error ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch currency data'
    });
  }
};

module.exports = {
  getAdminCurrencies,
  getCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getUserCurrencies,
};
