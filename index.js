import { google } from 'googleapis';

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import dotenv from 'dotenv';

import {
  getDonorsInfo
} from './utils.js';

if (process.env.NODE_ENV === 'development') {
  dotenv.config();
}

const PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('utf8');
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const SPREADSHEET_ID_1 = process.env.SPREADSHEET_ID_1;
const range = 'A:H';
const PORT = process.env.PORT;

async function main() {
  const service = google.sheets('v4');

  const authClient = new google.auth.JWT(
    CLIENT_EMAIL,
    null,
    PRIVATE_KEY.replace(/\\n/g, "\n"),
    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/forms', 'https://www.googleapis.com/auth/forms.currentonly', 'https://www.googleapis.com/auth/drive']
  );

  const app = express();

  app.listen(PORT, () => {
    app.use(bodyParser.json());
    app.use(cors());
    app.use('/donors/v1', async (req, res) => {
      try {
        const data = await getDonorsInfo(service, authClient, SPREADSHEET_ID_1, range);
        res.status(200).json({ data });
      }
      catch(error) {
        res.status(204).json({ error: 'could not get form data' });
      }
    })
  })
}

try {
  main();
}
catch(error) {
  console.log(error);
}

