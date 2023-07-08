export const getState = (state, country) => {
  if (country !== 'United States') return null;
  if (state === 'Prefer not  to say') return null;
  return state.split(',')[1].replace(' ', '');
}

export const getFreq = (str) => {
  if (str === 'Occasionally') return 'O';
  if (str === 'Monthly') return 'M';
  if (str === 'Annually') return 'Y';
  return 'N'
}

export const getAmount = (str) => {
  return parseInt(str.replace('$', ''));
}

export const getPurposes = (str) => {
  return str.split(' ').reduce((purposes, word) => {
    if (word === '(GP)' || word === '(KIDS)') return purposes.concat(word.replace('(', '').replace(')', ''));
    return purposes;
  }, [])
}

export const getEmail = (str) => {
  return str || null;
}

export const getAmountByFreq = (amount, freq) => {
  if (freq === 'O') return amount / 12;
  return amount;
}

export const getAmountByPurpose = (amount, purposes, purpose) => {
  if (!purposes.includes(purpose)) return 0;
  return amount / purposes.length;
}

export const getAmountPerPurpose = (results, answer, purpose) => {
  const { freq, amount, purposes } = answer;
  return results.programs[purpose].amount + getAmountByFreq(getAmountByPurpose(amount, purposes, purpose), freq);
}

export const getMonthlyDonors = (results, answer) => {
  if (answer.freq === 'M') return results.demographics.monthly_donors + 1;
  return results.demographics.monthly_donors;
}

export const getAnnuallyDonors = (results, answer) => {
  if (answer.freq === 'Y') return results.demographics.annually_donors + 1;
  return results.demographics.annually_donors;
}

export const getCountries = (results, answer) => {
  return {
    ...results.demographics.countries,
    [answer.country]: (results.demographics.countries[answer.country] || 0) + 1
  }
}

export const getStates = (results, answer) => {
  return {
    ...results.demographics.states,
    [answer.state || 'Unknown']: (results.demographics.states[answer.state] || 0) + 1
  }
}

export const getDonorsInfo = async (service, authClient, spreadsheetId, range) => {
  try {
    const token = await authClient.authorize();

    authClient.setCredentials(token);

    const res = await service.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId,
      range
    })

    const answers = res.data.values.slice(1)
      .reduce((answers, row) => {
        return answers.concat({
          timestamp: row[0],
          firstName: row[1],
          country: row[2],
          state: getState(row[3], row[2]),
          freq: getFreq(row[4]),
          amount: getAmount(row[5]),
          purposes: getPurposes(row[6]),
          email: getEmail(row[7])
        })
      }, [])

    const results = answers.reduce((results, answer) => {
      return {
        programs: {
          GP: {
            amount: getAmountPerPurpose(results, answer, 'GP')
          },
          KIDS: {
            amount: getAmountPerPurpose(results, answer, 'KIDS')
          }
        },
        demographics: {
          donors: results.demographics.donors + 1,
          monthly_donors: getMonthlyDonors(results, answer),
          annually_donors: getAnnuallyDonors(results, answer),
          countries: getCountries(results, answer),
          states: getStates(results, answer)
        }
      }
    }, defaultData)

    return results;
  }
  catch(error) {
    console.log(error)
  }
}

export const defaultData =  {
  programs: {
    GP: {
      amount: 0
    },
    KIDS: {
      amount: 0
    }
  },
  demographics: {
    donors: 0,
    monthly_donors: 0,
    annually_donors: 0,
    countries: {},
    states: {}
  }
}