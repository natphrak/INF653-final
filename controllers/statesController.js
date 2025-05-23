const State = require('../models/States');
const statesData = require('../data/statesData.json');

const getAllStates = async (req, res) => {
    let filteredStates = statesData;

    if (req?.query?.contig === 'true') {
        filteredStates = filteredStates.filter(state => state.code !== 'AK' && state.code !== 'HI');
    } else if (req?.query?.contig === 'false') {
        filteredStates = filteredStates.filter(state => state.code === 'AK' || state.code === 'HI');
    }

    try {
        const mergedStates = await Promise.all(
            filteredStates.map(async (state) => {
                const stateFromDB = await State.findOne({ stateCode: state.code }).exec();
                return stateFromDB
                    ? { ...state, funfacts: stateFromDB.funfacts }
                    : state;
            })
        );

        res.json(mergedStates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ 'message': 'Server error retrieving states' });
    }
};

const getState = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    try {
        const stateFromDB = await State.findOne({ stateCode }).exec();

        const result = stateFromDB
            ? { ...stateData, funfacts: stateFromDB.funfacts }
            : stateData;

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ 'message': 'Server error' });
    }
};

const getCapital = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        capital: stateData.capital_city
    });
};

const getNickname = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        nickname: stateData.nickname
    });
}

const getPopulation = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ message: 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const formattedPopulation = stateData.population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    res.json({
        state: stateData.state,
        population: formattedPopulation
    });
};

const getAdmission = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        admitted: stateData.admission_date
    });
}

const getRandomFunFact = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    try {
        const stateFromDB = await State.findOne({ stateCode }).exec();

        if (!stateFromDB || !stateFromDB.funfacts?.length) {
            return res.status(404).json({ 
                message: `No Fun Facts found for ${stateData.state}` 
            });
        }

        const randomIndex = Math.floor(Math.random() * stateFromDB.funfacts.length);
        const randomFact = stateFromDB.funfacts[randomIndex];

        res.json({ funfact: randomFact });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error, couldn\'t fetch Fun Fact' });
    }
};

const addFunFacts = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ message: 'State code parameter is required.' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const funfacts = req.body?.funfacts;

    if (!funfacts) {
        return res.status(400).json({ message: 'State fun facts value required' });
    }
    if (!funfacts || !Array.isArray(funfacts)) {
        return res.status(400).json({ message: 'State fun facts value must be an array'});
    }

    try {
        const state = await State.findOne({ stateCode }).exec();

        if (!state) {
            return res.status(404).json({ message: `No existing Fun Facts found for ${stateData.state}` });
        }

        state.funfacts.push(...funfacts);
        const result = await state.save();
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateFunFact = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ message: 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const { index, funfact } = req.body;

    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }
    if (!funfact) {
        return res.status(400).json({ message: 'State fun fact value required' });
    }

    try {
        const state = await State.findOne({ stateCode }).exec();

        if (!state || !Array.isArray(state.funfacts) || state.funfacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${stateData.state}` });
        }

        const zeroBasedIndex = index - 1;

        if (zeroBasedIndex < 0 || zeroBasedIndex >= state.funfacts.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${stateData.state}` });
        }

        state.funfacts[zeroBasedIndex] = funfact;
        const result = await state.save();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error, could not patch Fun Fact' });
    }
};

const deleteFunFact = async (req, res) => {
    if (!req?.params?.state) {
        return res.status(400).json({ message: 'State code parameter is required' });
    }

    const stateCode = req.params.state.toUpperCase();
    const stateData = statesData.find(state => state.code === stateCode);

    if (!stateData) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const index = req.query.index; // Get index from query parameters

    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }

    try {
        const state = await State.findOne({ stateCode }).exec();

        if (!state || !Array.isArray(state.funfacts) || state.funfacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${stateData.state}` });
        }

        const zeroBasedIndex = index - 1;

        if (zeroBasedIndex < 0 || zeroBasedIndex >= state.funfacts.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${stateData.state}` });
        }

        state.funfacts.splice(zeroBasedIndex, 1);
        const result = await state.save();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error, could not delete Fun Fact' });
    }
};


module.exports = {
    getAllStates,
    getState,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    getRandomFunFact,
    addFunFacts,
    updateFunFact,
    deleteFunFact
};
